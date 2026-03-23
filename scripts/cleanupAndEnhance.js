const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define canonical category taxonomy
const CATEGORY_TAXONOMY = [
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    color: '#FF6B6B',
    children: [
      { name: 'Men', slug: 'fashion-men' },
      { name: 'Shirts T-Shirts Pants Jeans', slug: 'mens-shirts-tshirts-pants-jeans' },
      { name: 'Ethnic Wear Panjabi Kurta', slug: 'mens-ethnic-wear-panjabi-kurta' },
      { name: 'Women', slug: 'fashion-women' },
      { name: 'Dresses Saree Salwar Kameez', slug: 'womens-dresses-saree-salwar-kameez' },
      { name: 'Hijab Abaya', slug: 'hijab-abaya' },
      { name: 'Kids & Baby Clothing', slug: 'kids-baby-clothing' },
      { name: 'Footwear Men Women Kids', slug: 'footwear-men-women-kids' },
      { name: 'Bags & Accessories', slug: 'bags-accessories' },
      { name: 'Jewelry & Watches', slug: 'jewelry-watches' },
    ],
  },
  {
    name: 'Electronics & Gadgets',
    slug: 'electronics-gadgets',
    color: '#4ECDC4',
    children: [
      { name: 'Mobile Phones', slug: 'mobile-phones' },
      { name: 'Laptops & Computers', slug: 'laptops-computers' },
      { name: 'Tablets', slug: 'tablets' },
      { name: 'Accessories Chargers Earphones', slug: 'electronics-accessories-chargers-earphones' },
      { name: 'Cameras & Photography', slug: 'cameras-photography' },
      { name: 'Smart Devices Smartwatch IoT', slug: 'smart-devices-smartwatch-iot' },
      { name: 'Gaming Console Accessories', slug: 'gaming-console-accessories' },
    ],
  },
  {
    name: 'Home Furniture & Living',
    slug: 'home-furniture-living',
    color: '#95E1D3',
    children: [
      { name: 'Furniture Sofa Bed Table', slug: 'furniture-sofa-bed-table' },
      { name: 'Home Decor Lighting Wall Art', slug: 'home-decor-lighting-wall-art' },
      { name: 'Kitchen & Dining', slug: 'kitchen-dining' },
      { name: 'Home Appliances Fridge AC Fan', slug: 'home-appliances-fridge-ac-fan' },
      { name: 'Storage & Organization', slug: 'storage-organization' },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    color: '#F38181',
    children: [
      { name: 'Skincare', slug: 'beauty-skincare' },
      { name: 'Haircare', slug: 'beauty-haircare' },
      { name: 'Makeup', slug: 'beauty-makeup' },
      { name: 'Fragrances', slug: 'beauty-fragrances' },
      { name: 'Grooming Men Women', slug: 'grooming-men-women' },
    ],
  },
  {
    name: 'Food Grocery & Beverages',
    slug: 'food-grocery-beverages',
    color: '#AA96DA',
    children: [
      { name: 'Fresh Food Fruits Vegetables', slug: 'fresh-food-fruits-vegetables' },
      { name: 'Packaged Food', slug: 'packaged-food' },
      { name: 'Snacks & Sweets', slug: 'snacks-sweets' },
      { name: 'Beverages Tea Coffee Juice', slug: 'beverages-tea-coffee-juice' },
      { name: 'Organic & Health Food', slug: 'organic-health-food' },
    ],
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    color: '#FCBAD3',
    children: [
      { name: 'Medicines OTC', slug: 'medicines-otc' },
      { name: 'Supplements & Vitamins', slug: 'supplements-vitamins' },
      { name: 'Medical Devices', slug: 'medical-devices' },
      { name: 'Fitness Nutrition', slug: 'fitness-nutrition' },
      { name: 'Personal Hygiene', slug: 'personal-hygiene' },
    ],
  },
  {
    name: 'Sports & Outdoor',
    slug: 'sports-outdoor',
    color: '#A8E6CF',
    children: [
      { name: 'Fitness Equipment', slug: 'sports-fitness-equipment' },
      { name: 'Outdoor Gear', slug: 'outdoor-gear' },
      { name: 'Cycling', slug: 'cycling' },
      { name: 'Team Sports', slug: 'team-sports' },
      { name: 'Camping & Hiking', slug: 'camping-hiking' },
    ],
  },
  {
    name: 'Toys Kids & Baby',
    slug: 'toys-kids-baby',
    color: '#FFD3B6',
    children: [
      { name: 'Toys & Games', slug: 'toys-games' },
      { name: 'Baby Care Diapers Feeding', slug: 'baby-care-diapers-feeding' },
      { name: 'School Supplies', slug: 'kids-school-supplies' },
      { name: 'Kids Furniture', slug: 'kids-furniture' },
    ],
  },
  {
    name: 'Automotive & Tools',
    slug: 'automotive-tools',
    color: '#FFAAA5',
    children: [
      { name: 'Car Accessories', slug: 'car-accessories' },
      { name: 'Motorbike Accessories', slug: 'motorbike-accessories' },
      { name: 'Tools & Equipment', slug: 'automotive-tools-equipment' },
      { name: 'Spare Parts', slug: 'spare-parts' },
    ],
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    color: '#FF8B94',
    children: [
      { name: 'Pet Food', slug: 'pet-food' },
      { name: 'Pet Toys', slug: 'pet-toys' },
      { name: 'Pet Grooming', slug: 'pet-grooming' },
      { name: 'Pet Accessories', slug: 'pet-accessories' },
    ],
  },
  {
    name: 'Books Media & Education',
    slug: 'books-media-education',
    color: '#B4A7D6',
    children: [
      { name: 'Books Academic Story Islamic', slug: 'books-academic-story-islamic' },
      { name: 'E-books', slug: 'ebooks' },
      { name: 'Stationery', slug: 'stationery' },
      { name: 'Educational Materials', slug: 'educational-materials' },
    ],
  },
  {
    name: 'Tools Hardware & Industrial',
    slug: 'tools-hardware-industrial',
    color: '#D5A6BD',
    children: [
      { name: 'Power Tools', slug: 'power-tools' },
      { name: 'Hand Tools', slug: 'hand-tools' },
      { name: 'Construction Materials', slug: 'construction-materials' },
      { name: 'Safety Equipment', slug: 'safety-equipment' },
    ],
  },
  {
    name: 'Office Business & Stationery',
    slug: 'office-business-stationery',
    color: '#A6C9D6',
    children: [
      { name: 'Office Supplies', slug: 'office-supplies' },
      { name: 'Printers & Accessories', slug: 'printers-accessories' },
      { name: 'Packaging Materials', slug: 'packaging-materials' },
      { name: 'Business Equipment', slug: 'business-equipment' },
    ],
  },
  {
    name: 'Travel Luggage & Lifestyle',
    slug: 'travel-luggage-lifestyle',
    color: '#F4D7B3',
    children: [
      { name: 'Bags & Luggage', slug: 'travel-bags-luggage' },
      { name: 'Travel Accessories', slug: 'travel-accessories' },
      { name: 'Lifestyle Products', slug: 'lifestyle-products' },
    ],
  },
  {
    name: 'Digital Products & Services',
    slug: 'digital-products-services',
    color: '#E8D7F1',
    children: [
      { name: 'Software', slug: 'software' },
      { name: 'Online Courses', slug: 'online-courses' },
      { name: 'Subscriptions', slug: 'subscriptions' },
      { name: 'Digital Downloads', slug: 'digital-downloads' },
    ],
  },
];

