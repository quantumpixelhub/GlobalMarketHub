const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  console.log('Importing internet products by category...');

  const [categories, sellers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.seller.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  if (!categories.length || !sellers.length) {
    throw new Error('Categories or sellers are missing. Run seed first.');
  }

  const response = await fetch('https://dummyjson.com/products?limit=100');
  if (!response.ok) {
    throw new Error(`Failed to fetch internet products: ${response.status}`);
  }

  const payload = await response.json();
  const internetProducts = payload.products || [];

  if (!internetProducts.length) {
    throw new Error('No internet products returned from source API.');
  }

  let createdCount = 0;

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const source = internetProducts[i % internetProducts.length];
    const seller = sellers[i % sellers.length];

    const baseTitle = `${source.title} - ${category.name}`;
    const baseSlug = slugify(baseTitle).slice(0, 70);
    const uniqueSuffix = `${Date.now()}-${i}`;
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const sku = `IMP-${String(i + 1).padStart(4, '0')}-${Date.now().toString().slice(-6)}`;

    const sourcePrice = Number(source.price || 25);
    const currentPrice = Math.max(500, Math.round(sourcePrice * 110));
    const originalPrice = Math.round(currentPrice * 1.2);
    const image = source.thumbnail || source.images?.[0] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500';

    await prisma.product.create({
      data: {
        title: baseTitle,
        slug,
        sku,
        description: source.description || `Imported internet product for ${category.name}`,
        originalPrice,
        currentPrice,
        mainImage: image,
        images: source.images?.length ? source.images : [image],
        stock: Math.max(10, Number(source.stock || 40)),
        lowStockThreshold: 10,
        categoryId: category.id,
        sellerId: seller.id,
        rating: Number(source.rating || 4.2),
        reviewCount: Math.max(10, Number(source.reviews?.length || 20)),
        specifications: {
          source: 'dummyjson.com',
          internetCategory: source.category || 'general',
          brand: source.brand || 'Generic',
        },
        certifications: ['internet-imported'],
        isActive: true,
        isFeatured: false,
      },
    });

    createdCount += 1;
  }

  console.log(`Done. Created ${createdCount} internet-sourced products across ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
