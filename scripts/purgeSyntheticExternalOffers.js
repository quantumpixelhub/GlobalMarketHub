const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.externalProduct.deleteMany({
    where: {
      isSynthetic: true,
    },
  });

  console.log(`Deleted ${result.count} synthetic external offers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