// Build canonical slug set
const canonicalSlugs = new Set(
  CATEGORY_TAXONOMY.flatMap((parent) => [
    parent.slug,
    ...parent.children.map((child) => child.slug),
  ])
);

// Generate image URLs using category mapping
const imageUrlMap = {
  'fashion-apparel': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=300&fit=crop',
  'electronics-gadgets': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'home-furniture-living': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  'beauty-personal-care': 'https://images.unsplash.com/photo-1631730486211-20fcfe4a52c2?w=400&h=300&fit=crop',
  'food-grocery-beverages': 'https://images.unsplash.com/photo-1488459716781-6918f33427d7?w=400&h=300&fit=crop',
  'health-wellness': 'https://images.unsplash.com/photo-1505751172876-fa1923c83cf6?w=400&h=300&fit=crop',
  'sports-outdoor': 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=400&h=300&fit=crop',
  'toys-kids-baby': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop',
  'automotive-tools': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  'pet-supplies': 'https://images.unsplash.com/photo-1587300411515-29dd45feb208?w=400&h=300&fit=crop',
  'books-media-education': 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop',
  'tools-hardware-industrial': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=300&fit=crop',
  'office-business-stationery': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
  'travel-luggage-lifestyle': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
  'digital-products-services': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
};

// Generate image URLs for child categories using parent's base URL
const generateImageUrl = (slug, type = 'parent') => {
  // Try direct mapping first
  if (imageUrlMap[slug]) {
    return imageUrlMap[slug];
  }

  // For child categories, use parent's image URL
  for (const parent of CATEGORY_TAXONOMY) {
    if (parent.children.find((c) => c.slug === slug)) {
      return imageUrlMap[parent.slug] || imageUrlMap['fashion-apparel'];
    }
  }

  // Default fallback
  return imageUrlMap['fashion-apparel'];
};

