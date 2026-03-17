import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("order") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.currentPrice = {};
      if (minPrice) {
        where.currentPrice.gte = Number(minPrice);
      }
      if (maxPrice) {
        where.currentPrice.lte = Number(maxPrice);
      }
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

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, storeName: true } },
      },
    });

    const total = await prisma.product.count({ where });

    return NextResponse.json(
      {
        results: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        query: q,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
