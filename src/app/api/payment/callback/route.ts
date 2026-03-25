import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentStatus } from '@/lib/paymentGateway';

async function resolveTransaction(args: {
  internalTxnId?: string | null;
  invoiceId?: string | null;
  orderId?: string | null;
}) {
  const { internalTxnId, invoiceId, orderId } = args;

  if (internalTxnId) {
    const byInternalId = await prisma.paymentTransaction.findUnique({
      where: { id: internalTxnId },
      include: { order: true },
    });
    if (byInternalId) return byInternalId;
  }

  if (invoiceId) {
    const byGatewayInvoice = await prisma.paymentTransaction.findFirst({
      where: { gatewayTransactionId: invoiceId },
      include: { order: true },
    });
    if (byGatewayInvoice) return byGatewayInvoice;
  }

  if (orderId) {
    const byOrderId = await prisma.paymentTransaction.findFirst({
      where: { orderId },
      include: { order: true },
    });
    if (byOrderId) return byOrderId;
  }

  return null;
}

async function handleVerification(args: {
  gateway: string;
  internalTxnId?: string | null;
  invoiceId?: string | null;
  orderId?: string | null;
  callbackPayload?: Record<string, unknown>;
}) {
  const { gateway, internalTxnId, invoiceId, orderId, callbackPayload } = args;
  const transaction = await resolveTransaction({ internalTxnId, invoiceId, orderId });

  if (!transaction) {
    return { ok: false, reason: 'transaction_not_found' };
  }

  if (transaction.status === 'SUCCESS' || transaction.status === 'REFUNDED') {
    return { ok: true, transactionId: transaction.id, orderId: transaction.orderId, alreadyProcessed: true };
  }

  const invoiceForVerification = invoiceId || transaction.gatewayTransactionId;
  if (!invoiceForVerification) {
    return { ok: false, reason: 'missing_invoice_id', transactionId: transaction.id, orderId: transaction.orderId };
  }

  const verification = await verifyPaymentStatus(gateway, invoiceForVerification);

  if (verification.status === 'PENDING') {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PENDING',
        gatewayTransactionId: invoiceForVerification,
        gatewayResponse: {
          ...(typeof transaction.gatewayResponse === 'object' && transaction.gatewayResponse ? transaction.gatewayResponse : {}),
          verify: verification.raw || verification,
          callbackPayload,
          verifiedAt: new Date().toISOString(),
          verificationStatus: 'PENDING',
        } as any,
      },
    });

    return {
      ok: false,
      reason: 'payment_pending',
      transactionId: transaction.id,
      orderId: transaction.orderId,
    };
  }

  if (!verification.success) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        errorMessage: verification.message,
        gatewayTransactionId: invoiceForVerification,
        completedAt: new Date(),
        gatewayResponse: {
          ...(typeof transaction.gatewayResponse === 'object' && transaction.gatewayResponse ? transaction.gatewayResponse : {}),
          verify: verification.raw || verification,
          callbackPayload,
          verifiedAt: new Date().toISOString(),
          verificationStatus: verification.status || 'ERROR',
        } as any,
      },
    });

    await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    return {
      ok: false,
      reason: verification.message || 'verification_failed',
      transactionId: transaction.id,
      orderId: transaction.orderId,
    };
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      gatewayTransactionId: invoiceForVerification,
      completedAt: new Date(),
      gatewayResponse: {
        ...(typeof transaction.gatewayResponse === 'object' && transaction.gatewayResponse ? transaction.gatewayResponse : {}),
        verify: verification.raw || verification,
        callbackPayload,
        verifiedAt: new Date().toISOString(),
        verificationStatus: verification.status,
      } as any,
    },
  });

  await prisma.order.update({
    where: { id: transaction.orderId },
    data: {
      paymentStatus: 'SUCCESS',
      status: 'PROCESSING',
      notes: `${transaction.order.notes || ''}\n[Payment] Payment confirmed via ${gateway} (${invoiceForVerification}) at ${new Date().toISOString()}`.trim(),
    },
  });

  return { ok: true, transactionId: transaction.id, orderId: transaction.orderId };
}

async function parseCallbackBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const parsed: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      parsed[key] = typeof value === 'string' ? value : value.name;
    }
    return parsed;
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId =
      searchParams.get('invoice_id') ||
      searchParams.get('invoiceId') ||
      searchParams.get('transaction_id');
    const internalTxnId = searchParams.get('internal_txn');
    const orderId = searchParams.get('order_id');
    const gateway = searchParams.get('gateway') || 'uddoktapay';

    if (!internalTxnId && !invoiceId && !orderId) {
      return NextResponse.redirect(
        new URL('/payment/failure?reason=missing_transaction', request.url)
      );
    }
    const result = await handleVerification({
      gateway,
      internalTxnId,
      invoiceId,
      orderId,
      callbackPayload: Object.fromEntries(searchParams.entries()),
    });

    if (!result.ok) {
      return NextResponse.redirect(
        new URL(`/payment/failure?reason=${encodeURIComponent(result.reason || 'verification_failed')}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/payment/success?orderId=${result.orderId}&transactionId=${result.transactionId}`, request.url)
    );
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(
      new URL(`/payment/failure?reason=${encodeURIComponent('Payment verification failed. Please contact support.')}`, request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseCallbackBody(request);
    const metadata = (body.metadata && typeof body.metadata === 'object')
      ? body.metadata as Record<string, unknown>
      : {};

    const invoiceId = String(body.invoice_id || body.invoiceId || '');
    const internalTxnId = String(body.internal_txn || metadata.internal_txn || '');
    const orderId = String(body.order_id || metadata.order_id || '');
    const gateway = String(body.gateway || metadata.selected_method || 'uddoktapay');

    if (!invoiceId && !internalTxnId && !orderId) {
      return NextResponse.json({
        success: false,
        message: 'Missing invoice_id/internal_txn/order_id in callback payload',
      }, { status: 400 });
    }

    const result = await handleVerification({
      gateway,
      internalTxnId,
      invoiceId,
      orderId,
      callbackPayload: body,
    });

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        message: result.reason || 'Verification failed',
        transactionId: result.transactionId,
        orderId: result.orderId,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      orderId: result.orderId,
    }, { status: 200 });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
