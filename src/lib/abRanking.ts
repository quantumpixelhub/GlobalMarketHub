import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type RankingVariant = 'A' | 'B';

export type RankingAssignment = {
  experimentKey: string;
  variant: RankingVariant;
  trafficToB: number;
  override: boolean;
};

export type RankingMetricEventType = 'exposure' | 'click' | 'conversion';

export type RankingMetricInput = {
  experimentKey: string;
  variant: RankingVariant;
  eventType: RankingMetricEventType;
  endpoint: string;
  userId?: string;
  sessionId?: string;
  query?: string;
  categoryId?: string;
  sortMode?: string;
  resultCount?: number;
  productId?: string;
  orderId?: string;
  conversionValue?: number;
  metadata?: Prisma.InputJsonValue;
};

function stableHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeVariant(raw?: string | null): RankingVariant | null {
  const value = String(raw || '').trim().toUpperCase();
  if (value === 'A' || value === 'CONTROL') return 'A';
  if (value === 'B' || value === 'TREATMENT') return 'B';
  return null;
}

function normalizeTraffic(raw?: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0.5;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

export function getRankingExperimentAssignment(args: {
  userId?: string;
  sessionId?: string;
  overrideVariant?: string | null;
  experimentKey?: string;
}): RankingAssignment {
  const experimentKey = String(args.experimentKey || process.env.RANKING_EXPERIMENT_KEY || 'ranking_personalization_v1');
  const override = normalizeVariant(args.overrideVariant);
  const trafficToB = normalizeTraffic(process.env.RANKING_AB_TRAFFIC_TO_B);

  if (override) {
    return {
      experimentKey,
      variant: override,
      trafficToB,
      override: true,
    };
  }

  const identity = `${experimentKey}|${args.userId || ''}|${args.sessionId || ''}`;
  const hash = stableHash(identity || `${experimentKey}|anonymous`);
  const bucket = hash / 0xffffffff;

  return {
    experimentKey,
    variant: bucket < trafficToB ? 'B' : 'A',
    trafficToB,
    override: false,
  };
}

export function shouldApplyPersonalization(assignment: RankingAssignment | null) {
  if (!assignment) return false;
  return assignment.variant === 'B';
}

export async function trackRankingMetric(input: RankingMetricInput) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "RankingExperimentMetric" (
        "id", "experimentKey", "variant", "eventType", "endpoint", "userId", "sessionId", "query", "categoryId",
        "sortMode", "resultCount", "productId", "orderId", "conversionValue", "metadata", "createdAt", "updatedAt"
      )
      VALUES (
        ${`ab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`},
        ${input.experimentKey},
        ${input.variant},
        ${input.eventType},
        ${input.endpoint},
        ${input.userId || null},
        ${input.sessionId || null},
        ${input.query || null},
        ${input.categoryId || null},
        ${input.sortMode || null},
        ${input.resultCount ?? null},
        ${input.productId || null},
        ${input.orderId || null},
        ${input.conversionValue ?? null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
        NOW(),
        NOW()
      )
    `;
  } catch (error) {
    // Metrics should never break user-facing ranking flows.
    console.error('A/B metric tracking failed:', error);
  }
}

export async function getRankingMetricSummary(args: {
  experimentKey?: string;
  endpoint?: string;
  days?: number;
}) {
  const experimentKey = String(args.experimentKey || process.env.RANKING_EXPERIMENT_KEY || 'ranking_personalization_v1');
  const endpoint = args.endpoint ? String(args.endpoint) : null;
  const days = Number.isFinite(Number(args.days)) ? Math.max(1, Math.floor(Number(args.days))) : 14;

  const clauses: Prisma.Sql[] = [
    Prisma.sql`"experimentKey" = ${experimentKey}`,
    Prisma.sql`"createdAt" >= NOW() - (${days} || ' days')::interval`,
  ];

  if (endpoint) {
    clauses.push(Prisma.sql`"endpoint" = ${endpoint}`);
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;

  const rows = await prisma.$queryRaw<Array<{
    variant: string;
    exposures: bigint;
    clicks: bigint;
    conversions: bigint;
    revenue: Prisma.Decimal | null;
  }>>(Prisma.sql`
    SELECT
      "variant",
      COUNT(*) FILTER (WHERE "eventType" = 'exposure') AS exposures,
      COUNT(*) FILTER (WHERE "eventType" = 'click') AS clicks,
      COUNT(*) FILTER (WHERE "eventType" = 'conversion') AS conversions,
      COALESCE(SUM(CASE WHEN "eventType" = 'conversion' THEN "conversionValue" ELSE 0 END), 0) AS revenue
    FROM "RankingExperimentMetric"
    ${whereClause}
    GROUP BY "variant"
    ORDER BY "variant" ASC
  `);

  return rows.map((row) => {
    const exposures = Number(row.exposures || 0);
    const clicks = Number(row.clicks || 0);
    const conversions = Number(row.conversions || 0);
    const revenue = Number(row.revenue || 0);

    return {
      variant: row.variant,
      exposures,
      clicks,
      conversions,
      ctr: exposures > 0 ? Number((clicks / exposures).toFixed(6)) : 0,
      conversionRate: exposures > 0 ? Number((conversions / exposures).toFixed(6)) : 0,
      revenue,
    };
  });
}
