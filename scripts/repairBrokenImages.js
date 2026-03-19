const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const replacements = {
  'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500': 'https://picsum.photos/id/1/800/600',
  'https://images.unsplash.com/photo-1542272604-787c62e4d0d8?w=500': 'https://picsum.photos/id/21/800/600',
  'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500': 'https://picsum.photos/id/71/800/600',
  'https://images.unsplash.com/photo-1584990347449-a49f9f15f203?w=500': 'https://picsum.photos/id/1084/800/600',
  'https://images.unsplash.com/photo-1588273889974-48eaf60a26be?w=500': 'https://picsum.photos/id/1060/800/600',
  'https://images.unsplash.com/photo-1584622281867-8759c6673ce6?w=500': 'https://picsum.photos/id/103/800/600',
  'https://images.unsplash.com/photo-1556821840-3a9fbc8b23f4?w=500': 'https://picsum.photos/id/433/800/600',
};

const replaceUrl = (url) => replacements[url] || url;

async function main() {
  console.log('Repairing broken product/category image URLs...');

  const products = await prisma.product.findMany({
    select: { id: true, mainImage: true, images: true },
  });

  let updatedProducts = 0;
  for (const product of products) {
    const mainImage = replaceUrl(product.mainImage);
    const images = (product.images || []).map(replaceUrl);

    if (mainImage !== product.mainImage || JSON.stringify(images) !== JSON.stringify(product.images || [])) {
      await prisma.product.update({
        where: { id: product.id },
        data: { mainImage, images },
      });
      updatedProducts += 1;
    }
  }

  const categories = await prisma.category.findMany({
    select: { id: true, image: true },
  });

  let updatedCategories = 0;
  for (const category of categories) {
    if (!category.image) continue;
    const image = replaceUrl(category.image);
    if (image !== category.image) {
      await prisma.category.update({
        where: { id: category.id },
        data: { image },
      });
      updatedCategories += 1;
    }
  }

  console.log(`Updated products: ${updatedProducts}`);
  console.log(`Updated categories: ${updatedCategories}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
