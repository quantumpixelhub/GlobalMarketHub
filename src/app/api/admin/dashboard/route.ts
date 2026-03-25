import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

const RECOVERY_TAG = '[RECOVERED_ORDER]';

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
      incompleteCount,
      refundedCount,
      recoveredOrders,
      recoveredAmountAgg,
      recentOrders,
      lowStockProducts,
      recentIncompleteOrders,
      recentRefundedOrders,
      recentRecoveredOrders,
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
      prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING', 'SHIPPED'],
          },
        },
      }),
      prisma.order.count({ where: { paymentStatus: 'REFUNDED' } }),
      prisma.order.count({
        where: {
          notes: {
            contains: RECOVERY_TAG,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          notes: {
            contains: RECOVERY_TAG,
          },
        },
        _sum: {
          totalAmount: true,
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
      prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: 10 },
        },
        orderBy: {
          stock: 'asc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          stock: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING', 'SHIPPED'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'REFUNDED',
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          updatedAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          notes: {
            contains: RECOVERY_TAG,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          updatedAt: true,
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
      incompleteCount,
      refundedCount,
      recoveredOrders,
      recoveredAmount: Number(recoveredAmountAgg._sum.totalAmount || 0),
      notificationCounts: {
        dashboard: incompleteCount + refundedCount + recoveredOrders,
        products: lowStockCount,
        orders: incompleteCount,
        categories: 0,
        campaigns: 0,
        coupons: 0,
        users: 0,
        reviews: 0,
        media: 0,
        notifications: incompleteCount + refundedCount + lowStockCount + recoveredOrders,
        payments: refundedCount,
        settings: 0,
      },
      recentOrders,
      notificationDetails: {
        lowStockProducts,
        recentIncompleteOrders: recentIncompleteOrders.map((order) => ({
          ...order,
          totalAmount: Number(order.totalAmount || 0),
        })),
        recentRefundedOrders: recentRefundedOrders.map((order) => ({
          ...order,
          totalAmount: Number(order.totalAmount || 0),
        })),
        recentRecoveredOrders: recentRecoveredOrders.map((order) => ({
          ...order,
          totalAmount: Number(order.totalAmount || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
