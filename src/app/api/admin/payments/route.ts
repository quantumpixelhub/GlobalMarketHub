import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { role: true },
  });

  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

function normalizeNumber(value: unknown): string {
  const raw = String(value || '').trim();
  return raw.replace(/\s+/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const gateways = await prisma.paymentGatewayConfig.findMany({
      where: {
        gatewayName: { in: ['uddoktapay', 'stripe', 'bkash', 'nagad', 'rocket'] },
      },
      select: {
        gatewayName: true,
        isEnabled: true,
        merchantId: true,
        apiKey: true,
        webhookUrl: true,
      },
    });

    const byName = Object.fromEntries(gateways.map((gateway) => [gateway.gatewayName, gateway]));

    return NextResponse.json({
      paymentConfig: {
        uddoktaEnabled: Boolean(byName.uddoktapay?.isEnabled),
        uddoktaApiKey: byName.uddoktapay?.apiKey || '',
        uddoktaBaseUrl: byName.uddoktapay?.webhookUrl || 'https://sandbox.uddoktapay.com/api/checkout-v2',
        bkashEnabled: Boolean(byName.bkash?.isEnabled),
        bkashNumber: byName.bkash?.merchantId || '',
        bkashAccountType: 'Personal',
        nagadEnabled: Boolean(byName.nagad?.isEnabled),
        nagadNumber: byName.nagad?.merchantId || '',
        nagadAccountType: 'Personal',
        rocketEnabled: Boolean(byName.rocket?.isEnabled),
        rocketNumber: byName.rocket?.merchantId || '',
        rocketAccountType: 'Personal',
        ipayEnabled: false,
        ipayNumber: '',
        cardPaymentEnabled: Boolean(byName.stripe?.isEnabled),
      },
    });
  } catch (error) {
    console.error('Admin payments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const bkashNumber = normalizeNumber(body.bkashNumber);
    const nagadNumber = normalizeNumber(body.nagadNumber);
    const rocketNumber = normalizeNumber(body.rocketNumber);

    await prisma.$transaction([
      prisma.paymentGatewayConfig.upsert({
        where: { gatewayName: 'bkash' },
        update: {
          isEnabled: Boolean(body.bkashEnabled),
          merchantId: bkashNumber || null,
        },
        create: {
          gatewayName: 'bkash',
          displayName: 'bKash',
          isEnabled: Boolean(body.bkashEnabled),
          isPrimary: false,
          priority: 3,
          apiKey: 'MANUAL_WALLET_BKASH',
          apiSecret: null,
          merchantId: bkashNumber || null,
        },
      }),
      prisma.paymentGatewayConfig.upsert({
        where: { gatewayName: 'nagad' },
        update: {
          isEnabled: Boolean(body.nagadEnabled),
          merchantId: nagadNumber || null,
        },
        create: {
          gatewayName: 'nagad',
          displayName: 'Nagad',
          isEnabled: Boolean(body.nagadEnabled),
          isPrimary: false,
          priority: 4,
          apiKey: 'MANUAL_WALLET_NAGAD',
          apiSecret: null,
          merchantId: nagadNumber || null,
        },
      }),
      prisma.paymentGatewayConfig.upsert({
        where: { gatewayName: 'rocket' },
        update: {
          isEnabled: Boolean(body.rocketEnabled),
          merchantId: rocketNumber || null,
        },
        create: {
          gatewayName: 'rocket',
          displayName: 'Rocket',
          isEnabled: Boolean(body.rocketEnabled),
          isPrimary: false,
          priority: 5,
          apiKey: 'MANUAL_WALLET_ROCKET',
          apiSecret: null,
          merchantId: rocketNumber || null,
        },
      }),
      prisma.paymentGatewayConfig.upsert({
        where: { gatewayName: 'uddoktapay' },
        update: {
          isEnabled: Boolean(body.uddoktaEnabled),
          apiKey: String(body.uddoktaApiKey || ''),
          webhookUrl: String(body.uddoktaBaseUrl || ''),
        },
        create: {
          gatewayName: 'uddoktapay',
          displayName: 'UddoktaPay',
          isEnabled: Boolean(body.uddoktaEnabled),
          isPrimary: true,
          priority: 1,
          apiKey: String(body.uddoktaApiKey || 'MANUAL_UDDOKTA_KEY'),
          apiSecret: null,
          webhookUrl: String(body.uddoktaBaseUrl || ''),
        },
      }),
      prisma.paymentGatewayConfig.upsert({
        where: { gatewayName: 'stripe' },
        update: {
          isEnabled: Boolean(body.cardPaymentEnabled),
        },
        create: {
          gatewayName: 'stripe',
          displayName: 'Stripe',
          isEnabled: Boolean(body.cardPaymentEnabled),
          isPrimary: false,
          priority: 2,
          apiKey: 'MANUAL_STRIPE',
          apiSecret: null,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Payment configuration saved.' });
  } catch (error) {
    console.error('Admin payments PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
