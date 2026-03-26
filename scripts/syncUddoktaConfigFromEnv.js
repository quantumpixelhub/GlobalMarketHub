const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  }
}

function normalize(value) {
  return String(value || '').trim();
}

function isPlaceholder(value) {
  const v = normalize(value);
  return (
    !v ||
    v.startsWith('MANUAL_') ||
    v.includes('_HERE') ||
    v.includes('_API_KEY') ||
    v.includes('_SECRET') ||
    v.includes('yourapp.com')
  );
}

async function main() {
  loadEnv();

  const apiKey = normalize(process.env.UDDOKTAPAY_API_KEY);
  const checkoutUrl = normalize(
    process.env.UDDOKTAPAY_CHECKOUT_V2_URL ||
    process.env.UDDOKTAPAY_CHECKOUT_URL ||
    process.env.UDDOKTAPAY_PAYMENT_URL ||
    process.env.UDDOKTAPAY_API_URL
  );
  const merchantId = normalize(process.env.UDDOKTAPAY_MERCHANT_ID);

  if (!apiKey || isPlaceholder(apiKey)) {
    throw new Error('Missing or placeholder UDDOKTAPAY_API_KEY in environment.');
  }

  const existing = await prisma.paymentGatewayConfig.findUnique({
    where: { gatewayName: 'uddoktapay' },
    select: {
      id: true,
      apiKey: true,
      webhookUrl: true,
      merchantId: true,
      isEnabled: true,
    },
  });

  const data = {
    displayName: 'UddoktaPay',
    isEnabled: true,
    isPrimary: true,
    priority: 1,
    apiKey,
    apiSecret: normalize(process.env.UDDOKTAPAY_API_SECRET) || null,
    merchantId: merchantId || existing?.merchantId || null,
    webhookUrl: checkoutUrl || existing?.webhookUrl || null,
    description: 'Primary wallet gateway via UddoktaPay',
  };

  const row = await prisma.paymentGatewayConfig.upsert({
    where: { gatewayName: 'uddoktapay' },
    update: data,
    create: {
      gatewayName: 'uddoktapay',
      ...data,
      transactionFee: 0,
      fixedFee: 0,
      minAmount: 1,
      maxAmount: 999999,
    },
    select: {
      gatewayName: true,
      isEnabled: true,
      apiKey: true,
      webhookUrl: true,
      merchantId: true,
      updatedAt: true,
    },
  });

  console.log(JSON.stringify({
    synced: true,
    gatewayName: row.gatewayName,
    enabled: row.isEnabled,
    apiKeyPresent: Boolean(row.apiKey),
    apiKeyPlaceholder: isPlaceholder(row.apiKey),
    webhookUrlPresent: Boolean(normalize(row.webhookUrl)),
    merchantIdPresent: Boolean(normalize(row.merchantId)),
    updatedAt: row.updatedAt,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Failed to sync Uddokta config from env:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
