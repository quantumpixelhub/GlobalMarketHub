import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { CATEGORY_TAXONOMY_SLUG_SET } from '@/lib/categoryTaxonomy';

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: {
        slug: { in: Array.from(CATEGORY_TAXONOMY_SLUG_SET) },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      categories: categories.map((category) => ({
        ...category,
        _count: {
          products: category._count.products,
          children: category.children.length,
        },
      })),
    });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = body.description ? String(body.description).trim() : null;
    const image = body.image ? String(body.image).trim() : null;
    const parentId = body.parentId ? String(body.parentId) : null;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const duplicateName = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });

    if (duplicateName) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(
      {
        category: {
          ...category,
          _count: {
            products: category._count.products,
            children: category.children.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
