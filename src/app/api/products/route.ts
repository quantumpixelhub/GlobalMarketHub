// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { getRankingExperimentAssignment, shouldApplyPersonalization, trackRankingMetric } from '@/lib/abRanking';
import { applyWeightedRanking } from '@/lib/weightedRanking';
import { applyPersonalizationReranking, buildPersonalizationProfile } from '@/lib/personalization';

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
    .map((variant, index) => {
      const input = variant as VariantInput;
      const attributeName = String(input.attributeName || '').trim().toLowerCase();
      const attributeValue = String(input.attributeValue || '').trim();
      const price = Number(input.price);
      const stock = Number(input.stock ?? 0);
      const sku = String(input.sku || '').trim();

      if (!attributeName || !attributeValue || !Number.isFinite(price) || price <= 0 || !sku) {
        return null;
      }

      return {
        attributes: { [attributeName]: attributeValue },
        price,
        stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
        sku: sku || `VAR-${Date.now()}-${index}`,
      };
    })
    .filter((variant): variant is { attributes: Record<string, string>; price: number; stock: number; sku: string } => Boolean(variant));
}

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const q = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const sortBy = searchParams.get('sort') || 'createdAt';
    const rankVariantOverride = searchParams.get('rankVariant');
    const sessionId = request.headers.get('x-session-id') || searchParams.get('sessionId') || undefined;
    const auth = await authenticate(request);
    const userId = auth.success && auth.data?.userId ? String(auth.data.userId) : undefined;

    const rankingExperiment = sortBy === 'relevance'
      ? getRankingExperimentAssignment({
          userId,
          sessionId,
          overrideVariant: rankVariantOverride,
        })
      : null;

    const usePersonalization = sortBy === 'relevance' && shouldApplyPersonalization(rankingExperiment);

    const personalizationProfile = usePersonalization
      ? await buildPersonalizationProfile({ userId, sessionId })
      : null;

    // Build where clause
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      const selectedCategory = await prisma.category.findUnique({
        where: { slug: category },
        select: {
          id: true,
          children: { select: { id: true } },
        },
      });

      if (selectedCategory) {
        const childIds = selectedCategory.children.map((child) => child.id);
        where.categoryId = { in: [selectedCategory.id, ...childIds] };
      } else {
        where.category = { slug: category };
      }
    }

    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: 'desc' },
      price: { currentPrice: 'asc' },
      rating: { rating: 'desc' },
      reviews: { reviewCount: 'desc' },
    };

    if (q.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
        { category: { name: { contains: q.trim(), mode: 'insensitive' } } },
      ];
    }

    // Fetch products
    let products: any[] = [];
    if (sortBy === 'relevance') {
      const rankingPool = await prisma.product.findMany({
        where,
        take: Math.max(limit * 6, 120),
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              rating: true,
              reviewCount: true,
              isVerified: true,
            },
          },
        },
      });

      const ranked = applyWeightedRanking(
        rankingPool.map((product) => ({
          ...product,
          currentPrice: Number(product.currentPrice),
          originalPrice: Number(product.originalPrice),
          rating: Number(product.rating),
          seller: product.seller
            ? {
                ...product.seller,
                rating: Number(product.seller.rating || 0),
              }
            : undefined,
        })),
        q
      );

      const reranked = usePersonalization
        ? applyPersonalizationReranking(
            ranked.map((item) => ({
              ...item,
              categoryId: item.categoryId,
              sellerId: item.sellerId || item.seller?.id,
              createdAt: item.createdAt,
            })),
            personalizationProfile
          )
        : ranked.map((item) => ({
            ...item,
            personalizationScore: 0,
            finalScore: item.rankingScore,
          }));

      products = reranked.slice((page - 1) * limit, (page - 1) * limit + limit);

      if (rankingExperiment) {
        await trackRankingMetric({
          experimentKey: rankingExperiment.experimentKey,
          variant: rankingExperiment.variant,
          eventType: 'exposure',
          endpoint: 'products_api',
          userId,
          sessionId,
          query: q || undefined,
          categoryId: categoryId || undefined,
          sortMode: sortBy,
          resultCount: products.length,
          metadata: {
            page,
            limit,
            personalizationApplied: usePersonalization,
          },
        });
      }
    } else {
      products = await prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderByMap[sortBy] || { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              rating: true,
            },
          },
        },
      });
    }

    // Count total
    const total = await prisma.product.count({ where });

    return NextResponse.json({
      success: true,
      products,
      data: products,
      ranking: {
        mode: sortBy,
        personalizationApplied: usePersonalization && Boolean(personalizationProfile?.hasSignals),
        personalizationEventCount: personalizationProfile?.eventCount || 0,
        abTest: rankingExperiment
          ? {
              experimentKey: rankingExperiment.experimentKey,
              variant: rankingExperiment.variant,
              override: rankingExperiment.override,
              trafficToB: rankingExperiment.trafficToB,
            }
          : null,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      originalPrice,
      currentPrice,
      stock,
      categoryId,
      sellerId,
      mainImage,
      variants,
    } = await request.json();

    if (!title || !description || !originalPrice || !currentPrice || !categoryId || !sellerId || !mainImage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    const normalizedVariants = normalizeVariants(variants);

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        sku: `SKU-${Date.now()}`,
        description,
        originalPrice: parseFloat(originalPrice),
        currentPrice: parseFloat(currentPrice),
        stock: Number(stock || 0),
        categoryId,
        sellerId,
        mainImage,
        ...(normalizedVariants.length > 0 && {
          variants: {
            create: normalizedVariants,
          },
        }),
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
