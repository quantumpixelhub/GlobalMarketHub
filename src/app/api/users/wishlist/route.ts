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

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
            originalPrice: true,
            mainImage: true,
            rating: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        items: wishlist,
        count: wishlist.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get wishlist error:", error);
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
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already in wishlist" },
        { status: 400 }
      );
    }

    // Add to wishlist
    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
        priceWhenAdded: product.currentPrice,
      },
    });

    return NextResponse.json(
      {
        message: "Product added to wishlist",
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const item = await prisma.wishlistItem.findFirst({
      where: { userId, productId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not in wishlist" },
        { status: 404 }
      );
    }

    await prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return NextResponse.json(
      {
        message: "Product removed from wishlist",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
