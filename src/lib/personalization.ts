import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const EVENT_SIGNAL_WEIGHT: Record<string, number> = {
  PRODUCT_VIEW: 1,
  PRODUCT_CLICK: 2,
  ADD_TO_CART: 4,
  PURCHASE: 6,
};

type PriceBand = 'budget' | 'value' | 'mid' | 'premium';

type UserEventRow = {
  eventType: string;
  productId: string | null;
  categoryId: string | null;
  unitPrice: Prisma.Decimal | null;
  createdAt: Date;
};

type ProductSignalRow = {
  id: string;
  categoryId: string;
  sellerId: string;
  currentPrice: Prisma.Decimal;
};

export type PersonalizationProfile = {
  hasSignals: boolean;
  eventCount: number;
  categoryAffinity: Record<string, number>;
  sellerAffinity: Record<string, number>;
  priceBandAffinity: Record<PriceBand, number>;
  lastEventAt?: string;
};

export type PersonalizableItem = {
  rankingScore: number;
  currentPrice: number;
  categoryId?: string | null;
  sellerId?: string | null;
  seller?: {
    id?: string | null;
  };
  createdAt?: string | Date;
};

function getPriceBand(price: number): PriceBand {
  if (!Number.isFinite(price) || price <= 0) return 'value';
  if (price <= 1000) return 'budget';
  if (price <= 5000) return 'value';
  if (price <= 20000) return 'mid';
  return 'premium';
}

function normalizeAffinityMap(input: Map<string, number>): Record<string, number> {
  const entries = Array.from(input.entries());
  if (entries.length === 0) return {};

  const max = Math.max(...entries.map(([, value]) => value));
  if (!Number.isFinite(max) || max <= 0) return {};

  return entries.reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = Number((value / max).toFixed(6));
    return acc;
  }, {});
}

function normalizePriceBandMap(input: Map<PriceBand, number>): Record<PriceBand, number> {
  const base: Record<PriceBand, number> = {
    budget: 0,
    value: 0,
    mid: 0,
    premium: 0,
  };

  const max = Math.max(...Array.from(input.values()), 0);
  if (max <= 0) return base;

  for (const [band, value] of input.entries()) {
    base[band] = Number((value / max).toFixed(6));
  }

  return base;
}

function recencyDecay(createdAt: Date): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-Math.max(0, ageDays) / 14);
}

function resolveSignalWeight(eventType: string): number {
  return EVENT_SIGNAL_WEIGHT[String(eventType || '').toUpperCase()] || 0.5;
}

async function fetchBehaviorEvents(userId?: string, sessionId?: string, maxEvents = 300): Promise<UserEventRow[]> {
  const conditions: Prisma.Sql[] = [];

  if (userId) {
    conditions.push(Prisma.sql`"userId" = ${userId}`);
  }
  if (sessionId) {
    conditions.push(Prisma.sql`"sessionId" = ${sessionId}`);
  }

  if (conditions.length === 0) {
    return [];
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' OR ')}`;

  const rows = await prisma.$queryRaw<UserEventRow[]>(Prisma.sql`
    SELECT "eventType", "productId", "categoryId", "unitPrice", "createdAt"
    FROM "UserEvent"
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT ${maxEvents}
  `);

  return rows;
}

export async function buildPersonalizationProfile(args: {
  userId?: string;
  sessionId?: string;
  maxEvents?: number;
}): Promise<PersonalizationProfile | null> {
  const events = await fetchBehaviorEvents(args.userId, args.sessionId, args.maxEvents || 300);
  if (events.length === 0) {
    return null;
  }

  const productIds = Array.from(new Set(events.map((event) => event.productId).filter((id): id is string => Boolean(id))));

  let productsById = new Map<string, ProductSignalRow>();
  if (productIds.length > 0) {
    const rows = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        categoryId: true,
        sellerId: true,
        currentPrice: true,
      },
    });
    productsById = new Map(rows.map((row) => [row.id, row]));
  }

  const categoryMap = new Map<string, number>();
  const sellerMap = new Map<string, number>();
  const priceBandMap = new Map<PriceBand, number>();

  let lastEventAt: Date | undefined;

  for (const event of events) {
    const eventDate = new Date(event.createdAt);
    if (!lastEventAt || eventDate > lastEventAt) {
      lastEventAt = eventDate;
    }

    const weight = resolveSignalWeight(event.eventType) * recencyDecay(eventDate);
    const product = event.productId ? productsById.get(event.productId) : undefined;

    const categoryId = event.categoryId || product?.categoryId;
    if (categoryId) {
      categoryMap.set(categoryId, (categoryMap.get(categoryId) || 0) + weight);
    }

    const sellerId = product?.sellerId;
    if (sellerId) {
      sellerMap.set(sellerId, (sellerMap.get(sellerId) || 0) + weight);
    }

    const unitPrice = event.unitPrice ? Number(event.unitPrice) : Number(product?.currentPrice || 0);
    const band = getPriceBand(unitPrice);
    priceBandMap.set(band, (priceBandMap.get(band) || 0) + weight);
  }

  return {
    hasSignals: categoryMap.size > 0 || sellerMap.size > 0 || priceBandMap.size > 0,
    eventCount: events.length,
    categoryAffinity: normalizeAffinityMap(categoryMap),
    sellerAffinity: normalizeAffinityMap(sellerMap),
    priceBandAffinity: normalizePriceBandMap(priceBandMap),
    lastEventAt: lastEventAt?.toISOString(),
  };
}

export function applyPersonalizationReranking<T extends PersonalizableItem>(
  rankedItems: T[],
  profile: PersonalizationProfile | null,
  options?: {
    baseRankingWeight?: number;
    personalizationWeight?: number;
  }
): Array<T & { personalizationScore: number; finalScore: number }> {
  const baseRankingWeight = options?.baseRankingWeight ?? 0.78;
  const personalizationWeight = options?.personalizationWeight ?? 0.22;

  if (!profile || !profile.hasSignals) {
    return rankedItems
      .map((item) => ({
        ...item,
        personalizationScore: 0,
        finalScore: Number(item.rankingScore.toFixed(6)),
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  const lastEventAt = profile.lastEventAt ? new Date(profile.lastEventAt) : null;

  return rankedItems
    .map((item) => {
      const itemCategoryScore = item.categoryId ? (profile.categoryAffinity[item.categoryId] || 0) : 0;
      const sellerId = item.sellerId || item.seller?.id || '';
      const itemSellerScore = sellerId ? (profile.sellerAffinity[sellerId] || 0) : 0;
      const itemPriceBandScore = profile.priceBandAffinity[getPriceBand(Number(item.currentPrice || 0))] || 0;

      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      const recencyComponent = (() => {
        if (!lastEventAt || !itemDate || Number.isNaN(itemDate.getTime())) return 0.5;
        const ageDays = Math.max(0, (lastEventAt.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays <= 7) return 1;
        if (ageDays <= 30) return 0.8;
        if (ageDays <= 90) return 0.6;
        return 0.4;
      })();

      const personalizationScore = Number(
        (
          itemCategoryScore * 0.45 +
          itemSellerScore * 0.25 +
          itemPriceBandScore * 0.2 +
          recencyComponent * 0.1
        ).toFixed(6)
      );

      const finalScore = Number(
        (item.rankingScore * baseRankingWeight + personalizationScore * personalizationWeight).toFixed(6)
      );

      return {
        ...item,
        personalizationScore,
        finalScore,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
