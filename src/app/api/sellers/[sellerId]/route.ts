import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // Get seller
    const seller = await prisma.seller.findUnique({
      where: { id: params.sellerId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get seller's products
    const products = await prisma.product.findMany({
      where: {
        sellerId: params.sellerId,
        isActive: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    const total = await prisma.product.count({
      where: {
        sellerId: params.sellerId,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        seller,
        products,
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
    console.error("Get seller products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
