import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, createToken, hashPassword } from "@/lib/auth";

const GUEST_CUSTOMER_EMAIL = "guest.checkout@globalhub.com";
const GUEST_CUSTOMER_PHONE = "00000000000";

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
    const auth = await authenticate(request);
    const body = await request.json();
    const {
      cartId,
      shippingAddressId,
      isGuestCheckout,
      guestInfo,
      guestCartItems,
      createAccount,
    } = body;

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

      let guestUserId = await getOrCreateGuestUserId();
      let accountToken: string | null = null;
      let accountCreated = false;

      if (createAccount && guestInfo?.email) {
        const existingByEmail = await prisma.user.findUnique({
          where: { email: guestInfo.email },
          select: { id: true },
        });

        if (!existingByEmail) {
          const uniquePhone = await getUniquePhone(guestInfo.phone);
          const password = await hashPassword(`Guest@${Date.now().toString().slice(-6)}`);

          const createdUser = await prisma.user.create({
            data: {
              email: guestInfo.email,
              phone: uniquePhone,
              password,
              role: "CUSTOMER",
              firstName: guestInfo.firstName || "Guest",
              lastName: guestInfo.lastName || "Customer",
            },
          });

          await prisma.userAddress.create({
            data: {
              userId: createdUser.id,
              label: guestInfo.label || "Home",
              firstName: guestInfo.firstName || "Guest",
              lastName: guestInfo.lastName || "Customer",
              phone: guestInfo.phone || uniquePhone,
              email: guestInfo.email,
              division: guestInfo.division,
              district: guestInfo.district,
              upazila: guestInfo.upazila,
              address: guestInfo.address,
              postCode: guestInfo.postCode || null,
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

      const subtotal = guestCartItems.reduce(
        (sum: number, item: any) => sum + Number(item.priceSnapshot) * Number(item.quantity || 1),
        0
      );
      const tax = subtotal * 0.05;
      const shipping = 100;
      const totalAmount = subtotal + tax + shipping;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: guestUserId,
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
              data: guestCartItems.map((item: any) => ({
                productId: item.productId,
                quantity: Number(item.quantity || 1),
                price: Number(item.priceSnapshot),
              })),
            },
          },
          notes: "Guest checkout order",
        },
        include: { items: true },
      });

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

    if (!cartId || !shippingAddressId) {
      return NextResponse.json(
        { error: "Cart and shipping address are required" },
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

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (Number(item.priceSnapshot) * item.quantity),
      0
    );
    const tax = subtotal * 0.05; // 5% tax
    const shipping = 100; // Fixed shipping for MVP
    const totalAmount = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
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
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
