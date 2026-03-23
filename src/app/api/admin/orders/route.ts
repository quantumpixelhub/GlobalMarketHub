import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function buildAddress(snapshot: Record<string, unknown>): string {
  const parts = [
    normalizeText(snapshot.address),
    normalizeText(snapshot.upazila),
    normalizeText(snapshot.district),
    normalizeText(snapshot.division),
  ].filter(Boolean);

  return parts.join(', ');
}

function resolveCourierName(snapshot: Record<string, unknown>, trackingNumber: string | null): string {
  const explicit = normalizeText(snapshot.courierName) || normalizeText(snapshot.courier);
  if (explicit) return explicit;
  if (trackingNumber) return 'Assigned';
  return 'Not Assigned';
}

function resolveDeliveryStatus(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    case 'PROCESSING':
      return 'In Transit';
    case 'SHIPPED':
      return 'Shipped';
    default:
      return 'Pending Dispatch';
  }
}

function normalizeOrder(order: any) {
  const snapshot = asObject(order.shippingAddress);
  const fullName = [order.user?.firstName || '', order.user?.lastName || '']
    .join(' ')
    .trim();

  return {
    ...order,
    customerName: fullName || 'Unknown Customer',
    customerEmail: normalizeText(snapshot.email) || normalizeText(order.user?.email),
    customerPhone: normalizeText(snapshot.phone),
    customerAddress: buildAddress(snapshot),
    courierName: resolveCourierName(snapshot, order.trackingNumber),
    deliveryStatus: resolveDeliveryStatus(order.status),
  };
}

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: true,
        },
      }),
      prisma.order.count(),
    ]);

    const normalizedOrders = orders.map((order) => normalizeOrder(order));

    return NextResponse.json({
      orders: normalizedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const orderId = normalizeText(body.orderId);
    const status = normalizeText(body.status).toUpperCase();
    const courierName = normalizeText(body.courierName);
    const trackingNumber = normalizeText(body.trackingNumber);

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid delivery status' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingSnapshot = asObject(existing.shippingAddress);
    const nextSnapshot = {
      ...existingSnapshot,
      courierName: courierName || null,
    };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        trackingNumber: trackingNumber || null,
        shippingAddress: nextSnapshot,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json({
      message: 'Order updated successfully',
      order: normalizeOrder(updatedOrder),
    });
  } catch (error) {
    console.error('Admin orders PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
