import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticate, createToken, hashPassword } from "@/lib/auth";
import { trackRankingMetric } from "@/lib/abRanking";
import { EVENT_TYPES, getClientIp, trackEvent } from "@/lib/eventTracker";
import { createOrderSchema } from "@/lib/schemas";
import { rateLimiters } from "@/middleware/rateLimit";
import { sanitizeAddress } from "@/lib/sanitize";

const GUEST_CUSTOMER_EMAIL = "guest.checkout@globalhub.com";
const GUEST_CUSTOMER_PHONE = "00000000000";
const LOCAL_TAX_RATE = 0;
const IMPORTED_TAX_RATE = 0.08;

type DeliveryArea = "inside-dhaka" | "outside-dhaka";
type DeliverySpeed = "standard" | "express";

const SHIPPING_MATRIX: Record<DeliveryArea, Record<DeliverySpeed, number>> = {
  "inside-dhaka": { standard: 60, express: 120 },
  "outside-dhaka": { standard: 120, express: 180 },
};

function normalizeDeliveryArea(value: unknown): DeliveryArea {
  return value === "outside-dhaka" ? "outside-dhaka" : "inside-dhaka";
}

function normalizeDeliverySpeed(value: unknown): DeliverySpeed {
  return value === "express" ? "express" : "standard";
}

function isImportedProduct(certifications: unknown, specifications: unknown): boolean {
  const certs = Array.isArray(certifications) ? certifications : [];
  const normalizedCerts = certs.map((cert) => String(cert));
  if (normalizedCerts.includes("live-imported") || normalizedCerts.includes("top20-import")) {
    return true;
  }

  if (specifications && typeof specifications === "object" && !Array.isArray(specifications)) {
    const source = String((specifications as Record<string, unknown>).source || "").toLowerCase();
    if (source && source !== "local") {
      return true;
    }
  }

  return false;
}

function isImportedGuestItem(item: Record<string, unknown>): boolean {
  const sourceType = String(item.sourceType || "").toUpperCase();
  if (sourceType === "IMPORTED") {
    return true;
  }

  const product = (item.product || {}) as Record<string, unknown>;
  const productSourceType = String(product.sourceType || "").toUpperCase();
  if (productSourceType === "IMPORTED") {
    return true;
  }

  return isImportedProduct(item.certifications, item.specifications)
    || isImportedProduct(product.certifications, product.specifications);
}

async function getOrCreateGuestUserId() {
  const existing = await prisma.user.findUnique({
    where: { email: GUEST_CUSTOMER_EMAIL },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: {
      email: GUEST_CUSTOMER_EMAIL,
      phone: GUEST_CUSTOMER_PHONE,
      password: "guest-checkout-no-login",
      role: "CUSTOMER",
      firstName: "Guest",
      lastName: "Customer",
    },
    select: { id: true },
  });

  return created.id;
}

async function getUniquePhone(preferredPhone?: string) {
  if (preferredPhone) {
    const existingByPhone = await prisma.user.findUnique({
      where: { phone: preferredPhone },
      select: { id: true },
    });
    if (!existingByPhone) return preferredPhone;
  }

  const generated = `9${Date.now().toString().slice(-10)}`;
  const exists = await prisma.user.findUnique({
    where: { phone: generated },
    select: { id: true },
  });

  if (!exists) return generated;
  return `8${Date.now().toString().slice(-10)}`;
}

