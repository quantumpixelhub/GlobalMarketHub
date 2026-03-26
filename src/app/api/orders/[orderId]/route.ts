import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

function formatShippingAddress(shippingAddress: unknown): string {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return 'Address unavailable';
  }

  const data = shippingAddress as Record<string, unknown>;
  const parts = [
    String(data.address || '').trim(),
    String(data.upazila || '').trim(),
    String(data.district || '').trim(),
    String(data.division || '').trim(),
    String(data.postCode || '').trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address unavailable';
}

export async function GET(request: NextRequest, context: { params: { orderId: string } }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String(auth.data?.userId || '');
    const orderId = String(context.params.orderId || '').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImage: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            gatewayName: true,
            gatewayTransactionId: true,
            status: true,
            amount: true,
            currency: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shippingAddressObj =
      order.shippingAddress && typeof order.shippingAddress === 'object' && !Array.isArray(order.shippingAddress)
        ? (order.shippingAddress as Record<string, unknown>)
        : {};

    const customerName = `${String(shippingAddressObj.firstName || '').trim()} ${String(shippingAddressObj.lastName || '').trim()}`.trim() || 'Customer';

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        shipping: Number(order.shipping),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        customerName,
        shippingAddress: formatShippingAddress(order.shippingAddress),
        shippingAddressRaw: order.shippingAddress,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productTitle: item.product?.title || 'Product',
          productImage: item.product?.mainImage || null,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          lineTotal: Number(item.price) * item.quantity,
        })),
        payment: order.payment
          ? {
              id: order.payment.id,
              gatewayName: order.payment.gatewayName,
              gatewayTransactionId: order.payment.gatewayTransactionId,
              status: order.payment.status,
              amount: Number(order.payment.amount),
              currency: order.payment.currency,
              createdAt: order.payment.createdAt,
              completedAt: order.payment.completedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
