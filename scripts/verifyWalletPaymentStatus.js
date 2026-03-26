const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const totalsMode = args.includes('--totals');
  const requestedId = args.find((arg) => arg && !arg.startsWith('--')) ? String(args.find((arg) => arg && !arg.startsWith('--'))).trim() : '';

  if (totalsMode) {
    const [successCount, pendingCount, failedCount, totalCount] = await Promise.all([
      prisma.paymentTransaction.count({
        where: { paymentMethod: { in: ['bkash', 'nagad'] }, status: 'SUCCESS' },
      }),
      prisma.paymentTransaction.count({
        where: { paymentMethod: { in: ['bkash', 'nagad'] }, status: 'PENDING' },
      }),
      prisma.paymentTransaction.count({
        where: { paymentMethod: { in: ['bkash', 'nagad'] }, status: 'FAILED' },
      }),
      prisma.paymentTransaction.count({
        where: { paymentMethod: { in: ['bkash', 'nagad'] } },
      }),
    ]);

    console.log(JSON.stringify({
      totals: {
        totalCount,
        successCount,
        pendingCount,
        failedCount,
      },
    }, null, 2));
    return;
  }

  if (requestedId) {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { id: requestedId },
      select: {
        id: true,
        paymentMethod: true,
        gatewayName: true,
        status: true,
        amount: true,
        createdAt: true,
        completedAt: true,
        gatewayTransactionId: true,
        errorMessage: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            paymentStatus: true,
            status: true,
          },
        },
      },
    });

    if (!tx) {
      console.log(JSON.stringify({
        found: false,
        id: requestedId,
        message: 'No payment transaction found with this id.',
      }, null, 2));
      return;
    }

    const successful = tx.status === 'SUCCESS' && tx.order?.paymentStatus === 'SUCCESS';
    console.log(JSON.stringify({
      found: true,
      id: tx.id,
      paymentMethod: tx.paymentMethod,
      gatewayName: tx.gatewayName,
      transactionStatus: tx.status,
      orderPaymentStatus: tx.order?.paymentStatus || null,
      orderStatus: tx.order?.status || null,
      successful,
      details: tx,
    }, null, 2));
    return;
  }

  const tx = await prisma.paymentTransaction.findMany({
    where: {
      paymentMethod: {
        in: ['bkash', 'nagad'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    select: {
      id: true,
      paymentMethod: true,
      gatewayName: true,
      status: true,
      amount: true,
      createdAt: true,
      completedAt: true,
      gatewayTransactionId: true,
      errorMessage: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          paymentStatus: true,
          status: true,
        },
      },
    },
  });

  const summary = {
    totalChecked: tx.length,
    successCount: tx.filter((row) => row.status === 'SUCCESS' && row.order?.paymentStatus === 'SUCCESS').length,
    pendingCount: tx.filter((row) => row.status === 'PENDING').length,
    failedCount: tx.filter((row) => row.status === 'FAILED' || row.order?.paymentStatus === 'FAILED').length,
  };

  console.log(JSON.stringify({ summary, transactions: tx }, null, 2));
}

main()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
