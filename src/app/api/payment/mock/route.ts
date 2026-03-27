import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';

type JsonRecord = Record<string, unknown>;

function maskMobile(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

async function resolveSavedMobile(args: {
  userId?: string;
  gateway: string;
}) {
  const { userId, gateway } = args;

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

  const customer = latestSuccess?.customerDetails;
  if (customer && typeof customer === 'object') {
    const saved = (customer as JsonRecord).walletPhone;
    if (typeof saved === 'string' && saved.trim()) return saved.trim();
  }

  const gatewayResponse = latestSuccess?.gatewayResponse;
  if (gatewayResponse && typeof gatewayResponse === 'object') {
    const saved = (gatewayResponse as JsonRecord).savedWalletPhone;
    if (typeof saved === 'string' && saved.trim()) return saved.trim();
  }

  return null;
}

function normalizeDigits(value: string | null | undefined): string {
  return String(value || '').replace(/\D/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please login to continue payment.' }, { status: 401 });
    }

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
      userId: transaction.userId,
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
    if (!auth.success) {
      return NextResponse.json({ error: 'Please login to submit payment.' }, { status: 401 });
    }

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
            password: true,
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

    const savedMobile = await resolveSavedMobile({ userId: transaction.userId, gateway });

    const passwordMatches = await verifyPassword(password, transaction.user.password);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    if (!savedMobile) {
      const digits = mobileNumber.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 14) {
        return NextResponse.json({ error: 'Valid mobile number is required.' }, { status: 400 });
      }

      const registeredDigits = normalizeDigits(transaction.user.phone);
      if (registeredDigits && digits !== registeredDigits) {
        return NextResponse.json({ error: 'Mobile number does not match your registered account.' }, { status: 400 });
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
            walletPhone: savedMobile || mobileNumber,
          } as any,
          gatewayResponse: {
            ...(typeof transaction.gatewayResponse === 'object' && transaction.gatewayResponse ? transaction.gatewayResponse : {}),
            verifiedAt: new Date().toISOString(),
            paymentStatus: 'SUCCESS',
            gateway,
            usedSavedAccount: Boolean(savedMobile),
            savedWalletPhone: savedMobile || mobileNumber,
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
        amount: Number(transaction.amount),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mock payment POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
