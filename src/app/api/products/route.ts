// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'createdAt';

    // Build where clause
    const where: any = { isActive: true };
    if (category) {
      where.category = { slug: category };
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: 'desc' },
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
    // This would be protected (admin only)
    const {
      title,
      description,
      originalPrice,
      currentPrice,
      categoryId,
      sellerId,
      mainImage,
    } = await request.json();

    const product = await prisma.product.create({
      data: {
        title,
        slug: title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        sku: `SKU-${Date.now()}`,
        description,
        originalPrice: parseFloat(originalPrice),
        currentPrice: parseFloat(currentPrice),
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
