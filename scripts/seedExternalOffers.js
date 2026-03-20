const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const domesticPlatforms = [
  { key: 'daraz', url: 'https://www.daraz.com.bd/catalog/?q=' },
  { key: 'pickaboo', url: 'https://www.pickaboo.com/catalogsearch/result/?q=' },
  { key: 'ryans', url: 'https://www.ryans.com/search?q=' },
  { key: 'startech', url: 'https://www.startech.com.bd/product/search?search=' },
  { key: 'othoba', url: 'https://othoba.com/search?text=' },
  { key: 'chaldal', url: 'https://chaldal.com/search/' },
];

const internationalPlatforms = [
  { key: 'amazon', url: 'https://www.amazon.com/s?k=' },
  { key: 'alibaba', url: 'https://www.alibaba.com/trade/search?SearchText=' },
];

const getAdjustedPrice = (basePrice, percentDelta) => {
  const adjusted = Math.round(basePrice * (1 + percentDelta));
  return Math.max(1, adjusted);
};

async function main() {
  console.log('Seeding external marketplace offers...');

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      currentPrice: true,
      originalPrice: true,
      rating: true,
      reviewCount: true,
    },
    take: 300,
    orderBy: { createdAt: 'asc' },
  });

  if (products.length === 0) {
    console.log('No active products found. Run db seed first.');
    return;
  }

  let upsertCount = 0;

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    const titleQuery = encodeURIComponent(product.title);
    const localPrice = Number(product.currentPrice);
    const localOriginalPrice = Number(product.originalPrice);
    const rating = Number(product.rating || 0);

    const domesticA = domesticPlatforms[i % domesticPlatforms.length];
    const domesticB = domesticPlatforms[(i + 2) % domesticPlatforms.length];
    const international = internationalPlatforms[i % internationalPlatforms.length];

    const offers = [
      {
        platform: domesticA.key,
        externalId: `${product.id}-${domesticA.key}`,
        externalUrl: `${domesticA.url}${titleQuery}`,
        externalPrice: getAdjustedPrice(localPrice, -0.04),
        externalOriginalPrice: getAdjustedPrice(localOriginalPrice || localPrice, 0.03),
        externalRating: Math.min(5, Math.max(1, rating + 0.1)),
        externalReviewCount: Math.max(5, product.reviewCount + 15),
      },
      {
        platform: domesticB.key,
        externalId: `${product.id}-${domesticB.key}`,
        externalUrl: `${domesticB.url}${titleQuery}`,
        externalPrice: getAdjustedPrice(localPrice, 0.02),
        externalOriginalPrice: getAdjustedPrice(localOriginalPrice || localPrice, 0.06),
        externalRating: Math.min(5, Math.max(1, rating - 0.05)),
        externalReviewCount: Math.max(5, product.reviewCount + 8),
      },
      {
        platform: international.key,
        externalId: `${product.id}-${international.key}`,
        externalUrl: `${international.url}${titleQuery}`,
        externalPrice: getAdjustedPrice(localPrice, -0.01),
        externalOriginalPrice: getAdjustedPrice(localOriginalPrice || localPrice, 0.05),
        externalRating: Math.min(5, Math.max(1, rating + 0.05)),
        externalReviewCount: Math.max(5, product.reviewCount + 22),
      },
    ];

    for (const offer of offers) {
      await prisma.externalProduct.upsert({
        where: {
          platform_externalId: {
            platform: offer.platform,
            externalId: offer.externalId,
          },
        },
        update: {
          externalUrl: offer.externalUrl,
          externalPrice: offer.externalPrice,
          externalOriginalPrice: offer.externalOriginalPrice,
          externalRating: offer.externalRating,
          externalReviewCount: offer.externalReviewCount,
          isTracked: true,
          lastSyncedAt: new Date(),
        },
        create: {
          productId: product.id,
          platform: offer.platform,
          externalId: offer.externalId,
          externalUrl: offer.externalUrl,
          externalPrice: offer.externalPrice,
          externalOriginalPrice: offer.externalOriginalPrice,
          externalRating: offer.externalRating,
          externalReviewCount: offer.externalReviewCount,
          isTracked: true,
          lastSyncedAt: new Date(),
        },
      });

      upsertCount += 1;
    }
  }

  console.log(`Done. Upserted ${upsertCount} external offers for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
