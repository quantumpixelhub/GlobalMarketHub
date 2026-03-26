const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function isPlaceholder(value) {
  if (!value) return true;
  const v = String(value).trim();
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
  const rows = await prisma.paymentGatewayConfig.findMany({
    where: {
      gatewayName: {
        in: ['uddoktapay', 'bkash', 'nagad', 'rocket'],
      },
    },
    select: {
      gatewayName: true,
      isEnabled: true,
      apiKey: true,
      merchantId: true,
      webhookUrl: true,
      updatedAt: true,
    },
    orderBy: {
      gatewayName: 'asc',
    },
  });

  const output = rows.map((row) => ({
    gatewayName: row.gatewayName,
    enabled: row.isEnabled,
    apiKeyPresent: Boolean(row.apiKey && String(row.apiKey).trim()),
    apiKeyPlaceholder: isPlaceholder(row.apiKey),
    merchantIdPresent: Boolean(row.merchantId && String(row.merchantId).trim()),
    webhookUrlPresent: Boolean(row.webhookUrl && String(row.webhookUrl).trim()),
    updatedAt: row.updatedAt,
  }));

  console.log(JSON.stringify({
    count: rows.length,
    gateways: output,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('DB gateway config check failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
