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

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                currentPrice: true,
                mainImage: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create new cart if doesn't exist
      cart = await prisma.cart.create({
        data: {
          userId,
          status: "ACTIVE",
          items: {
            create: [],
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  currentPrice: true,
                  mainImage: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (Number(item.priceSnapshot) * item.quantity),
      0
    );

    return NextResponse.json(
      {
        cartId: cart.id,
        items: cart.items,
        subtotal,
        itemCount: cart.items.length,
        totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart error:", error);
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

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product or quantity" },
        { status: 400 }
      );
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, status: "ACTIVE" },
      });
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          priceSnapshot: Number(product.currentPrice),
        },
      });
    }

    return NextResponse.json(
      { message: "Item added to cart", cartId: cart.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