function generateTrackingNumber(): string {
  // Format: TRACK-YYYYMMDD-RANDOMSTRING
  // Example: TRACK-20260323-ABC123DEF456
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  
  return `TRACK-${year}${month}${day}-${random}${timestamp}`;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImage: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.order.count({ where: { userId } });

    return NextResponse.json(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for payment operations
    const rateLimitResponse = await rateLimiters.payment(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const auth = await authenticate(request);
    const body = await request.json();

    // Validate request body with schema
    const validatedData = createOrderSchema.parse(body);

    const {
      cartId,
      shippingAddressId,
      directItems,
      isGuestCheckout,
      guestInfo,
      guestCartItems,
      createAccount,
      deliveryArea,
      deliverySpeed,
      rankingExperimentKey,
      rankingVariant,
    } = validatedData;

    const normalizedRankingVariant = String(rankingVariant || '').toUpperCase();
    const hasRankingExperiment =
      Boolean(rankingExperimentKey) &&
      (normalizedRankingVariant === 'A' || normalizedRankingVariant === 'B');

    if (!auth.success && !isGuestCheckout) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guest checkout flow
    if (!auth.success && isGuestCheckout) {
      if (!guestInfo || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
        return NextResponse.json(
          { error: "Guest info and cart items are required" },
          { status: 400 }
        );
      }

      // Sanitize guest information to prevent XSS
      const sanitizedGuestInfo = sanitizeAddress({
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        phone: guestInfo.phone,
        email: guestInfo.email,
        address: guestInfo.address,
        division: guestInfo.division,
        district: guestInfo.district,
        upazila: guestInfo.upazila,
        postCode: guestInfo.postCode,
      });

      let guestUserId = await getOrCreateGuestUserId();
      let accountToken: string | null = null;
      let accountCreated = false;

      if (createAccount && sanitizedGuestInfo?.email) {
        const existingByEmail = await prisma.user.findUnique({
          where: { email: sanitizedGuestInfo.email },
          select: { id: true },
        });

        if (!existingByEmail) {
          const uniquePhone = await getUniquePhone(sanitizedGuestInfo.phone);
          const password = await hashPassword(`Guest@${Date.now().toString().slice(-6)}`);

          const createdUser = await prisma.user.create({
            data: {
              email: sanitizedGuestInfo.email,
              phone: uniquePhone,
              password,
              role: "CUSTOMER",
              firstName: sanitizedGuestInfo.firstName || "Guest",
              lastName: sanitizedGuestInfo.lastName || "Customer",
            },
          });

          await prisma.userAddress.create({
            data: {
              userId: createdUser.id,
              label: guestInfo.label || "Home",
              firstName: sanitizedGuestInfo.firstName || "Guest",
              lastName: sanitizedGuestInfo.lastName || "Customer",
              phone: sanitizedGuestInfo.phone || uniquePhone,
              email: sanitizedGuestInfo.email,
              division: sanitizedGuestInfo.division,
              district: sanitizedGuestInfo.district,
              upazila: sanitizedGuestInfo.upazila,
              address: sanitizedGuestInfo.address,
              postCode: sanitizedGuestInfo.postCode || null,
              isDefault: true,
            },
          });

          guestUserId = createdUser.id;
          accountCreated = true;
          accountToken = await createToken(
            {
              userId: createdUser.id,
              email: createdUser.email,
              role: createdUser.role,
            },
            24 * 60 * 60
          );
        }
      }

      const normalizedDeliveryArea = normalizeDeliveryArea(deliveryArea || guestInfo?.deliveryArea);
      const normalizedDeliverySpeed = normalizeDeliverySpeed(deliverySpeed || guestInfo?.deliverySpeed);

      const guestProductIds = Array.from(
        new Set(
          guestCartItems
            .map((item: any) => String(item.productId || ""))
            .filter((id: string) => Boolean(id))
        )
      );

      const guestProducts = guestProductIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: guestProductIds } },
            select: { id: true, currentPrice: true, certifications: true, specifications: true },
          })
        : [];

      const guestProductMap = new Map(
        guestProducts.map((product) => [product.id, product])
      );

      // Rebuild subtotal from DB product prices (server-authoritative)
      const subtotal = guestCartItems.reduce((sum: number, item: any) => {
        const productId = String(item.productId || "");
        const product = guestProducts.find((p) => p.id === productId);
        const price = product ? Number(product.currentPrice) : 0;
        return sum + price * Number(item.quantity || 1);
      }, 0);

      const importedSubtotal = guestCartItems.reduce((sum: number, item: any) => {
        const productId = String(item.productId || "");
        const product = guestProducts.find((p) => p.id === productId);
        const price = product ? Number(product.currentPrice) : 0;
        const lineTotal = price * Number(item.quantity || 1);
        const mappedProduct = guestProductMap.get(productId);
        const imported = mappedProduct
          ? isImportedProduct(mappedProduct.certifications, mappedProduct.specifications)
          : isImportedGuestItem(item);
        return imported ? sum + lineTotal : sum;
      }, 0);

      const localSubtotal = Math.max(0, subtotal - importedSubtotal);
      const tax = (localSubtotal * LOCAL_TAX_RATE) + (importedSubtotal * IMPORTED_TAX_RATE);
      const shipping = SHIPPING_MATRIX[normalizedDeliveryArea][normalizedDeliverySpeed];
      const totalAmount = subtotal + tax + shipping;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: guestUserId,
          trackingNumber: generateTrackingNumber(),
          shippingAddressId: `GUEST-${Date.now()}`,
          shippingAddress: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            phone: guestInfo.phone,
            email: guestInfo.email,
            address: guestInfo.address,
            division: guestInfo.division,
            district: guestInfo.district,
            upazila: guestInfo.upazila,
            postCode: guestInfo.postCode || "",
            label: guestInfo.label || "Guest Address",
            deliveryArea: normalizedDeliveryArea,
            deliverySpeed: normalizedDeliverySpeed,
          },
          subtotal: Number(subtotal),
          tax: Number(tax),
          shipping: Number(shipping),
          totalAmount: Number(totalAmount),
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "PENDING",
          items: {
            createMany: {
              data: guestCartItems.map((item: any) => {
                const productId = String(item.productId || "");
                const product = guestProducts.find((p) => p.id === productId);
                const price = product ? Number(product.currentPrice) : 0;
                return {
                  productId: item.productId,
                  quantity: Number(item.quantity || 1),
                  price, // Use DB-authoritative price only
                };
              }),
            },
          },
          notes: "Guest checkout order",
        },
        include: { items: true },
      });

      if (hasRankingExperiment) {
        await trackRankingMetric({
          experimentKey: String(rankingExperimentKey),
          variant: normalizedRankingVariant as 'A' | 'B',
          eventType: 'conversion',
          endpoint: 'orders_api_guest',
          userId: guestUserId,
          sessionId: request.headers.get('x-session-id') || undefined,
          orderId: order.id,
          conversionValue: Number(order.totalAmount),
          metadata: {
            checkoutType: 'guest',
            orderNumber: order.orderNumber,
          },
        });
      }

      await Promise.all(
        order.items.map((item) =>
          trackEvent({
            eventType: EVENT_TYPES.PURCHASE,
            userId: guestUserId,
            sessionId: request.headers.get('x-session-id'),
            productId: item.productId,
            orderId: order.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalValue: Number(item.price) * item.quantity,
            source: 'orders_api_guest',
            ipAddress: getClientIp(request.headers),
            userAgent: request.headers.get('user-agent'),
            metadata: {
              checkoutType: 'guest',
              orderNumber: order.orderNumber,
            },
          })
        )
      );

      return NextResponse.json(
        {
          message: "Guest order created successfully",
          order,
          accountCreated,
          token: accountToken,
        },
        { status: 201 }
      );
    }

    const userId = auth.data?.userId as string;

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const normalizedDeliveryArea = normalizeDeliveryArea(deliveryArea);
    const normalizedDeliverySpeed = normalizeDeliverySpeed(deliverySpeed);

    // Get shipping address
    const address = await prisma.userAddress.findUnique({
      where: { id: shippingAddressId },
    });

    if (!address || address.userId !== userId) {
      return NextResponse.json(
        { error: "Shipping address not found" },
        { status: 404 }
      );
    }

    // Direct Buy Now flow for authenticated users (without adding to cart)
    if (Array.isArray(directItems) && directItems.length > 0) {
      const normalizedDirectItems = directItems
        .map((item: any) => ({
          productId: String(item?.productId || ""),
          quantity: Math.max(1, Number(item?.quantity || 1)),
        }))
        .filter((item: any) => Boolean(item.productId));

      if (normalizedDirectItems.length === 0) {
        return NextResponse.json({ error: "No valid items for direct checkout" }, { status: 400 });
      }

      const directProductIds = Array.from(new Set(normalizedDirectItems.map((item) => item.productId)));
      const directProducts = await prisma.product.findMany({
        where: { id: { in: directProductIds } },
        select: { id: true, currentPrice: true, certifications: true, specifications: true },
      });
      const directProductMap = new Map(directProducts.map((product) => [product.id, product]));

      const subtotal = normalizedDirectItems.reduce((sum, item) => {
        const product = directProductMap.get(item.productId);
        const price = product ? Number(product.currentPrice) : 0;
        return sum + (price * item.quantity);
      }, 0);

      const importedSubtotal = normalizedDirectItems.reduce((sum, item) => {
        const product = directProductMap.get(item.productId);
        if (!product) return sum;
        const lineTotal = Number(product.currentPrice) * item.quantity;
        return isImportedProduct(product.certifications, product.specifications)
          ? sum + lineTotal
          : sum;
      }, 0);

      const localSubtotal = Math.max(0, subtotal - importedSubtotal);
      const tax = (localSubtotal * LOCAL_TAX_RATE) + (importedSubtotal * IMPORTED_TAX_RATE);
      const shipping = SHIPPING_MATRIX[normalizedDeliveryArea][normalizedDeliverySpeed];
      const totalAmount = subtotal + tax + shipping;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          trackingNumber: generateTrackingNumber(),
          shippingAddressId,
          shippingAddress: {
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            address: address.address,
            division: address.division,
            district: address.district,
            upazila: address.upazila,
            postCode: address.postCode,
            deliveryArea: normalizedDeliveryArea,
            deliverySpeed: normalizedDeliverySpeed,
          },
          subtotal: Number(subtotal),
          tax: Number(tax),
          shipping: Number(shipping),
          totalAmount: Number(totalAmount),
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "PENDING",
          items: {
            createMany: {
              data: normalizedDirectItems.map((item) => {
                const product = directProductMap.get(item.productId);
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  price: Number(product?.currentPrice || 0),
                };
              }),
            },
          },
          notes: "Direct buy now checkout",
        },
        include: { items: true },
      });

      if (hasRankingExperiment) {
        await trackRankingMetric({
          experimentKey: String(rankingExperimentKey),
          variant: normalizedRankingVariant as 'A' | 'B',
          eventType: 'conversion',
          endpoint: 'orders_api_direct',
          userId,
          sessionId: request.headers.get('x-session-id') || undefined,
          orderId: order.id,
          conversionValue: Number(order.totalAmount),
          metadata: {
            checkoutType: 'direct',
            orderNumber: order.orderNumber,
          },
        });
      }

      await Promise.all(
        order.items.map((item) =>
          trackEvent({
            eventType: EVENT_TYPES.PURCHASE,
            userId,
            sessionId: request.headers.get('x-session-id'),
            productId: item.productId,
            orderId: order.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalValue: Number(item.price) * item.quantity,
            source: 'orders_api_direct',
            ipAddress: getClientIp(request.headers),
            userAgent: request.headers.get('user-agent'),
            metadata: {
              checkoutType: 'direct',
              orderNumber: order.orderNumber,
            },
          })
        )
      );

      return NextResponse.json(
        {
          message: "Order created successfully",
          order,
        },
        { status: 201 }
      );
    }

    if (!cartId) {
      return NextResponse.json(
        { error: "Cart is required" },
        { status: 400 }
      );
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart || cart.userId !== userId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const cartProductIds = Array.from(new Set(cart.items.map((item) => item.productId)));
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: cartProductIds } },
      select: { id: true, certifications: true, specifications: true },
    });
    const cartProductMap = new Map(cartProducts.map((product) => [product.id, product]));

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (Number(item.priceSnapshot) * item.quantity),
      0
    );

    const importedSubtotal = cart.items.reduce((sum, item) => {
      const lineTotal = Number(item.priceSnapshot) * item.quantity;
      const product = cartProductMap.get(item.productId);
      const imported = product
        ? isImportedProduct(product.certifications, product.specifications)
        : false;
      return imported ? sum + lineTotal : sum;
    }, 0);

    const localSubtotal = Math.max(0, subtotal - importedSubtotal);
    const tax = (localSubtotal * LOCAL_TAX_RATE) + (importedSubtotal * IMPORTED_TAX_RATE);
    const shipping = SHIPPING_MATRIX[normalizedDeliveryArea][normalizedDeliverySpeed];
    const totalAmount = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        trackingNumber: generateTrackingNumber(),
        shippingAddressId,
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          address: address.address,
          division: address.division,
          district: address.district,
          upazila: address.upazila,
          postCode: address.postCode,
          deliveryArea: normalizedDeliveryArea,
          deliverySpeed: normalizedDeliverySpeed,
        },
        subtotal: Number(subtotal),
        tax: Number(tax),
        shipping: Number(shipping),
        totalAmount: Number(totalAmount),
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "PENDING",
        items: {
          createMany: {
            data: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.priceSnapshot,
            })),
          },
        },
      },
      include: { items: true },
    });

    if (hasRankingExperiment) {
      await trackRankingMetric({
        experimentKey: String(rankingExperimentKey),
        variant: normalizedRankingVariant as 'A' | 'B',
        eventType: 'conversion',
        endpoint: 'orders_api_cart',
        userId,
        sessionId: request.headers.get('x-session-id') || undefined,
        orderId: order.id,
        conversionValue: Number(order.totalAmount),
        metadata: {
          checkoutType: 'cart',
          orderNumber: order.orderNumber,
        },
      });
    }

    await Promise.all(
      order.items.map((item) =>
        trackEvent({
          eventType: EVENT_TYPES.PURCHASE,
          userId,
          sessionId: request.headers.get('x-session-id'),
          productId: item.productId,
          orderId: order.id,
          cartId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalValue: Number(item.price) * item.quantity,
          source: 'orders_api_cart',
          ipAddress: getClientIp(request.headers),
          userAgent: request.headers.get('user-agent'),
          metadata: {
            checkoutType: 'cart',
            orderNumber: order.orderNumber,
          },
        })
      )
    );

    // Mark cart as checked out
    await prisma.cart.update({
      where: { id: cartId },
      data: { status: "CHECKED_OUT" },
    });

    return NextResponse.json(
      {
        message: "Order created successfully",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
