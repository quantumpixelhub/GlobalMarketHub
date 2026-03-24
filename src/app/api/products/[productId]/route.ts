import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

type VariantInput = {
  attributeName?: string;
  attributeValue?: string;
  price?: number | string;
  stock?: number | string;
  sku?: string;
};

function normalizeVariants(rawVariants: unknown): Array<{
  attributes: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
}> {
  if (!Array.isArray(rawVariants)) return [];

  return rawVariants
    .map((variant) => {
      const input = variant as VariantInput;
      const attributeName = String(input.attributeName || "").trim().toLowerCase();
      const attributeValue = String(input.attributeValue || "").trim();
      const price = Number(input.price);
      const stock = Number(input.stock ?? 0);
      const sku = String(input.sku || "").trim();

      if (!attributeName || !attributeValue || !Number.isFinite(price) || price <= 0 || !sku) {
        return null;
      }

      return {
        attributes: { [attributeName]: attributeValue },
        price,
        stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
        sku,
      };
    })
    .filter((variant): variant is { attributes: Record<string, string>; price: number; stock: number; sku: string } => Boolean(variant));
}

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    const [product, soldAggregate, positiveReviewCount] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, storeName: true, rating: true, email: true, reviewCount: true } },
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
      }),
      prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            status: 'DELIVERED',
          },
        },
        _sum: {
          quantity: true,
        },
      }),
      prisma.review.count({
        where: {
          productId,
          isApproved: true,
          rating: {
            gte: 4,
          },
        },
      }),
    ]);

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        product: {
          ...product,
          totalSold: soldAggregate._sum.quantity || 0,
          positiveReviews: positiveReviewCount,
        },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      originalPrice,
      currentPrice,
      stock,
      categoryId,
      sellerId,
      mainImage,
      isActive,
      isFeatured,
      variants,
    } = body;

    const normalizedVariants = normalizeVariants(variants);

    const updated = await prisma.product.update({
      where: { id: params.productId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
        ...(currentPrice !== undefined && { currentPrice: Number(currentPrice) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(categoryId && { categoryId }),
        ...(sellerId && { sellerId }),
        ...(mainImage && { mainImage }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(Array.isArray(variants) && {
          variants: {
            deleteMany: {},
            ...(normalizedVariants.length > 0 && { create: normalizedVariants }),
          },
        }),
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.product.update({
      where: { id: params.productId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Product archived" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
