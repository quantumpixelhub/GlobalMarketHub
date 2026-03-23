import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

function isPlaceholderConfig(value?: string | null): boolean {
  if (!value) return true;
  const normalized = value.trim();
  if (!normalized) return true;

  return (
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

  // For mobile wallet methods, always keep user in our hosted payment flow and
  // present the merchant wallet number + amount + transaction reference.
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

  const gatewayMap: Record<string, string | undefined> = {
    bkash: process.env.BKASH_PAYMENT_URL,
    nagad: process.env.NAGAD_PAYMENT_URL,
    rocket: process.env.ROCKET_PAYMENT_URL,
    uddoktapay: process.env.UDDOKTAPAY_PAYMENT_URL,
    stripe: process.env.STRIPE_PAYMENT_URL,
  };

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

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: "Order ID and payment method are required" },
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
      where: { gatewayName: paymentMethod as string },
    });

    if (!gateway || !gateway.isEnabled) {
      return NextResponse.json(
        { error: "Payment method not available" },
        { status: 400 }
      );
    }

    const gatewayMethod = String(paymentMethod).toLowerCase();
    const requiresMerchantWallet = ["bkash", "nagad", "rocket"].includes(gatewayMethod);

    if (requiresMerchantWallet && isPlaceholderConfig(gateway.merchantId)) {
      return NextResponse.json(
        {
          error: `${gateway.displayName || paymentMethod} is not configured yet. Please update merchant wallet number in payment gateway settings.`,
          code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    // Create payment transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: orderId as string,
        userId: order.userId,
        gatewayName: paymentMethod as string,
        amount: order.totalAmount,
        currency: "BDT",
        status: "PENDING",
        transactionFee: gateway.transactionFee,
        netAmount: (order.totalAmount as any) - (gateway.transactionFee as any),
        paymentMethod: paymentMethod as string,
        customerDetails: {
          email: order.user?.email,
          phone: order.user?.phone,
        },
      },
    });

    const paymentUrl = buildGatewayPaymentUrl(
      request,
      paymentMethod as string,
      transaction.id,
      order.totalAmount as unknown as number,
      order.id,
      gateway.merchantId,
      gateway.displayName
    );

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

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        transaction,
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
