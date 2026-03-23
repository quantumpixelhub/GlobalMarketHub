const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive subcategory image mapping with relevant Unsplash URLs
const SUBCATEGORY_IMAGE_MAP = {
  // Fashion & Apparel
  'fashion-men': 'https://images.unsplash.com/photo-1552062407-c551eeda4bbb?w=400&h=300&fit=crop',
  'mens-shirts-tshirts-pants-jeans': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
  'mens-ethnic-wear-panjabi-kurta': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=300&fit=crop',
  'fashion-women': 'https://images.unsplash.com/photo-1595777707802-21485e46b5e7?w=400&h=300&fit=crop',
  'womens-dresses-saree-salwar-kameez': 'https://images.unsplash.com/photo-1564377287897-b60443773a40?w=400&h=300&fit=crop',
  'hijab-abaya': 'https://images.unsplash.com/photo-1537683087266-96f1938e7e34?w=400&h=300&fit=crop',
  'kids-baby-clothing': 'https://images.unsplash.com/photo-1577209840750-b8295b549298?w=400&h=300&fit=crop',
  'footwear-men-women-kids': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
  'bags-accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
  'jewelry-watches': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop',

  // Electronics & Gadgets
  'mobile-phones': 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=300&fit=crop',
  'laptops-computers': 'https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=400&h=300&fit=crop',
  'tablets': 'https://images.unsplash.com/photo-1517655595142-c3570caf3f7f?w=400&h=300&fit=crop',
  'electronics-accessories-chargers-earphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'cameras-photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
  'smart-devices-smartwatch-iot': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  'gaming-console-accessories': 'https://images.unsplash.com/photo-1606841837239-c5a1a8a07af7?w=400&h=300&fit=crop',

  // Home Furniture & Living
  'furniture-sofa-bed-table': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
  'home-decor-lighting-wall-art': 'https://images.unsplash.com/photo-1578926314433-c6e7ad7d3fa0?w=400&h=300&fit=crop',
  'kitchen-dining': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  'home-appliances-fridge-ac-fan': 'https://images.unsplash.com/photo-1584622642404-bf5ecd3c62cc?w=400&h=300&fit=crop',
  'storage-organization': 'https://images.unsplash.com/photo-1580128660010-fd0e9b7f5efd?w=400&h=300&fit=crop',

  // Beauty & Personal Care
  'beauty-skincare': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
  'beauty-haircare': 'https://images.unsplash.com/photo-1582736583143-7b1dd5ac457b?w=400&h=300&fit=crop',
  'beauty-makeup': 'https://images.unsplash.com/photo-1596462502278-af3a7b3b9e95?w=400&h=300&fit=crop',
  'beauty-fragrances': 'https://images.unsplash.com/photo-1541643600914-e0db3814a08e?w=400&h=300&fit=crop',
  'grooming-men-women': 'https://images.unsplash.com/photo-1608571423471-ce4f1abe1e56?w=400&h=300&fit=crop',

  // Food Grocery & Beverages
  'fresh-food-fruits-vegetables': 'https://images.unsplash.com/photo-1488459716781-6918f33427d7?w=400&h=300&fit=crop',
  'packaged-food': 'https://images.unsplash.com/photo-1585721694220-e8bed2dda83d?w=400&h=300&fit=crop',
  'snacks-sweets': 'https://images.unsplash.com/photo-1599599810694-d3fc2d3c5a92?w=400&h=300&fit=crop',
  'beverages-tea-coffee-juice': 'https://images.unsplash.com/photo-1559522594-55b3c7c3c6d5?w=400&h=300&fit=crop',
  'organic-health-food': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',

  // Health & Wellness
  'medicines-otc': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop',
  'supplements-vitamins': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
  'medical-devices': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
  'fitness-nutrition': 'https://images.unsplash.com/photo-1552693938-d5dabe6e601b?w=400&h=300&fit=crop',
  'personal-hygiene': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',

  // Sports & Outdoor
  'sports-fitness-equipment': 'https://images.unsplash.com/photo-1540497905023-fd28cdd1c10f?w=400&h=300&fit=crop',
  'outdoor-gear': 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
  'cycling': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd62?w=400&h=300&fit=crop',
  'team-sports': 'https://images.unsplash.com/photo-1535697899662-79a013bb70d5?w=400&h=300&fit=crop',
  'camping-hiking': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',

  // Toys Kids & Baby
  'toys-games': 'https://images.unsplash.com/photo-1549735328-b9d476fc6570?w=400&h=300&fit=crop',
  'baby-care-diapers-feeding': 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=300&fit=crop',
  'kids-school-supplies': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
  'kids-furniture': 'https://images.unsplash.com/photo-1565182999555-2dd29908e9e1?w=400&h=300&fit=crop',

  // Automotive & Tools
  'car-accessories': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  'motorbike-accessories': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd62?w=400&h=300&fit=crop',
  'automotive-tools-equipment': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=300&fit=crop',
  'spare-parts': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',

  // Pet Supplies
  'pet-food': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=300&fit=crop',
  'pet-toys': 'https://images.unsplash.com/photo-1565683566394-f71413a98f23?w=400&h=300&fit=crop',
  'pet-grooming': 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=300&fit=crop',
  'pet-accessories': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=300&fit=crop',

  // Books Media & Education
  'books-academic-story-islamic': 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop',
  'ebooks': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  'stationery': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop',
  'educational-materials': 'https://images.unsplash.com/photo-1427504494785-2a8ad8a30271?w=400&h=300&fit=crop',

  // Tools Hardware & Industrial
  'power-tools': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop',
  'hand-tools': 'https://images.unsplash.com/photo-1581092162562-40038f60d3ff?w=400&h=300&fit=crop',
  'construction-materials': 'https://images.unsplash.com/photo-1581092961191-8cf47f285e56?w=400&h=300&fit=crop',
  'safety-equipment': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',

  // Office Business & Stationery
  'office-supplies': 'https://images.unsplash.com/photo-1556228541-8f639a6f6912?w=400&h=300&fit=crop',
  'printers-accessories': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop',
  'packaging-materials': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
  'business-equipment': 'https://images.unsplash.com/photo-1554597527-cb4043b84d09?w=400&h=300&fit=crop',

  // Travel Luggage & Lifestyle
  'travel-bags-luggage': 'https://images.unsplash.com/photo-1488646953014-85cb44e25a20?w=400&h=300&fit=crop',
  'travel-accessories': 'https://images.unsplash.com/photo-1533996122239-c3aa937d4a85?w=400&h=300&fit=crop',
  'lifestyle-products': 'https://images.unsplash.com/photo-1541291026-7eec264c27ff?w=400&h=300&fit=crop',

  // Digital Products & Services
  'software': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
  'online-courses': 'https://images.unsplash.com/photo-1516534775068-bb6c4e971b91?w=400&h=300&fit=crop',
  'subscriptions': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
  'digital-downloads': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
};

async function updateSubcategoryImages() {
  try {
    console.log('🖼️  Updating subcategory images...\n');

    let updated = 0;
    let skipped = 0;

    for (const [slug, imageUrl] of Object.entries(SUBCATEGORY_IMAGE_MAP)) {
      const result = await prisma.category.updateMany({
        where: { slug },
        data: { image: imageUrl },
      });

      if (result.count > 0) {
        updated += result.count;
        console.log(`   ✓ ${slug.replace(/-/g, ' ')}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   Updated: ${updated} subcategories`);
    console.log(`   Not found: ${skipped} slugs`);

    // Verify all categories now have images
    const categoriesWithoutImages = await prisma.category.count({
      where: { image: { in: ['', null] } },
    });

    console.log(`   Categories without images: ${categoriesWithoutImages}`);

    if (categoriesWithoutImages === 0) {
      console.log(`\n✅ All categories now have relevant images!\n`);
    } else {
      console.log(`\n⚠️  ${categoriesWithoutImages} categories still missing images\n`);
    }
  } catch (error) {
    console.error('❌ Error updating images:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateSubcategoryImages();
