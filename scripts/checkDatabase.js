const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...\n');

    // Check products
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isActive: true } });
    console.log(`📦 Products:`);
    console.log(`   Total: ${totalProducts}`);
    console.log(`   Active: ${activeProducts}`);

    // Check categories
    const totalCategories = await prisma.category.count();
    const categoriesWithIcons = await prisma.category.count({ where: { icon: { not: null } } });
    const categoriesWithImages = await prisma.category.count({ where: { image: { not: null } } });
    console.log(`\n📁 Categories:`);
    console.log(`   Total: ${totalCategories}`);
    console.log(`   With icons: ${categoriesWithIcons}`);
    console.log(`   With images: ${categoriesWithImages}`);

    // Sample products
    if (totalProducts > 0) {
      const sampleProducts = await prisma.product.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          categoryId: true,
          category: { select: { name: true } },
          isActive: true,
        },
      });
      console.log(`\n📋 Sample Products:`);
      sampleProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} (Category: ${p.category?.name || 'N/A'}, Active: ${p.isActive})`);
      });
    } else {
      console.log(`\n⚠️  No products found in database!`);
    }

    // Check sellers
    const totalSellers = await prisma.seller.count();
    console.log(`\n🏪 Sellers: ${totalSellers}`);

    // Check if products have valid category references
    const productsWithoutCategory = await prisma.product.count({ where: { category: null } });
    console.log(`\n❌ Products without valid category: ${productsWithoutCategory}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
