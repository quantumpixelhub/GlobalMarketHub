import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true, rating: true } },
        variants: true,
        reviews: {
          where: { isApproved: true },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            user: { select: { firstName: true, lastName: true } },
            createdAt: true,
          },
          take: 5,
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
