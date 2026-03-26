import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { getRankingMetricSummary, RankingMetricEventType, RankingVariant, trackRankingMetric } from '@/lib/abRanking';

export const dynamic = 'force-dynamic';

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: String(auth.data.userId) },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return auth;
}

function isVariant(value: unknown): value is RankingVariant {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'A' || normalized === 'B';
}

function isMetricEventType(value: unknown): value is RankingMetricEventType {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'exposure' || normalized === 'click' || normalized === 'conversion';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const summary = await getRankingMetricSummary({
      experimentKey: searchParams.get('experimentKey') || undefined,
      endpoint: searchParams.get('endpoint') || undefined,
      days: Number(searchParams.get('days') || '14'),
    });

    return NextResponse.json({
      summary,
      filters: {
        experimentKey: searchParams.get('experimentKey') || process.env.RANKING_EXPERIMENT_KEY || 'ranking_personalization_v1',
        endpoint: searchParams.get('endpoint') || null,
        days: Number(searchParams.get('days') || '14'),
      },
    });
  } catch (error) {
    console.error('Get ranking metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isVariant(body?.variant) || !isMetricEventType(body?.eventType) || !body?.endpoint) {
      return NextResponse.json(
        { error: 'variant, eventType, and endpoint are required' },
        { status: 400 }
      );
    }

    const auth = await authenticate(request);

    await trackRankingMetric({
      experimentKey: String(body?.experimentKey || process.env.RANKING_EXPERIMENT_KEY || 'ranking_personalization_v1'),
      variant: String(body.variant).toUpperCase() as RankingVariant,
      eventType: String(body.eventType).toLowerCase() as RankingMetricEventType,
      endpoint: String(body.endpoint),
      userId: auth.success ? String(auth.data?.userId || '') : undefined,
      sessionId: body?.sessionId ? String(body.sessionId) : request.headers.get('x-session-id') || undefined,
      query: body?.query ? String(body.query) : undefined,
      categoryId: body?.categoryId ? String(body.categoryId) : undefined,
      sortMode: body?.sortMode ? String(body.sortMode) : undefined,
      resultCount: Number.isFinite(Number(body?.resultCount)) ? Number(body.resultCount) : undefined,
      productId: body?.productId ? String(body.productId) : undefined,
      orderId: body?.orderId ? String(body.orderId) : undefined,
      conversionValue: Number.isFinite(Number(body?.conversionValue)) ? Number(body.conversionValue) : undefined,
      metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Track ranking metric error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
