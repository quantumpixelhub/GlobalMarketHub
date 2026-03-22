const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORY_MERGE_MAP = {
  smartphones: 'electronics-gadgets',
  'mobile-accessories': 'electronics-gadgets',
  'laptops-computers-top20': 'electronics-gadgets',
  'audio-earbuds': 'electronics-gadgets',
  'men-fashion-top20': 'fashion-apparel',
  'women-fashion-top20': 'fashion-apparel',
  'beauty-skincare-top20': 'beauty-personal-care',
  'makeup-personal-care-top20': 'beauty-personal-care',
  'groceries-top20': 'food-grocery-beverages',
  'beverages-top20': 'food-grocery-beverages',
  'home-decor-top20': 'home-furniture-living',
  'kitchen-essentials-top20': 'home-furniture-living',
  'home-appliances-top20': 'home-furniture-living',
  'baby-kids-top20': 'toys-kids-baby',
  'toys-games-top20': 'toys-kids-baby',
  'health-wellness-top20': 'health-wellness',
  'sports-outdoor-top20': 'sports-outdoor',
  'automotive-tools-top20': 'automotive-tools',
  'office-stationery-top20': 'office-business-stationery',
  'travel-luggage-top20': 'travel-luggage-lifestyle',
};

async function main() {
  const slugs = Object.keys(CATEGORY_MERGE_MAP);
  const targets = Array.from(new Set(Object.values(CATEGORY_MERGE_MAP)));

  const [sourceCategories, targetCategories] = await Promise.all([
    prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true } }),
    prisma.category.findMany({ where: { slug: { in: targets } }, select: { id: true, slug: true, name: true } }),
  ]);

  const targetBySlug = new Map(targetCategories.map((c) => [c.slug, c]));
  let movedProducts = 0;

  for (const source of sourceCategories) {
    const targetSlug = CATEGORY_MERGE_MAP[source.slug];
    const target = targetBySlug.get(targetSlug);
    if (!target) {
      throw new Error(`Missing target category for slug ${targetSlug}`);
    }

    if (source.id === target.id) continue;

    const moved = await prisma.product.updateMany({
      where: { categoryId: source.id },
      data: { categoryId: target.id },
    });

    movedProducts += moved.count;
    console.log(`Moved ${moved.count} products: ${source.slug} -> ${target.slug}`);
  }

  const existingSources = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  const existingSourceIds = existingSources.map((c) => c.id);

  const productCounts = existingSourceIds.length
    ? await prisma.product.groupBy({
        by: ['categoryId'],
        where: { categoryId: { in: existingSourceIds } },
        _count: { _all: true },
      })
    : [];

  const inUseSet = new Set(productCounts.map((c) => c.categoryId));
  const deletableIds = existingSourceIds.filter((id) => !inUseSet.has(id));

  let deletedCategories = 0;
  if (deletableIds.length) {
    const del = await prisma.category.deleteMany({ where: { id: { in: deletableIds } } });
    deletedCategories = del.count;
  }

  console.log(`Total moved products: ${movedProducts}`);
  console.log(`Deleted empty duplicate categories: ${deletedCategories}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
