import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liveMarketplaceSearch, type LiveOffer } from "@/lib/liveMarketplaceSearch";

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
  discountVerified?: boolean;
  seller: {
    id: string;
    storeName: string;
  };
};

const INTERNATIONAL_PLATFORMS = new Set(['amazon', 'alibaba', 'aliexpress']);
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 24;
const LIVE_DARAZ_TIMEOUT_MS = 9000;
const LIVE_EXPANDED_TIMEOUT_MS = 10000;
const EMERGENCY_DARAZ_TIMEOUT_MS = 7000;
const EMERGENCY_EXPANDED_TIMEOUT_MS = 7000;
const MAX_SECTION_RESULTS = 1000;
const SECTION_CACHE_TTL_MS = 3 * 60 * 1000;
const SECTION_STALE_MAX_MS = 20 * 60 * 1000;

type SectionCacheEntry = {
  createdAt: number;
  domestic: SearchListing[];
  international: SearchListing[];
  sourceStats?: {
    domesticByPlatform: Record<string, number>;
    internationalByPlatform: Record<string, number>;
    coverage?: string;
    errors?: string[];
    generatedAt?: string;
    fromCache?: boolean;
    stale?: boolean;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __gmhSectionResultCache: Map<string, SectionCacheEntry> | undefined;
  // eslint-disable-next-line no-var
  var __gmhSectionRebuildLocks: Map<string, Promise<void>> | undefined;
}

const sectionResultCache = globalThis.__gmhSectionResultCache || new Map<string, SectionCacheEntry>();
if (!globalThis.__gmhSectionResultCache) {
  globalThis.__gmhSectionResultCache = sectionResultCache;
}

const sectionRebuildLocks = globalThis.__gmhSectionRebuildLocks || new Map<string, Promise<void>>();
if (!globalThis.__gmhSectionRebuildLocks) {
  globalThis.__gmhSectionRebuildLocks = sectionRebuildLocks;
}

const normalizePlatform = (platform: string) =>
  platform.toLowerCase().trim().replace(/\s+/g, '-');

const clampReviewCount = (value: number) => (Number.isFinite(value) ? value : 0);

const cleanListingTitle = (value: string) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^Image\s+\d+:\s*/i, '')
    .trim();

const isNoisyListingTitle = (title: string) => {
  const normalized = cleanListingTitle(title).toLowerCase();
  if (!normalized) return true;
  if (normalized.length < 6 || normalized.length > 420) return true;
  if (/^image\b/.test(normalized)) return true;
  if (/^(page not found|search for products|categories|my account|cart|home)$/.test(normalized)) return true;
  if (/^(https?:\/\/|www\.)/.test(normalized)) return true;
  return false;
};

const dedupeListings = (items: SearchListing[]) => {
  const seenUrl = new Set<string>();
  const bestByTitle = new Map<string, SearchListing>();

  for (const item of items) {
    const title = cleanListingTitle(item.title);
    if (isNoisyListingTitle(title)) continue;
    if (!Number.isFinite(item.currentPrice) || item.currentPrice <= 0) continue;

    const canonicalUrl = String(item.externalUrl || '')
      .split('?')[0]
      .split('#')[0]
      .toLowerCase();
    if (canonicalUrl) {
      if (seenUrl.has(canonicalUrl)) continue;
      seenUrl.add(canonicalUrl);
    }

    const normalizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const priceBand = Math.max(1, Math.round(item.currentPrice / 100));
    const titleKey = `${String(item.sourcePlatform || 'unknown').toLowerCase()}|${normalizedTitle}|${priceBand}`;

    const candidate: SearchListing = {
      ...item,
      title,
    };

    const existing = bestByTitle.get(titleKey);
    if (!existing) {
      bestByTitle.set(titleKey, candidate);
      continue;
    }

    // Keep the better listing for near-identical titles (prefer lower price, then higher rating).
    if (candidate.currentPrice < existing.currentPrice) {
      bestByTitle.set(titleKey, candidate);
      continue;
    }

    if (candidate.currentPrice === existing.currentPrice && candidate.rating > existing.rating) {
      bestByTitle.set(titleKey, candidate);
    }
  }

  return Array.from(bestByTitle.values());
};

const buildPlatformCountMap = (items: SearchListing[]) => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = String(item.sourcePlatform || 'unknown').toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

type BuildSectionPoolArgs = {
  q: string;
  page: number;
  limit: number;
  sectionFetchTarget: number;
  externalWhere: any;
};