async function cleanup() {
  try {
    console.log('🧹 Starting database cleanup and enhancement...\n');

    // Step 1: Delete extraneous categories
    console.log('📊 Step 1: Identify and delete extraneous categories...');
    const allCategories = await prisma.category.findMany({
      select: { id: true, slug: true, name: true, parentId: true },
    });

    console.log(`   Total categories in DB: ${allCategories.length}`);

    const extraneousCategories = allCategories.filter((cat) => !canonicalSlugs.has(cat.slug));
    console.log(`   Extraneous categories to delete: ${extraneousCategories.length}`);

    if (extraneousCategories.length > 0) {
      // Get IDs of extraneous categories
      const extraneousIds = extraneousCategories.map((c) => c.id);

      // Move any products from extraneous categories to a default category (or mark them)
      console.log(`   Moving products from extraneous categories...`);
      const defaultCategory = await prisma.category.findFirst({
        where: { slug: 'electronics-gadgets' },
        select: { id: true },
      });

      if (defaultCategory) {
        const movedProducts = await prisma.product.updateMany({
          where: { categoryId: { in: extraneousIds } },
          data: { categoryId: defaultCategory.id },
        });
        console.log(`   ✓ Moved ${movedProducts.count} products to default category`);
      }

      // Delete the extraneous categories
      const deleted = await prisma.category.deleteMany({
        where: { id: { in: extraneousIds } },
      });
      console.log(`   ✓ Deleted ${deleted.count} extraneous categories\n`);
    } else {
      console.log(`   ✓ No extraneous categories to delete\n`);
    }

    // Step 2: Add/update images for all canonical categories
    console.log('🖼️  Step 2: Add images to canonical categories...');

    let imageUpdateCount = 0;

    for (const parentDoc of CATEGORY_TAXONOMY) {
      // Update parent category
      const parentImage = generateImageUrl(parentDoc.slug, 'parent');
      const updatedParent = await prisma.category.updateMany({
        where: { slug: parentDoc.slug },
        data: { image: parentImage },
      });
      imageUpdateCount += updatedParent.count;

      // Update child categories
      for (const childDoc of parentDoc.children) {
        const childImage = generateImageUrl(childDoc.slug, 'child');
        const updatedChild = await prisma.category.updateMany({
          where: { slug: childDoc.slug },
          data: { image: childImage },
        });
        imageUpdateCount += updatedChild.count;
      }
    }

    console.log(`   ✓ Updated images for ${imageUpdateCount} categories\n`);

    // Step 3: Verify product count and alignment
    console.log('📦 Step 3: Verify product count and category alignment...');

    const totalProducts = await prisma.product.count();
    console.log(`   Total products in DB: ${totalProducts}`);

    if (totalProducts < 25000) {
      console.log(
        `   ⚠️  Warning: Total products (${totalProducts}) is less than 25,000 target`
      );
      console.log(`   Note: You have ${30098 - totalProducts} valid products already`);
    } else {
      console.log(`   ✓ Product count (${totalProducts}) exceeds 25,000 target`);
    }

    // Check for orphaned products
    const orphanedProducts = await prisma.product.count({
      where: {
        category: {
          slug: { notIn: Array.from(canonicalSlugs) },
        },
      },
    });

    if (orphanedProducts > 0) {
      console.log(`   ⚠️  Found ${orphanedProducts} products in non-canonical categories`);
      console.log(`   Reassigning to default category...`);

      const defaultCategory = await prisma.category.findFirst({
        where: { slug: 'electronics-gadgets' },
        select: { id: true },
      });

      if (defaultCategory) {
        const reassigned = await prisma.product.updateMany({
          where: {
            category: {
              slug: { notIn: Array.from(canonicalSlugs) },
            },
          },
          data: { categoryId: defaultCategory.id },
        });
        console.log(`   ✓ Reassigned ${reassigned.count} products\n`);
      }
    } else {
      console.log(`   ✓ No orphaned products found\n`);
    }

    // Step 4: Generate final statistics
    console.log('📊 Final Statistics:');

    const finalStats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "Category") as total_categories,
        (SELECT COUNT(*) FROM "Category" WHERE "parentId" IS NULL) as parent_categories,
        (SELECT COUNT(*) FROM "Category" WHERE "parentId" IS NOT NULL) as child_categories,
        (SELECT COUNT(*) FROM "Product") as total_products,
        (SELECT COUNT(*) FROM "Category" WHERE "image" IS NULL OR "image" = '') as categories_without_images,
        (SELECT COUNT(*) FROM "Product" WHERE "specifications" IS NOT NULL) as products_with_specs
    `;

    const stats = finalStats[0];
    console.log(`   Total categories: ${stats.total_categories}`);
    console.log(`   Parent categories: ${stats.parent_categories}`);
    console.log(`   Child categories: ${stats.child_categories}`);
    console.log(`   Total products: ${stats.total_products}`);
    console.log(`   Categories without images: ${stats.categories_without_images}`);
    console.log(`   Products with specifications: ${stats.products_with_specs}\n`);

    console.log('✅ Cleanup and enhancement completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
