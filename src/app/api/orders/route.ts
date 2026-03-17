import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

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
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const { cartId, shippingAddressId } = await request.json();

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
