// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

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
    const categoryId = searchParams.get('categoryId');
    const sortBy = searchParams.get('sort') || 'createdAt';

    // Build where clause
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      where.category = { slug: category };
    }

    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: 'desc' },
      price: { currentPrice: 'asc' },
      rating: { rating: 'desc' },
      reviews: { reviewCount: 'desc' },
    };

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByMap[sortBy] || { createdAt: 'desc' },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            rating: true,
          },
        },
      },
    });

    // Count total
    const total = await prisma.product.count({ where });

    return NextResponse.json({
      success: true,
      products,
      data: products,
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
