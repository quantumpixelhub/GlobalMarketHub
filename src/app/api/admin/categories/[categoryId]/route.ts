import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { categoryId } = await params;
    const body = await request.json();

    const current = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!current) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const nextName = body.name ? String(body.name).trim() : current.name;

    const duplicateName = await prisma.category.findFirst({
      where: {
        id: { not: categoryId },
        name: { equals: nextName, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicateName) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    const baseSlug = slugify(nextName);
    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.category.findFirst({
        where: { id: { not: categoryId }, slug },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: nextName,
        slug,
        description: body.description !== undefined ? String(body.description || '').trim() : current.description,
        image: body.image !== undefined ? String(body.image || '').trim() : current.image,
        parentId: body.parentId !== undefined ? body.parentId || null : current.parentId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      category: {
        ...category,
        _count: {
          products: category._count.products,
          children: category.children.length,
        },
      },
    });
  } catch (error) {
    console.error('Admin categories PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { categoryId } = await params;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const [productCount, childCount] = await Promise.all([
      prisma.product.count({ where: { categoryId } }),
      prisma.category.count({ where: { parentId: categoryId } }),
    ]);

    if (productCount > 0 || childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products or subcategories' },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
