const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const parseNumber = (value, fallback = 0) => {
  const num = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : fallback;
};

const normalizeText = (value) => String(value || '').trim();

const slugParts = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

async function findRelatedProduct(title) {
  const parts = slugParts(title).slice(0, 5);
  if (!parts.length) return null;

  const where = {
    isActive: true,
    OR: parts.map((token) => ({
      title: { contains: token, mode: 'insensitive' },
    })),
  };

  return prisma.product.findFirst({
    where,
    orderBy: { reviewCount: 'desc' },
    select: { id: true },
  });
}

async function main() {
  const inputFile = process.env.EXTERNAL_IMPORT_FILE || 'data/external-offers.json';
  const filePath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(payload)) {
    throw new Error('Input JSON must be an array of offer objects.');
  }

  let upserted = 0;
  let skipped = 0;

  for (const row of payload) {
    const platform = normalizeText(row.platform).toLowerCase();
    const externalId = normalizeText(row.externalId || row.id || row.url);
    const externalUrl = normalizeText(row.externalUrl || row.url);
    const title = normalizeText(row.title || row.productTitle);

    if (!platform || !externalId || !externalUrl || !title) {
      skipped += 1;
      continue;
    }

    const currentPrice = parseNumber(row.externalPrice ?? row.price, NaN);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      skipped += 1;
      continue;
    }

    const originalPrice = parseNumber(row.externalOriginalPrice ?? row.originalPrice, currentPrice);
    const rating = parseNumber(row.externalRating ?? row.rating, 0);
    const reviewCount = Math.max(0, Math.round(parseNumber(row.externalReviewCount ?? row.reviewCount, 0)));
    const relatedProduct = await findRelatedProduct(title);

    await prisma.externalProduct.upsert({
      where: {
        platform_externalId: {
          platform,
          externalId,
        },
      },
      update: {
        productId: relatedProduct?.id || null,
        externalUrl,
        title,
        sellerName: normalizeText(row.sellerName || row.seller || row.shopName) || null,
        imageUrl: normalizeText(row.imageUrl || row.image || row.thumbnail) || null,
        categoryName: normalizeText(row.categoryName || row.category) || null,
        externalPrice: currentPrice,
        externalOriginalPrice: originalPrice,
        externalRating: rating > 0 ? rating : null,
        externalReviewCount: reviewCount,
        isTracked: true,
        isSynthetic: false,
        lastSyncedAt: new Date(),
      },
      create: {
        productId: relatedProduct?.id || null,
        platform,
        externalId,
        externalUrl,
        title,
        sellerName: normalizeText(row.sellerName || row.seller || row.shopName) || null,
        imageUrl: normalizeText(row.imageUrl || row.image || row.thumbnail) || null,
        categoryName: normalizeText(row.categoryName || row.category) || null,
        externalPrice: currentPrice,
        externalOriginalPrice: originalPrice,
        externalRating: rating > 0 ? rating : null,
        externalReviewCount: reviewCount,
        isTracked: true,
        isSynthetic: false,
        lastSyncedAt: new Date(),
      },
    });

    upserted += 1;
  }

  console.log(`Real external import complete. Upserted=${upserted}, Skipped=${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
