import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { categorySlug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("order") || "desc";

    const skip = (page - 1) * limit;

    // Get category
    const category = await prisma.category.findUnique({
      where: { slug: params.categorySlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Build order clause
    const orderBy: any = {};
    if (sortBy === "price") {
      orderBy.currentPrice = sortOrder;
    } else if (sortBy === "rating") {
      orderBy.rating = sortOrder;
    } else if (sortBy === "reviews") {
      orderBy.reviewCount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get products in category
    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      skip,
      take: limit,
      orderBy,
      include: {
        seller: { select: { id: true, storeName: true, rating: true } },
      },
    });

    const total = await prisma.product.count({
      where: {
        categoryId: category.id,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        category,
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
    console.error("Get category products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
