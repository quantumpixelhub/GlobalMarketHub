import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

// DELETE: Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== auth.data?.userId) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json(
      {
        message: "Item removed from cart",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Valid cart item ID and quantity are required" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== auth.data?.userId) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return NextResponse.json(
      {
        message: "Cart item updated",
        item: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
