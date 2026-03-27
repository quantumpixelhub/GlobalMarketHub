import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

type JsonRecord = Record<string, unknown>;

function getPhoneFromJson(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  const source = details as JsonRecord;
  const phone = source.phone || source.mobile || source.senderNumber;
  return typeof phone === 'string' && phone.trim() ? phone.trim() : null;
}

function maskMobile(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

async function resolveSavedMobile(args: {
  userId?: string;
  transactionUserPhone?: string | null;
  transactionPhone?: string | null;
  gateway: string;
}) {
  const { userId, transactionUserPhone, transactionPhone, gateway } = args;

  if (transactionPhone) return transactionPhone;
  if (transactionUserPhone) return transactionUserPhone;

  if (!userId) return null;

  const latestSuccess = await prisma.paymentTransaction.findFirst({
    where: {
      userId,
      paymentMethod: gateway,
      status: 'SUCCESS',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      customerDetails: true,
      gatewayResponse: true,
    },
  });

  const phoneFromCustomer = getPhoneFromJson(latestSuccess?.customerDetails);
  if (phoneFromCustomer) return phoneFromCustomer;

  return getPhoneFromJson(latestSuccess?.gatewayResponse);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const transactionId = String(searchParams.get('transactionId') || '');
    const gateway = String(searchParams.get('gateway') || 'bkash').toLowerCase();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    const requesterUserId = String(auth.data?.userId || '');
    if (auth.success && requesterUserId && requesterUserId !== transaction.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const savedMobile = await resolveSavedMobile({
      userId: auth.success ? transaction.userId : undefined,
      transactionUserPhone: transaction.user?.phone || null,
      transactionPhone: getPhoneFromJson(transaction.customerDetails),
      gateway,
    });

    return NextResponse.json(
      {
        transactionId: transaction.id,
        invoiceId: transaction.gatewayTransactionId || transaction.id,
        gateway,
        amount: Number(transaction.amount),
        hasSavedAccount: Boolean(savedMobile),
        savedMobileMasked: maskMobile(savedMobile),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mock payment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const body = await request.json();

    const transactionId = String(body?.transactionId || '');
    const gateway = String(body?.gateway || 'bkash').toLowerCase();
    const mobileNumber = String(body?.mobileNumber || '').trim();
    const password = String(body?.password || '').trim();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    const requesterUserId = String(auth.data?.userId || '');
    if (auth.success && requesterUserId && requesterUserId !== transaction.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const savedMobile = await resolveSavedMobile({
      userId: auth.success ? transaction.userId : undefined,
      transactionUserPhone: transaction.user?.phone || null,
      transactionPhone: getPhoneFromJson(transaction.customerDetails),
      gateway,
    });

    if (!savedMobile) {
      const digits = mobileNumber.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 14) {
        return NextResponse.json({ error: 'Valid mobile number is required.' }, { status: 400 });
      }
    }

    if (transaction.status !== 'SUCCESS') {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          paymentMethod: gateway,
          completedAt: new Date(),
          customerDetails: {
            ...(typeof transaction.customerDetails === 'object' && transaction.customerDetails ? transaction.customerDetails : {}),
            phone: savedMobile || mobileNumber,
          } as any,
          gatewayResponse: {
            ...(typeof transaction.gatewayResponse === 'object' && transaction.gatewayResponse ? transaction.gatewayResponse : {}),
            verifiedAt: new Date().toISOString(),
            paymentStatus: 'SUCCESS',
            gateway,
            usedSavedAccount: Boolean(savedMobile),
          } as any,
        },
      });

      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: 'SUCCESS',
          status: 'PROCESSING',
          notes: `${transaction.order.notes || ''}\n[Payment] Confirmed via ${gateway} at ${new Date().toISOString()}`.trim(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment Successful',
        transactionId: transaction.id,
        orderId: transaction.orderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mock payment POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
