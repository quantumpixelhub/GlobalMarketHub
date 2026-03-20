const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const platforms = ['daraz', 'pickaboo', 'ryans', 'startech', 'othoba', 'chaldal', 'amazon', 'alibaba'];

async function main() {
  let updatedTotal = 0;

  for (const platform of platforms) {
    const updated = await prisma.externalProduct.updateMany({
      where: {
        platform,
        externalId: {
          startsWith: 'c',
          endsWith: `-${platform}`,
        },
      },
      data: {
        isSynthetic: true,
      },
    });

    updatedTotal += updated.count;
  }

  console.log(`Tagged ${updatedTotal} synthetic offers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
