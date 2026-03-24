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

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return user;
}

function getRefundConfig() {
  return {
    refundUrl: process.env.UDDOKTAPAY_REFUND_URL || 'https://eshopping.paymently.io/api/refund-payment',
    apiKey: process.env.UDDOKTAPAY_API_KEY || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const orderId = String(body.orderId || '').trim();
    const reason = String(body.reason || 'Admin initiated refund').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.payment) {
      return NextResponse.json({ error: 'No payment transaction found for this order' }, { status: 400 });
    }

    const transaction = order.payment;
    const gateway = (transaction.gatewayName || '').toLowerCase();

    if (gateway !== 'uddoktapay') {
      return NextResponse.json({ error: 'Refund endpoint currently supports UddoktaPay only' }, { status: 400 });
    }

    if (transaction.status === 'REFUNDED' || order.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ error: 'Payment is already refunded' }, { status: 400 });
    }

    if (transaction.status !== 'SUCCESS' && order.paymentStatus !== 'SUCCESS') {
      return NextResponse.json({ error: 'Only successful payments can be refunded' }, { status: 400 });
    }

    const { refundUrl, apiKey } = getRefundConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'UDDOKTAPAY_API_KEY is not configured' }, { status: 400 });
    }

    const paymentRef = transaction.gatewayTransactionId || transaction.id;

    const refundPayload = {
      transaction_id: paymentRef,
      gateway_transaction_id: transaction.gatewayTransactionId,
      order_id: order.orderNumber,
      amount: Number(transaction.amount),
      reason,
    };

    const refundResponse = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(refundPayload),
    });

    const refundData = await refundResponse.json().catch(() => ({}));
    if (!refundResponse.ok) {
      return NextResponse.json(
        {
          error: refundData?.message || `Refund failed with status ${refundResponse.status}`,
          providerResponse: refundData,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          completedAt: new Date(),
          gatewayResponse: refundData,
          errorMessage: null,
          errorCode: null,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          status: order.status === 'CANCELLED' ? 'CANCELLED' : order.status,
          notes: `${order.notes ? `${order.notes}\n` : ''}[Refund] ${new Date().toISOString()} - ${reason}`,
        },
      });

      return {
        payment: updatedPayment,
        order: updatedOrder,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        orderId: updated.order.id,
        transactionId: updated.payment.id,
        status: updated.payment.status,
        providerResponse: refundData,
      },
    });
  } catch (error) {
    console.error('Admin refund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
