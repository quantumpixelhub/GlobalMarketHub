import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      completedOrders,
      totalRevenueAgg,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: 10 },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalOrders,
      completedOrders,
      totalRevenue: Number(totalRevenueAgg._sum.totalAmount || 0),
      lowStockCount,
      recentOrders,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
