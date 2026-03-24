import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentStatus } from '@/lib/paymentGateway';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gatewayTransactionId = searchParams.get('transaction_id');
    const internalTxnId = searchParams.get('internal_txn');
    const orderId = searchParams.get('order_id');
    const gateway = searchParams.get('gateway') || 'uddoktapay';

    if (!internalTxnId && !gatewayTransactionId && !orderId) {
      return NextResponse.redirect(
        new URL('/payment/failure?reason=missing_transaction', request.url)
      );
    }

    // Resolve transaction using whichever identifier is available.
    let transaction = null;

    if (internalTxnId) {
      transaction = await prisma.paymentTransaction.findUnique({
        where: { id: internalTxnId },
        include: { order: true },
      });
    }

    if (!transaction && gatewayTransactionId) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: { gatewayTransactionId },
        include: { order: true },
      });
    }

    if (!transaction && gatewayTransactionId) {
      transaction = await prisma.paymentTransaction.findUnique({
        where: { id: gatewayTransactionId },
        include: { order: true },
      });
    }

    if (!transaction && orderId) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: { orderId },
        include: { order: true },
      });
    }

    if (!transaction) {
      return NextResponse.redirect(
        new URL('/payment/failure?reason=transaction_not_found', request.url)
      );
    }

    // If already processed, redirect to success
    if (transaction.status === 'SUCCESS' || transaction.status === 'REFUNDED') {
      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${transaction.orderId}`, request.url)
      );
    }

    // Verify payment with gateway
    const verificationRef = transaction.gatewayTransactionId || gatewayTransactionId || transaction.id;
    const verification = await verifyPaymentStatus(gateway, verificationRef);

    if (!verification.success) {
      // Update transaction to failed
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: verification.message,
          completedAt: new Date(),
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      return NextResponse.redirect(
        new URL(`/payment/failure?reason=${encodeURIComponent(verification.message)}`, request.url)
      );
    }

    // Payment successful - update transaction and order
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        gatewayTransactionId: transaction.gatewayTransactionId || gatewayTransactionId || null,
        completedAt: new Date(),
        gatewayResponse: verification,
      },
    });

    // Update order status to PROCESSING
    const updatedOrder = await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: 'SUCCESS',
        status: 'PROCESSING', // Auto-transition to processing after successful payment
        notes: `${transaction.order.notes || ''}\n[Payment] Payment confirmed via ${gateway} at ${new Date().toISOString()}`.trim(),
      },
    });

    // Log successful payment
    console.log(`✓ Payment verified successfully:`, {
      transactionId: transaction.id,
      orderId: updatedOrder.id,
      amount: updatedTransaction.amount,
      gateway: gateway,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.redirect(
      new URL(`/payment/success?orderId=${updatedOrder.id}&transactionId=${transaction.id}`, request.url)
    );
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(
      new URL(`/payment/failure?reason=${encodeURIComponent('Payment verification failed. Please contact support.')}`, request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  // UddoktaPay can send webhook notifications here
  // For now, just acknowledge webhook requests
  try {
    const body = await request.json();
    
    // In future: validate webhook signature from UddoktaPay
    // For now: just log it
    console.log('UddoktaPay webhook received:', {
      timestamp: new Date().toISOString(),
      eventType: body.event_type || body.type,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
