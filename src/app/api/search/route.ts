import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liveMarketplaceSearch } from "@/lib/liveMarketplaceSearch";

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

const INTERNATIONAL_PLATFORMS = new Set(['amazon', 'alibaba', 'aliexpress']);

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

const buildSearchWhere = (query: string, categoryId: string | null) => {
  const trimmed = query.trim();
  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const base: any = {
    isActive: true,
  };

  if (categoryId) {
    base.categoryId = categoryId;
  }

  if (!trimmed) {
    return base;
  }

  const primaryOr: any[] = [
    { title: { contains: trimmed, mode: 'insensitive' } },
    { description: { contains: trimmed, mode: 'insensitive' } },
    { category: { name: { contains: trimmed, mode: 'insensitive' } } },
    { category: { slug: { contains: trimmed, mode: 'insensitive' } } },
    { seller: { storeName: { contains: trimmed, mode: 'insensitive' } } },
    {
      externalProducts: {
        some: {
          isTracked: true,
          platform: { contains: trimmed, mode: 'insensitive' },
        },
      },
    },
  ];

  if (tokens.length > 1) {
    const tokenOr = tokens.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { category: { name: { contains: token, mode: 'insensitive' } } },
      { category: { slug: { contains: token, mode: 'insensitive' } } },
      { seller: { storeName: { contains: token, mode: 'insensitive' } } },
      {
        externalProducts: {
          some: {
            isTracked: true,
            platform: { contains: token, mode: 'insensitive' },
          },
        },
      },
    ]);

    return {
      ...base,
      OR: [
        ...primaryOr,
        {
          AND: [
            {
              OR: tokenOr,
            },
          ],
        },
      ],
    };
  }

  return {
    ...base,
    OR: primaryOr,
  };
};

const buildExternalSearchWhere = (query: string) => {
  const trimmed = query.trim();
  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const base: any = {
    isTracked: true,
    isSynthetic: false,
  };

  if (!trimmed) {
    return base;
  }

  const primaryOr: any[] = [
    { title: { contains: trimmed, mode: 'insensitive' } },
    { sellerName: { contains: trimmed, mode: 'insensitive' } },
    { categoryName: { contains: trimmed, mode: 'insensitive' } },
    { platform: { contains: trimmed, mode: 'insensitive' } },
  ];

  if (tokens.length > 1) {
    const tokenOr = tokens.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' } },
      { sellerName: { contains: token, mode: 'insensitive' } },
      { categoryName: { contains: token, mode: 'insensitive' } },
      { platform: { contains: token, mode: 'insensitive' } },
    ]);

    return {
      ...base,
      OR: [...primaryOr, { AND: [{ OR: tokenOr }] }],
    };
  }

  return {
    ...base,
    OR: primaryOr,
  };
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
    const productSearchWhere: any = buildSearchWhere(q, categoryId);
    const localWhere: any = {
      ...productSearchWhere,
    };

    if (minPrice || maxPrice) {
      localWhere.currentPrice = {};
      if (minPrice) {
        localWhere.currentPrice.gte = Number(minPrice);
      }
      if (maxPrice) {
        localWhere.currentPrice.lte = Number(maxPrice);
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
      where: localWhere,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, storeName: true } },
      },
    });

    const total = await prisma.product.count({ where: localWhere });

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

    const externalWhere: any = buildExternalSearchWhere(q);

    if (minPrice || maxPrice) {
      externalWhere.externalPrice = {};
      if (minPrice) {
        externalWhere.externalPrice.gte = Number(minPrice);
      }
      if (maxPrice) {
        externalWhere.externalPrice.lte = Number(maxPrice);
      }
    }

    const externalOfferTake = Math.min(Math.max(limit * 12, 120), 360);

    const externalOffers = await prisma.externalProduct.findMany({
      where: externalWhere,
      take: externalOfferTake,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            mainImage: true,
            rating: true,
            reviewCount: true,
            isFeatured: true,
            seller: { select: { id: true, storeName: true } },
          },
        },
      },
    });

    const domesticSellers: SearchListing[] = [];
    const internationalSellers: SearchListing[] = [];

    externalOffers.forEach((external) => {
      const product = external.product;
      const listingTitle = external.title || product?.title;
      const listingImage = external.imageUrl || product?.mainImage;

      if (!listingTitle || !listingImage) {
        return;
      }

      const normalizedPlatform = normalizePlatform(external.platform);
      const listing: SearchListing = {
        id: `ext-${external.id}`,
        title: listingTitle,
        currentPrice: Number(external.externalPrice),
        originalPrice: Number(external.externalOriginalPrice || external.externalPrice),
        mainImage: listingImage,
        rating: Number(external.externalRating || product?.rating || 0),
        reviewCount: clampReviewCount(external.externalReviewCount || product?.reviewCount || 0),
        stock: 999,
        isFeatured: product?.isFeatured,
        externalUrl: external.externalUrl,
        sourceType: INTERNATIONAL_PLATFORMS.has(normalizedPlatform) ? 'INTERNATIONAL' : 'DOMESTIC',
        sourcePlatform: external.platform,
        lastSyncedAt: external.lastSyncedAt ? external.lastSyncedAt.toISOString() : undefined,
        seller: {
          id: product?.seller?.id || `ext-seller-${external.id}`,
          storeName: external.sellerName || `${external.platform} marketplace`,
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

    // If DB has no external matches for the query yet, fetch live results directly from source pages.
    if (q.trim() && (domesticSellers.length === 0 || internationalSellers.length === 0)) {
      try {
        const live = await liveMarketplaceSearch(q, Math.min(Math.max(limit, 12), 24));

        if (domesticSellers.length === 0) {
          live.domestic.forEach((offer, index) => {
            domesticSellers.push({
              id: `live-domestic-${index}-${offer.platform}`,
              title: offer.title,
              currentPrice: offer.currentPrice,
              originalPrice: offer.originalPrice,
              mainImage: offer.imageUrl || '/images/placeholder-product.svg',
              rating: 0,
              reviewCount: 0,
              stock: 999,
              isFeatured: false,
              externalUrl: offer.externalUrl,
              sourceType: 'DOMESTIC',
              sourcePlatform: offer.platform,
              lastSyncedAt: new Date().toISOString(),
              seller: {
                id: `live-${offer.platform}`,
                storeName: offer.sellerName,
              },
            });
          });
        }

        if (internationalSellers.length === 0) {
          live.international.forEach((offer, index) => {
            internationalSellers.push({
              id: `live-international-${index}-${offer.platform}`,
              title: offer.title,
              currentPrice: offer.currentPrice,
              originalPrice: offer.originalPrice,
              mainImage: offer.imageUrl || '/images/placeholder-product.svg',
              rating: 0,
              reviewCount: 0,
              stock: 999,
              isFeatured: false,
              externalUrl: offer.externalUrl,
              sourceType: 'INTERNATIONAL',
              sourcePlatform: offer.platform,
              lastSyncedAt: new Date().toISOString(),
              seller: {
                id: `live-${offer.platform}`,
                storeName: offer.sellerName,
              },
            });
          });
        }
      } catch (liveError) {
        console.error('Live marketplace fallback error:', liveError);
      }
    }

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
