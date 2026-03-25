import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

const RECOVERY_TAG = '[RECOVERED_ORDER]';

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

function hasRecoveryTag(notes: string | null | undefined): boolean {
  return normalizeText(notes).includes(RECOVERY_TAG);
}

function appendRecoveryTag(notes: string | null | undefined): string {
  const normalized = normalizeText(notes);
  if (normalized.includes(RECOVERY_TAG)) {
    return normalized;
  }
  return normalized ? `${normalized} ${RECOVERY_TAG}` : RECOVERY_TAG;
}

function normalizeOrder(order: any) {
  const snapshot = asObject(order.shippingAddress);
  const fullName = [order.user?.firstName || '', order.user?.lastName || '']
    .join(' ')
    .trim();
  const courierName = resolveCourierName(snapshot, order.trackingNumber);
  const hasTrackingNumber = Boolean(normalizeText(order.trackingNumber));
  const hasCourier = courierName !== 'Not Assigned';
  const isIncomplete = !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status);
  const isRecovered = hasRecoveryTag(order.notes);

  let trackingProgress = 'Completed';
  if (isIncomplete) {
    if (hasTrackingNumber && hasCourier) {
      trackingProgress = 'Tracking Active';
    } else if (hasTrackingNumber || hasCourier) {
      trackingProgress = 'Partially Assigned';
    } else {
      trackingProgress = 'Pending Assignment';
    }
  }

  return {
    ...order,
    customerName: fullName || 'Unknown Customer',
    customerEmail: normalizeText(snapshot.email) || normalizeText(order.user?.email),
    customerPhone: normalizeText(snapshot.phone),
    customerAddress: buildAddress(snapshot),
    courierName,
    deliveryStatus: resolveDeliveryStatus(order.status),
    isIncomplete,
    isRecovered,
    trackingProgress,
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
    const view = normalizeText(searchParams.get('view') || '').toLowerCase();

    const incompleteStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
    ];
    const whereClause: Prisma.OrderWhereInput =
      view === 'incomplete'
        ? {
            status: {
              in: incompleteStatuses,
            },
          }
        : view === 'recovered'
          ? {
              notes: {
                contains: RECOVERY_TAG,
              },
            }
        : view === 'refunded'
          ? {
              paymentStatus: PaymentStatus.REFUNDED,
            }
          : {};

    const [orders, total, incompleteCount, refundedCount, recoveredCount, recoveredAmountAgg] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
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
          payment: {
            select: {
              id: true,
              gatewayName: true,
              gatewayTransactionId: true,
              status: true,
              amount: true,
              completedAt: true,
            },
          },
        },
      }),
      prisma.order.count({ where: whereClause }),
      prisma.order.count({
        where: {
          status: {
            in: incompleteStatuses,
          },
        },
      }),
      prisma.order.count({
        where: {
          paymentStatus: PaymentStatus.REFUNDED,
        },
      }),
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
      summary: {
        filter:
          view === 'incomplete'
            ? 'incomplete'
            : view === 'recovered'
              ? 'recovered'
              : view === 'refunded'
                ? 'refunded'
                : 'all',
        incompleteCount,
        refundedCount,
        recoveredCount,
        recoveredAmount: Number(recoveredAmountAgg._sum.totalAmount || 0),
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
    const action = normalizeText(body.action).toLowerCase();
    const orderId = normalizeText(body.orderId);
    const status = normalizeText(body.status).toUpperCase();
    const courierName = normalizeText(body.courierName);
    const trackingNumber = normalizeText(body.trackingNumber);

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (action !== 'recover' && !allowedStatuses.includes(status)) {
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
        payment: {
          select: {
            id: true,
            gatewayName: true,
            gatewayTransactionId: true,
            status: true,
            amount: true,
            completedAt: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingSnapshot = asObject(existing.shippingAddress);
    const nowIso = new Date().toISOString();

    if (action === 'recover') {
      if (hasRecoveryTag(existing.notes)) {
        return NextResponse.json({ error: 'Order has already been recovered' }, { status: 400 });
      }

      if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(existing.status)) {
        return NextResponse.json(
          { error: 'Only incomplete orders can be recovered' },
          { status: 400 }
        );
      }

      const recoveredSnapshot = {
        ...existingSnapshot,
        recoveredAt: nowIso,
        recoveredBy: admin.id,
      };

      const recoveredOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: existing.status === 'PENDING' ? 'PROCESSING' : existing.status,
          notes: appendRecoveryTag(existing.notes),
          shippingAddress: recoveredSnapshot,
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
          payment: {
            select: {
              id: true,
              gatewayName: true,
              gatewayTransactionId: true,
              status: true,
              amount: true,
              completedAt: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Order recovered successfully',
        order: normalizeOrder(recoveredOrder),
      });
    }

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
        payment: {
          select: {
            id: true,
            gatewayName: true,
            gatewayTransactionId: true,
            status: true,
            amount: true,
            completedAt: true,
          },
        },
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
