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
        gatewayResponse: true,
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

    const paymentUrl =
      tx?.gatewayResponse && typeof tx.gatewayResponse === 'object'
        ? tx.gatewayResponse.paymentUrl || tx.gatewayResponse.payment_url || null
        : null;
    let paymentUrlHost = null;
    if (paymentUrl && typeof paymentUrl === 'string') {
      try {
        paymentUrlHost = new URL(paymentUrl).host;
      } catch {
        paymentUrlHost = null;
      }
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
      paymentRedirectUrlHost: paymentUrlHost,
      redirectedToProvider: Boolean(paymentUrlHost && paymentUrlHost.includes('uddoktapay.com')),
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
      gatewayResponse: true,
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
    providerRedirectCount: tx.filter((row) => {
      if (!row.gatewayResponse || typeof row.gatewayResponse !== 'object') return false;
      const paymentUrl = row.gatewayResponse.paymentUrl || row.gatewayResponse.payment_url;
      if (!paymentUrl || typeof paymentUrl !== 'string') return false;
      try {
        return new URL(paymentUrl).host.includes('uddoktapay.com');
      } catch {
        return false;
      }
    }).length,
  };

  const transactions = tx.map((row) => {
    let paymentRedirectUrlHost = null;
    if (row.gatewayResponse && typeof row.gatewayResponse === 'object') {
      const paymentUrl = row.gatewayResponse.paymentUrl || row.gatewayResponse.payment_url;
      if (paymentUrl && typeof paymentUrl === 'string') {
        try {
          paymentRedirectUrlHost = new URL(paymentUrl).host;
        } catch {
          paymentRedirectUrlHost = null;
        }
      }
    }

    return {
      ...row,
      paymentRedirectUrlHost,
      redirectedToProvider: Boolean(paymentRedirectUrlHost && paymentRedirectUrlHost.includes('uddoktapay.com')),
    };
  });

  console.log(JSON.stringify({ summary, transactions }, null, 2));
}

main()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
