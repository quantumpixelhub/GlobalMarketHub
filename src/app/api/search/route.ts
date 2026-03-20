import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

type SortMode = 'best_price' | 'trust_seller' | 'most_reviews' | 'highest_rated' | 'best_value';

type SearchListing = {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  mainImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  externalUrl?: string;
  sourceType: 'LOCAL' | 'DOMESTIC' | 'INTERNATIONAL';
  sourcePlatform: string;
  lastSyncedAt?: string;
  seller: {
    id: string;
    storeName: string;
  };
};

const DOMESTIC_PLATFORMS = new Set([
  'daraz',
  'othoba',
  'pickaboo',
  'star-tech',
  'startech',
  'ryans',
  'chaldal',
  'rokomari',
  'gadget-and-gear',
  'gadgetandgear',
  'walton-digitech',
  'waltondigitech',
  'shajgoj',
]);

const INTERNATIONAL_PLATFORMS = new Set(['amazon', 'alibaba']);

const normalizePlatform = (platform: string) =>
  platform.toLowerCase().trim().replace(/\s+/g, '-');

const clampReviewCount = (value: number) => (Number.isFinite(value) ? value : 0);

const getSortMode = (value: string | null): SortMode => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'best_price') return 'best_price';
  if (normalized === 'trust_seller') return 'trust_seller';
  if (normalized === 'most_reviews') return 'most_reviews';
  if (normalized === 'highest_rated') return 'highest_rated';
  return 'best_value';
};

const compareListings = (mode: SortMode) => (a: SearchListing, b: SearchListing) => {
  if (mode === 'best_price') {
    return a.currentPrice - b.currentPrice;
  }

  if (mode === 'trust_seller') {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviewCount - a.reviewCount;
  }

  if (mode === 'most_reviews') {
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    return b.rating - a.rating;
  }

  if (mode === 'highest_rated') {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviewCount - a.reviewCount;
  }

  const valueScoreA = (a.rating * 20) + Math.min(a.reviewCount / 10, 30) - (a.currentPrice / 10000);
  const valueScoreB = (b.rating * 20) + Math.min(b.reviewCount / 10, 30) - (b.currentPrice / 10000);
  return valueScoreB - valueScoreA;
};

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
    const sortMode = getSortMode(searchParams.get('sortMode'));

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
        externalProducts: {
          where: { isTracked: true },
          select: {
            id: true,
            platform: true,
            externalUrl: true,
            externalPrice: true,
            externalOriginalPrice: true,
            externalRating: true,
            externalReviewCount: true,
            lastSyncedAt: true,
          },
        },
      },
    });

    const total = await prisma.product.count({ where });

    const localInventory: SearchListing[] = products.map((product) => ({
      id: product.id,
      title: product.title,
      currentPrice: Number(product.currentPrice),
      originalPrice: Number(product.originalPrice),
      mainImage: product.mainImage,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      stock: product.stock,
      isFeatured: product.isFeatured,
      sourceType: 'LOCAL',
      sourcePlatform: 'globalmarkethub',
      seller: {
        id: product.seller.id,
        storeName: product.seller.storeName,
      },
    }));

    const domesticSellers: SearchListing[] = [];
    const internationalSellers: SearchListing[] = [];

    products.forEach((product) => {
      product.externalProducts.forEach((external) => {
        const normalizedPlatform = normalizePlatform(external.platform);
        const listing: SearchListing = {
          id: `ext-${external.id}`,
          title: product.title,
          currentPrice: Number(external.externalPrice),
          originalPrice: Number(external.externalOriginalPrice || external.externalPrice),
          mainImage: product.mainImage,
          rating: Number(external.externalRating || product.rating),
          reviewCount: clampReviewCount(external.externalReviewCount || product.reviewCount),
          stock: 999,
          isFeatured: product.isFeatured,
          externalUrl: external.externalUrl,
          sourceType: INTERNATIONAL_PLATFORMS.has(normalizedPlatform) ? 'INTERNATIONAL' : 'DOMESTIC',
          sourcePlatform: external.platform,
          lastSyncedAt: external.lastSyncedAt ? external.lastSyncedAt.toISOString() : undefined,
          seller: {
            id: product.seller.id,
            storeName: product.seller.storeName,
          },
        };

        if (INTERNATIONAL_PLATFORMS.has(normalizedPlatform)) {
          internationalSellers.push(listing);
          return;
        }

        if (DOMESTIC_PLATFORMS.has(normalizedPlatform)) {
          domesticSellers.push(listing);
          return;
        }

        domesticSellers.push(listing);
      });
    });

    localInventory.sort(compareListings(sortMode));
    domesticSellers.sort(compareListings(sortMode));
    internationalSellers.sort(compareListings(sortMode));

    return NextResponse.json(
      {
        sections: {
          localInventory,
          domesticSellers,
          internationalSellers,
        },
        sortMode,
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
