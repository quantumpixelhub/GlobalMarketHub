const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check with images
    const withImages = await prisma.externalProduct.count({
      where: {
        title: { contains: 'airpods', mode: 'insensitive' },
        imageUrl: { not: null },
      },
    });

    // Check without images
    const withoutImages = await prisma.externalProduct.count({
      where: {
        title: { contains: 'airpods', mode: 'insensitive' },
        imageUrl: null,
      },
    });

    console.log(`Airpods in catalog: ${withImages} with images, ${withoutImages} without images`);

    // Get some samples to see what data we have
    const samples = await prisma.externalProduct.findMany({
      where: {
        title: { contains: 'airpods', mode: 'insensitive' },
      },
      select: { title: true, imageUrl: true, platform: true },
      take: 5,
    });

    console.log('\nSample products:');
    samples.forEach((p, i) => {
      console.log(`${i + 1}. Title: ${p.title.slice(0, 60)}...`);
      console.log(`   Platform: ${p.platform}`);
      console.log(`   Image: ${p.imageUrl ? p.imageUrl.slice(0, 80) + '...' : 'NULL'}`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
