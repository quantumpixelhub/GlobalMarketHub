import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type RecommendationProduct = {
  id: string;
  title: string;
  mainImage: string;
  currentPrice: number | Prisma.Decimal;
  originalPrice: number | Prisma.Decimal;
  rating: number | Prisma.Decimal;
  reviewCount: number;
  stock: number;
  categoryId: string;
  sellerId: string;
  seller: {
    id: string;
    storeName: string;
  };
};

export type RecommendationItem = {
  id: string;
  title: string;
  mainImage: string;
  currentPrice: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  seller: {
    id: string;
    storeName: string;
  };
  score: number;
  reason: string;
  coPurchaseCount?: number;
};

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function extractKeywords(text: string) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 18);
}

function titleSimilarity(baseTitle: string, candidateTitle: string) {
  const a = extractKeywords(baseTitle);
  const b = extractKeywords(candidateTitle);
  if (a.length === 0 || b.length === 0) return 0;

  const setB = new Set(b);
  const matches = a.filter((token) => setB.has(token)).length;
  return clamp01(matches / Math.max(a.length, b.length));
}

function priceSimilarity(basePrice: number, candidatePrice: number) {
  if (!Number.isFinite(basePrice) || !Number.isFinite(candidatePrice) || basePrice <= 0 || candidatePrice <= 0) {
    return 0;
  }
  const delta = Math.abs(basePrice - candidatePrice);
  const denom = Math.max(basePrice, candidatePrice);
  return clamp01(1 - delta / denom);
}

function qualityScore(rating: number, reviewCount: number) {
  const ratingComponent = clamp01(rating / 5) * 0.7;
  const confidenceComponent = clamp01(Math.log10(Math.max(1, reviewCount) + 1) / 3) * 0.3;
  return clamp01(ratingComponent + confidenceComponent);
}

function toRecommendationItem(item: RecommendationProduct, score: number, reason: string, coPurchaseCount?: number): RecommendationItem {
  return {
    id: item.id,
    title: item.title,
    mainImage: item.mainImage,
    currentPrice: Number(item.currentPrice),
    originalPrice: Number(item.originalPrice),
    rating: Number(item.rating),
    reviewCount: Number(item.reviewCount),
    seller: item.seller,
    score: Number(score.toFixed(6)),
    reason,
    ...(coPurchaseCount ? { coPurchaseCount } : {}),
  };
}

export async function getSimilarProducts(productId: string, limit = 8): Promise<RecommendationItem[]> {
  const target = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      currentPrice: true,
      categoryId: true,
      sellerId: true,
      isActive: true,
    },
  });

  if (!target || !target.isActive) {
    return [];
  }

  const candidates = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      OR: [
        { categoryId: target.categoryId },
        { sellerId: target.sellerId },
        { title: { contains: extractKeywords(target.title)[0] || target.title, mode: 'insensitive' } },
      ],
    },
    take: Math.max(120, limit * 12),
    include: {
      seller: {
        select: {
          id: true,
          storeName: true,
        },
      },
    },
  });

  const scored = candidates.map((candidate) => {
    const categoryComponent = candidate.categoryId === target.categoryId ? 1 : 0;
    const sellerComponent = candidate.sellerId === target.sellerId ? 1 : 0;
    const titleComponent = titleSimilarity(target.title, candidate.title);
    const priceComponent = priceSimilarity(Number(target.currentPrice), Number(candidate.currentPrice));
    const qualityComponent = qualityScore(Number(candidate.rating), Number(candidate.reviewCount));
    const stockMultiplier = candidate.stock > 0 ? 1 : 0.35;

    const score =
      (
        categoryComponent * 0.38 +
        sellerComponent * 0.1 +
        titleComponent * 0.22 +
        priceComponent * 0.18 +
        qualityComponent * 0.12
      ) * stockMultiplier;

    const reason = categoryComponent > 0.9
      ? 'same_category'
      : sellerComponent > 0.9
        ? 'same_seller'
        : 'content_similarity';

    return {
      item: candidate,
      score,
      reason,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score, reason }) => toRecommendationItem(item as RecommendationProduct, score, reason));
}

export async function getFrequentlyBoughtTogether(productId: string, limit = 6): Promise<RecommendationItem[]> {
  const orderRows = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: {
          in: ACTIVE_ORDER_STATUSES,
        },
      },
    },
    select: {
      orderId: true,
    },
    take: 500,
  });

  const orderIds = Array.from(new Set(orderRows.map((row) => row.orderId)));
  if (orderIds.length === 0) {
    return [];
  }

  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
      order: {
        status: {
          in: ACTIVE_ORDER_STATUSES,
        },
      },
    },
    _count: {
      productId: true,
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _count: {
        productId: 'desc',
      },
    },
    take: Math.max(40, limit * 6),
  });

  if (grouped.length === 0) {
    return [];
  }

  const target = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      categoryId: true,
      currentPrice: true,
    },
  });

  const productMap = new Map(
    grouped.map((row) => [
      row.productId,
      {
        coOrderCount: row._count.productId,
        quantitySum: row._sum.quantity || 0,
      },
    ])
  );

  const products = await prisma.product.findMany({
    where: {
      id: { in: grouped.map((row) => row.productId) },
      isActive: true,
    },
    include: {
      seller: {
        select: {
          id: true,
          storeName: true,
        },
      },
    },
  });

  const maxCount = Math.max(...grouped.map((row) => row._count.productId), 1);
  const maxQty = Math.max(...grouped.map((row) => row._sum.quantity || 0), 1);

  const scored = products.map((product) => {
    const stats = productMap.get(product.id);
    if (!stats) {
      return {
        item: product,
        score: 0,
        coOrderCount: 0,
      };
    }

    const coOrderScore = clamp01(stats.coOrderCount / maxCount);
    const quantityScore = clamp01((stats.quantitySum || 0) / maxQty);
    const categoryBonus = target && product.categoryId === target.categoryId ? 0.15 : 0;
    const priceAffinity = target
      ? priceSimilarity(Number(target.currentPrice), Number(product.currentPrice))
      : 0.5;

    const score = coOrderScore * 0.6 + quantityScore * 0.2 + priceAffinity * 0.1 + categoryBonus + qualityScore(Number(product.rating), Number(product.reviewCount)) * 0.1;

    return {
      item: product,
      score,
      coOrderCount: stats.coOrderCount,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score, coOrderCount }) =>
      toRecommendationItem(item as RecommendationProduct, score, 'co_purchase', coOrderCount)
    );
}