const buildSectionPools = async ({ q, page, sectionFetchTarget, externalWhere }: BuildSectionPoolArgs) => {
  const externalOfferTake = Math.min(sectionFetchTarget, MAX_SECTION_RESULTS);
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

  let domesticSellers: SearchListing[] = [];
  let internationalSellers: SearchListing[] = [];
  const liveResults: { domestic: LiveOffer[]; international: LiveOffer[]; coverage: string; errors: string[] } = {
    domestic: [],
    international: [],
    coverage: '',
    errors: [],
  };

  externalOffers.forEach((external) => {
    const product = external.product;
    const listingTitle = cleanListingTitle(external.title || product?.title || '');
    const listingImage = external.imageUrl || product?.mainImage;

    if (!listingTitle || !listingImage || isNoisyListingTitle(listingTitle)) {
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
      discountVerified: false,
      seller: {
        id: product?.seller?.id || `ext-seller-${external.id}`,
        storeName: external.sellerName || `${external.platform} marketplace`,
      },
    };

    if (INTERNATIONAL_PLATFORMS.has(normalizedPlatform)) {
      internationalSellers.push(listing);
      return;
    }

    domesticSellers.push(listing);
  });

      const shouldFetchLive = Boolean(q.trim()) && page === 1;
  if (shouldFetchLive) {
    try {
          const darazTarget = Math.min(700, Math.max(220, Math.ceil(sectionFetchTarget * 0.8)));
          const darazFirst = await withTimeout(
            liveMarketplaceSearch(q, darazTarget, { darazOnly: true }),
            LIVE_DARAZ_TIMEOUT_MS,
            { domestic: [], international: [], coverage: '', errors: ['daraz-timeout'] }
          );

          liveResults.domestic = darazFirst.domestic;
          liveResults.international = darazFirst.international;
          liveResults.coverage = darazFirst.coverage;
          liveResults.errors = darazFirst.errors;

          // If Daraz-only result is still thin, expand to full multi-source fetch.
          if (darazFirst.domestic.length < Math.min(120, DEFAULT_PAGE_SIZE * 6)) {
            const livePerSellerTarget = Math.min(420, Math.max(120, Math.ceil(sectionFetchTarget / 3)));
            const expanded = await withTimeout(
              liveMarketplaceSearch(q, livePerSellerTarget),
              LIVE_EXPANDED_TIMEOUT_MS,
              { domestic: [], international: [], coverage: '', errors: ['live-search-timeout'] }
            );

            liveResults.domestic = [...darazFirst.domestic, ...expanded.domestic];
            liveResults.international = expanded.international;
            liveResults.coverage = [darazFirst.coverage, expanded.coverage].filter(Boolean).join(', ');
            liveResults.errors = [...darazFirst.errors, ...expanded.errors];
          }

      liveResults.domestic.forEach((offer, index) => {
        // Ignore obvious non-matching title leakage from very broad marketplaces.
        if (!cleanListingTitle(offer.title).toLowerCase().includes(q.trim().split(/\s+/)[0].toLowerCase())) {
          // keep daraz broad matching intact, filter only non-daraz weak matches
          if (offer.platform !== 'daraz') return;
        }
        const title = cleanListingTitle(offer.title);
        if (isNoisyListingTitle(title)) return;
        domesticSellers.push({
          id: `live-domestic-${index}-${offer.platform}`,
          title,
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
          discountVerified: offer.discountVerified,
          seller: {
            id: `live-${offer.platform}`,
            storeName: offer.sellerName,
          },
        });
      });

      liveResults.international.forEach((offer, index) => {
        const title = cleanListingTitle(offer.title);
        if (isNoisyListingTitle(title)) return;
        internationalSellers.push({
          id: `live-international-${index}-${offer.platform}`,
          title,
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
          discountVerified: offer.discountVerified,
          seller: {
            id: `live-${offer.platform}`,
            storeName: offer.sellerName,
          },
        });
      });
    } catch (liveError) {
      console.error('Live marketplace search error:', liveError);
    }
  }

  domesticSellers = dedupeListings(domesticSellers);
  internationalSellers = dedupeListings(internationalSellers);

  const sourceStats = {
    domesticByPlatform: buildPlatformCountMap(domesticSellers),
    internationalByPlatform: buildPlatformCountMap(internationalSellers),
    coverage: liveResults.coverage,
    errors: liveResults.errors,
    generatedAt: new Date().toISOString(),
    fromCache: false,
    stale: false,
  };

  return { domesticSellers, internationalSellers, sourceStats };
};

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

  const base: any = {};

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const requestedLimit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedLimit));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("order") || "desc";
    const sortMode = getSortMode(searchParams.get('sortMode'));
    const sectionCacheKey = [
      q.trim().toLowerCase(),
      sortMode,
      categoryId || '',
      minPrice || '',
      maxPrice || '',
    ].join('|');
    let cached = sectionResultCache.get(sectionCacheKey);

    // Drop weak first-page caches so they don't keep recycling low-coverage pools.
    if (cached && page === 1 && cached.domestic.length < 180) {
      sectionResultCache.delete(sectionCacheKey);
      cached = sectionResultCache.get(sectionCacheKey);
    }

    const hasFreshCache = Boolean(cached && (Date.now() - cached.createdAt) < SECTION_CACHE_TTL_MS);
    const usingStaleCache = Boolean(cached && !hasFreshCache);
    const cacheAgeMs = cached ? Date.now() - cached.createdAt : Number.MAX_SAFE_INTEGER;
    const hasReusableCache = Boolean(cached && cacheAgeMs < SECTION_STALE_MAX_MS);

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

    // Get local inventory in parallel for faster response, but degrade gracefully if DB pool is saturated.
    let products: any[] = [];
    let total = 0;
    try {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where: localWhere,
          skip,
          take: limit,
          orderBy,
          include: {
            category: { select: { id: true, name: true } },
            seller: { select: { id: true, storeName: true } },
          },
        }),
        prisma.product.count({ where: localWhere }),
      ]);
    } catch (localQueryError) {
      console.error('Local inventory query failed:', localQueryError);
      products = [];
      total = 0;
    }

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
      discountVerified: true,
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

    // Build a deeper pool for later pages so the user can paginate through many results.
    const sectionFetchTarget = Math.min(
      MAX_SECTION_RESULTS,
      Math.max(page * limit * 16, page === 1 ? 360 : 600)
    );

    let domesticSellers: SearchListing[] = [];
    let internationalSellers: SearchListing[] = [];
    let sourceStats = cached?.sourceStats || {
      domesticByPlatform: {} as Record<string, number>,
      internationalByPlatform: {} as Record<string, number>,
      coverage: '',
      errors: [] as string[],
      generatedAt: undefined as string | undefined,
      fromCache: false,
      stale: false,
    };

    // Avoid serving weak page-1 caches; force rebuild to improve domestic coverage quality.
    const weakPageOneCache = Boolean(cached && page === 1 && cached.domestic.length < 180);
    // Serve cached pools when available, then refresh in background for page 1 if cache is stale.
    const serveFromCache = hasReusableCache && !weakPageOneCache && (page > 1 || hasFreshCache || usingStaleCache);

    if (serveFromCache) {
      domesticSellers = cached!.domestic.slice();
      internationalSellers = cached!.international.slice();
      sourceStats = {
        ...sourceStats,
        generatedAt: cached?.sourceStats?.generatedAt || new Date(cached!.createdAt).toISOString(),
        fromCache: true,
        stale: usingStaleCache,
      };

      const shouldBackgroundRefresh = page === 1 && usingStaleCache;
      if (shouldBackgroundRefresh && !sectionRebuildLocks.has(sectionCacheKey)) {
        const rebuildPromise = (async () => {
          try {
            const rebuilt = await buildSectionPools({
              q,
              page: 1,
              limit,
              sectionFetchTarget: Math.max(sectionFetchTarget, 600),
              externalWhere,
            });
            sectionResultCache.set(sectionCacheKey, {
              createdAt: Date.now(),
              domestic: rebuilt.domesticSellers.slice(0, MAX_SECTION_RESULTS),
              international: rebuilt.internationalSellers.slice(0, MAX_SECTION_RESULTS),
              sourceStats: rebuilt.sourceStats,
            });
          } catch (error) {
            console.error('Background search cache rebuild failed:', error);
          } finally {
            sectionRebuildLocks.delete(sectionCacheKey);
          }
        })();

        sectionRebuildLocks.set(sectionCacheKey, rebuildPromise);
      }
    } else {
      try {
        const rebuilt = await buildSectionPools({
          q,
          page,
          limit,
          sectionFetchTarget,
          externalWhere,
        });
        domesticSellers = rebuilt.domesticSellers;
        internationalSellers = rebuilt.internationalSellers;
        sourceStats = rebuilt.sourceStats;
      } catch (sectionBuildError) {
        console.error('Section pool build failed:', sectionBuildError);
        if (cached) {
          domesticSellers = cached.domestic.slice();
          internationalSellers = cached.international.slice();
          sourceStats = {
            ...(cached.sourceStats || sourceStats),
            fromCache: true,
            stale: true,
          };
        } else {
          domesticSellers = [];
          internationalSellers = [];
          sourceStats = {
            ...sourceStats,
            errors: [...(sourceStats.errors || []), 'section-build-failed'],
            fromCache: false,
            stale: false,
          };
        }
      }
    }

    localInventory.sort(compareListings(sortMode));
    domesticSellers.sort(compareListings(sortMode));
    internationalSellers.sort(compareListings(sortMode));

    // Guardrail: avoid returning an all-zero marketplace response for valid queries.
    if (q.trim() && domesticSellers.length === 0 && internationalSellers.length === 0) {
      const minCacheForFallback = page === 1 ? 180 : limit;
      const hasMeaningfulCache = Boolean(cached && (cached.domestic.length + cached.international.length) >= minCacheForFallback);
      if (hasReusableCache && hasMeaningfulCache && cached) {
        domesticSellers = cached.domestic.slice();
        internationalSellers = cached.international.slice();
        sourceStats = {
          ...(cached.sourceStats || sourceStats),
          fromCache: true,
          stale: true,
          errors: [...(sourceStats.errors || []), 'zero-result-fallback-cache'],
        };
      } else {
        const emergencyDaraz = await withTimeout(
          liveMarketplaceSearch(q, 260, { darazOnly: true }),
          EMERGENCY_DARAZ_TIMEOUT_MS,
          { domestic: [], international: [], coverage: '', errors: ['emergency-daraz-timeout'] }
        );

        let emergencyLive = emergencyDaraz;
        if (emergencyDaraz.domestic.length < 24) {
          const emergencyExpanded = await withTimeout(
            liveMarketplaceSearch(q, 64),
            EMERGENCY_EXPANDED_TIMEOUT_MS,
            { domestic: [], international: [], coverage: '', errors: ['emergency-live-timeout'] }
          );
          emergencyLive = {
            domestic: [...emergencyDaraz.domestic, ...emergencyExpanded.domestic],
            international: emergencyExpanded.international,
            coverage: [emergencyDaraz.coverage, emergencyExpanded.coverage].filter(Boolean).join(', '),
            errors: [...emergencyDaraz.errors, ...emergencyExpanded.errors],
          };
        }

        if (emergencyLive.domestic.length > 0 || emergencyLive.international.length > 0) {
          emergencyLive.domestic.slice(0, 120).forEach((offer, index) => {
            domesticSellers.push({
              id: `live-emergency-domestic-${index}-${offer.platform}`,
              title: cleanListingTitle(offer.title),
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
              discountVerified: offer.discountVerified,
              seller: {
                id: `live-emergency-${offer.platform}`,
                storeName: offer.sellerName,
              },
            });
          });

          emergencyLive.international.slice(0, 120).forEach((offer, index) => {
            internationalSellers.push({
              id: `live-emergency-international-${index}-${offer.platform}`,
              title: cleanListingTitle(offer.title),
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
              discountVerified: offer.discountVerified,
              seller: {
                id: `live-emergency-${offer.platform}`,
                storeName: offer.sellerName,
              },
            });
          });

          domesticSellers = dedupeListings(domesticSellers).sort(compareListings(sortMode));
          internationalSellers = dedupeListings(internationalSellers).sort(compareListings(sortMode));

          sourceStats = {
            ...sourceStats,
            domesticByPlatform: buildPlatformCountMap(domesticSellers),
            internationalByPlatform: buildPlatformCountMap(internationalSellers),
            coverage: sourceStats.coverage || emergencyLive.coverage,
            errors: [...(sourceStats.errors || []), ...emergencyLive.errors, 'zero-result-fallback-live'],
            fromCache: false,
            stale: false,
          };
        }
      }

      // Final fallback: use tracked external catalog (including synthetic entries) so users don't see all-zero results.
      if (domesticSellers.length === 0 && internationalSellers.length === 0) {
        const fallbackTokens = q
          .trim()
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 2);

        const fallbackOr = [
          { title: { contains: q.trim(), mode: 'insensitive' as const } },
          { sellerName: { contains: q.trim(), mode: 'insensitive' as const } },
          { categoryName: { contains: q.trim(), mode: 'insensitive' as const } },
          ...fallbackTokens.flatMap((token) => [
            { title: { contains: token, mode: 'insensitive' as const } },
            { sellerName: { contains: token, mode: 'insensitive' as const } },
            { categoryName: { contains: token, mode: 'insensitive' as const } },
          ]),
        ];

        const fallbackRows = await prisma.externalProduct.findMany({
          where: {
            OR: fallbackOr,
          },
          take: 300,
          orderBy: {
            updatedAt: 'desc',
          },
        });

        fallbackRows.forEach((row, idx) => {
          if (!row.title || !row.externalPrice) return;
          const title = cleanListingTitle(row.title);
          if (isNoisyListingTitle(title)) return;
          const sourcePlatform = String(row.platform || 'unknown').toLowerCase();
          const listing: SearchListing = {
            id: `fallback-ext-${row.id}-${idx}`,
            title,
            currentPrice: Number(row.externalPrice),
            originalPrice: Number(row.externalOriginalPrice || row.externalPrice),
            mainImage: row.imageUrl || '/images/placeholder-product.svg',
            rating: Number(row.externalRating || 0),
            reviewCount: clampReviewCount(row.externalReviewCount || 0),
            stock: 999,
            isFeatured: false,
            externalUrl: row.externalUrl,
            sourceType: INTERNATIONAL_PLATFORMS.has(sourcePlatform) ? 'INTERNATIONAL' : 'DOMESTIC',
            sourcePlatform,
            lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : undefined,
            discountVerified: false,
            seller: {
              id: `fallback-seller-${row.id}`,
              storeName: row.sellerName || `${sourcePlatform} marketplace`,
            },
          };

          if (listing.sourceType === 'INTERNATIONAL') {
            internationalSellers.push(listing);
          } else {
            domesticSellers.push(listing);
          }
        });

        domesticSellers = dedupeListings(domesticSellers).sort(compareListings(sortMode));
        internationalSellers = dedupeListings(internationalSellers).sort(compareListings(sortMode));

        sourceStats = {
          ...sourceStats,
          domesticByPlatform: buildPlatformCountMap(domesticSellers),
          internationalByPlatform: buildPlatformCountMap(internationalSellers),
          errors: [...(sourceStats.errors || []), 'zero-result-fallback-db'],
          fromCache: false,
          stale: false,
        };
      }
    }

    // If a fresh cache exists and a live rebuild came back sparse, keep the stable cached pool.
    if (!serveFromCache && hasFreshCache && domesticSellers.length < limit && (cached?.domestic.length || 0) >= limit) {
      domesticSellers = cached!.domestic.slice();
      internationalSellers = cached!.international.slice();
      sourceStats = {
        ...(cached?.sourceStats || sourceStats),
        fromCache: true,
        stale: false,
      };
    }

    if (domesticSellers.length >= limit || internationalSellers.length >= limit) {
      sectionResultCache.set(sectionCacheKey, {
        createdAt: Date.now(),
        domestic: domesticSellers.slice(0, MAX_SECTION_RESULTS),
        international: internationalSellers.slice(0, MAX_SECTION_RESULTS),
        sourceStats,
      });
    }

    const localTotal = total;
    const domesticTotal = Math.min(domesticSellers.length, MAX_SECTION_RESULTS);
    const internationalTotal = Math.min(internationalSellers.length, MAX_SECTION_RESULTS);

    const paginatedDomestic = domesticSellers.slice(skip, Math.min(skip + limit, domesticTotal));
    const paginatedInternational = internationalSellers.slice(skip, Math.min(skip + limit, internationalTotal));

    return NextResponse.json(
      {
        sections: {
          localInventory,
          domesticSellers: paginatedDomestic,
          internationalSellers: paginatedInternational,
        },
        sortMode,
        results: products,
        pagination: {
          page,
          limit,
          total: localTotal,
          pages: Math.ceil(localTotal / limit),
          sections: {
            localInventory: {
              total: localTotal,
              pages: Math.ceil(localTotal / limit),
              hasNext: page * limit < localTotal,
              hasPrev: page > 1,
            },
            domesticSellers: {
              total: domesticTotal,
              pages: Math.ceil(domesticTotal / limit),
              hasNext: page * limit < domesticTotal,
              hasPrev: page > 1,
            },
            internationalSellers: {
              total: internationalTotal,
              pages: Math.ceil(internationalTotal / limit),
              hasNext: page * limit < internationalTotal,
              hasPrev: page > 1,
            },
          },
        },
        sourceStats,
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
