import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { getUddoktaCredentialStatus, initiateUddoktaPay, verifyPaymentStatus } from "@/lib/paymentGateway";

const UDDOKTA_ROUTED_METHODS = new Set(["uddoktapay", "bkash", "nagad", "rocket"]);

function isPlaceholderConfig(value?: string | null): boolean {
  if (!value) return true;
  const normalized = value.trim();
  if (!normalized) return true;

  return (
    normalized.startsWith("MANUAL_") ||
    normalized.includes("_HERE") ||
    normalized.includes("_MERCHANT_ID") ||
    normalized.includes("_API_KEY") ||
    normalized.includes("_SECRET") ||
    normalized.includes("yourapp.com")
  );
}

function buildGatewayPaymentUrl(
  request: NextRequest,
  gatewayName: string,
  transactionId: string,
  amount: number | string,
  orderId: string,
  merchantNumber?: string | null,
  gatewayDisplayName?: string
) {
  const origin = new URL(request.url).origin;
  const method = gatewayName.toLowerCase();
  const fallbackInternalUrl = `${origin}/payment/mock?transactionId=${encodeURIComponent(transactionId)}&gateway=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(amount))}`;

  const gatewayMap: Record<string, string | undefined> = {
    bkash: process.env.BKASH_PAYMENT_URL,
    nagad: process.env.NAGAD_PAYMENT_URL,
    rocket: process.env.ROCKET_PAYMENT_URL,
    uddoktapay:
      process.env.UDDOKTAPAY_CHECKOUT_V2_URL ||
      process.env.UDDOKTAPAY_CHECKOUT_URL ||
      process.env.UDDOKTAPAY_PAYMENT_URL,
    stripe: process.env.STRIPE_PAYMENT_URL,
  };

  const configuredGatewayUrl = gatewayMap[method];

  // If real wallet gateway URL is configured, redirect there so payer can complete
  // payment using wallet credentials (number + OTP/PIN) on provider page.
  if (["bkash", "nagad", "rocket"].includes(method) && configuredGatewayUrl) {
    try {
      const target = new URL(configuredGatewayUrl);
      target.searchParams.set("orderId", orderId);
      target.searchParams.set("transactionId", transactionId);
      target.searchParams.set("amount", String(amount));
      if (merchantNumber) {
        target.searchParams.set("merchantNumber", merchantNumber);
      }
      return target.toString();
    } catch {
      // Invalid configured URL falls through to hosted manual wallet flow below.
    }
  }

  // Wallet manual mode fallback: keep user in hosted flow and
  // present merchant wallet number + amount + transaction reference.
  if (["bkash", "nagad", "rocket"].includes(method)) {
    const merchantPaymentUrl = new URL(`${origin}/payment/mock`);
    merchantPaymentUrl.searchParams.set("mode", "wallet");
    merchantPaymentUrl.searchParams.set("transactionId", transactionId);
    merchantPaymentUrl.searchParams.set("gateway", method);
    merchantPaymentUrl.searchParams.set("gatewayDisplay", gatewayDisplayName || gatewayName);
    merchantPaymentUrl.searchParams.set("amount", String(amount));
    merchantPaymentUrl.searchParams.set("orderId", orderId);
    if (merchantNumber) {
      merchantPaymentUrl.searchParams.set("merchantNumber", merchantNumber);
    }
    return merchantPaymentUrl.toString();
  }

  const defaultMap: Record<string, string> = {
    bkash: "https://www.bkash.com/",
    nagad: "https://www.nagad.com.bd/",
    rocket: "https://www.dutchbanglabank.com/rocket/rocket.html",
    uddoktapay: "https://uddoktapay.com/",
    stripe: "https://checkout.stripe.com/",
  };

  if (method === "cod") {
    return `${origin}/account`;
  }

  const configuredBaseUrl = gatewayMap[method] || defaultMap[method];

  if (!configuredBaseUrl) {
    return fallbackInternalUrl;
  }

  try {
    const target = new URL(configuredBaseUrl);
    target.searchParams.set("orderId", orderId);
    target.searchParams.set("transactionId", transactionId);
    target.searchParams.set("amount", String(amount));
    return target.toString();
  } catch {
    return fallbackInternalUrl;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const { orderId, paymentMethod, isGuestCheckout } = await request.json();
    const requestedPaymentMethod = String(paymentMethod || "").toLowerCase();
    const routeViaUddokta = UDDOKTA_ROUTED_METHODS.has(requestedPaymentMethod);
    const effectiveGatewayName = routeViaUddokta ? "uddoktapay" : requestedPaymentMethod;
    const origin = new URL(request.url).origin;

    if (!orderId || !requestedPaymentMethod) {
      return NextResponse.json(
        { error: "Order ID and payment method are required" },
        { status: 400 }
      );
    }

    if (requestedPaymentMethod === "cod") {
      return NextResponse.json(
        { error: "Cash on Delivery is not available" },
        { status: 400 }
      );
    }

    // Get order with owner
    const order = await prisma.order.findUnique({
      where: { id: orderId as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (auth.success) {
      const userId = auth.data?.userId as string;
      if (order.userId !== userId) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    } else if (!isGuestCheckout) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment gateway config
    const gateway = await prisma.paymentGatewayConfig.findUnique({
      where: { gatewayName: requestedPaymentMethod },
    });

    if (!gateway || !gateway.isEnabled) {
      return NextResponse.json(
        { error: "Payment method not available" },
        { status: 400 }
      );
    }

    const merchantNumber = isPlaceholderConfig(gateway.merchantId)
      ? null
      : gateway.merchantId;

    let uddoktaCredentialOverrides:
      | {
          apiKey?: string;
          checkoutUrl?: string;
          appUrl?: string;
        }
      | undefined;

    if (routeViaUddokta) {
      const uddoktaGateway = requestedPaymentMethod === "uddoktapay"
        ? gateway
        : await prisma.paymentGatewayConfig.findUnique({ where: { gatewayName: "uddoktapay" } });

      const fallbackApiKey = !isPlaceholderConfig(uddoktaGateway?.apiKey)
        ? String(uddoktaGateway?.apiKey || "")
        : "";

      const fallbackCheckoutUrl = !isPlaceholderConfig(uddoktaGateway?.webhookUrl)
        ? String(uddoktaGateway?.webhookUrl || "")
        : "";

      uddoktaCredentialOverrides = {
        apiKey: fallbackApiKey,
        checkoutUrl: fallbackCheckoutUrl,
        appUrl: origin,
      };

      const credentialStatus = getUddoktaCredentialStatus(origin, uddoktaCredentialOverrides);
      if (!credentialStatus.ready) {
        return NextResponse.json(
          {
            error: `UddoktaPay configuration missing: ${credentialStatus.missingRequired.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Create payment transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: orderId as string,
        userId: order.userId,
        gatewayName: effectiveGatewayName,
        amount: order.totalAmount,
        currency: "BDT",
        status: "PENDING",
        transactionFee: gateway.transactionFee,
        netAmount: (order.totalAmount as any) - (gateway.transactionFee as any),
        paymentMethod: requestedPaymentMethod,
        customerDetails: {
          email: order.user?.email,
          phone: order.user?.phone,
        },
      },
    });

    let paymentUrl = buildGatewayPaymentUrl(
      request,
      effectiveGatewayName,
      transaction.id,
      order.totalAmount as unknown as number,
      order.id,
      merchantNumber,
      gateway.displayName
    );

    if (routeViaUddokta) {
      const shippingAddress = (order.shippingAddress || {}) as Record<string, unknown>;
      const fullName = [shippingAddress.firstName, shippingAddress.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const uddoktaResponse = await initiateUddoktaPay({
        gateway: requestedPaymentMethod,
        amount: Number(order.totalAmount),
        // Use internal transaction id so callback can map directly.
        orderId: transaction.id,
        customerEmail: String(order.user?.email || shippingAddress.email || "customer@example.com"),
        customerPhone: String(order.user?.phone || shippingAddress.phone || ""),
        customerName: fullName || "Customer",
        appUrl: origin,
        uddoktaCredentials: uddoktaCredentialOverrides,
      });

      if (!uddoktaResponse.success || !uddoktaResponse.paymentUrl) {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            errorMessage: uddoktaResponse.message || "Failed to initiate UddoktaPay",
            completedAt: new Date(),
          },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });

        return NextResponse.json(
          { error: uddoktaResponse.message || "Failed to initiate UddoktaPay" },
          { status: 400 }
        );
      }

      paymentUrl = uddoktaResponse.paymentUrl;

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          gatewayTransactionId: uddoktaResponse.invoiceId || uddoktaResponse.transactionId || null,
          gatewayResponse: {
            initiatedAt: new Date().toISOString(),
            invoiceId: uddoktaResponse.invoiceId,
            providerTransactionId: uddoktaResponse.transactionId,
            paymentUrl: uddoktaResponse.paymentUrl,
            message: uddoktaResponse.message,
          },
        },
      });
    }

    return NextResponse.json(
      {
        message: "Payment initiated",
        transactionId: transaction.id,
        paymentUrl,
        amount: order.totalAmount,
        currency: "BDT",
        gateway: paymentMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Initiate payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const shouldVerify = searchParams.get("verify") === "true";
    const userId = String(auth.data?.userId || "");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            paymentStatus: true,
            status: true,
            notes: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.userId !== userId && transaction.order?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let latestTransaction = transaction;

    if (shouldVerify && transaction.status === "PENDING" && transaction.gatewayTransactionId) {
      const verifyGateway = String(transaction.gatewayName || "").toLowerCase();
      let uddoktaOverrides: { apiKey?: string } | undefined;

      if (verifyGateway === "uddoktapay") {
        const uddoktaGateway = await prisma.paymentGatewayConfig.findUnique({
          where: { gatewayName: "uddoktapay" },
          select: { apiKey: true },
        });

        const fallbackApiKey = !isPlaceholderConfig(uddoktaGateway?.apiKey)
          ? String(uddoktaGateway?.apiKey || "")
          : "";

        uddoktaOverrides = {
          apiKey: fallbackApiKey,
        };
      }

      const verification = await verifyPaymentStatus(
        verifyGateway,
        String(transaction.gatewayTransactionId),
        uddoktaOverrides
      );

      if (verification.status === "PENDING") {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            gatewayResponse: {
              ...(typeof transaction.gatewayResponse === "object" && transaction.gatewayResponse
                ? transaction.gatewayResponse
                : {}),
              verify: verification.raw || verification,
              verifiedAt: new Date().toISOString(),
              verificationStatus: "PENDING",
            } as any,
          },
        });
      } else if (!verification.success) {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            errorMessage: verification.message,
            completedAt: new Date(),
            gatewayResponse: {
              ...(typeof transaction.gatewayResponse === "object" && transaction.gatewayResponse
                ? transaction.gatewayResponse
                : {}),
              verify: verification.raw || verification,
              verifiedAt: new Date().toISOString(),
              verificationStatus: verification.status || "ERROR",
            } as any,
          },
        });

        await prisma.order.update({
          where: { id: transaction.orderId },
          data: {
            paymentStatus: "FAILED",
          },
        });
      } else {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            gatewayResponse: {
              ...(typeof transaction.gatewayResponse === "object" && transaction.gatewayResponse
                ? transaction.gatewayResponse
                : {}),
              verify: verification.raw || verification,
              verifiedAt: new Date().toISOString(),
              verificationStatus: verification.status,
            } as any,
          },
        });

        await prisma.order.update({
          where: { id: transaction.orderId },
          data: {
            paymentStatus: "SUCCESS",
            status: "PROCESSING",
            notes: `${transaction.order?.notes || ""}\n[Payment] Auto-verified via ${verifyGateway} at ${new Date().toISOString()}`.trim(),
          },
        });
      }

      const refreshed = await prisma.paymentTransaction.findUnique({
        where: { id: transaction.id },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              paymentStatus: true,
              status: true,
            },
          },
        },
      });

      if (refreshed) {
        latestTransaction = refreshed;
      }
    }

    return NextResponse.json(
      {
        transaction: latestTransaction,
        verification: {
          canVerify: Boolean(latestTransaction.gatewayTransactionId),
          verifiedOnRequest: shouldVerify,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
