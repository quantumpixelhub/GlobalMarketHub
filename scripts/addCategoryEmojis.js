const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Category emoji mapping for visual appeal
const CATEGORY_EMOJIS = {
  'fashion-apparel': '👗',
  'fashion-men': '👔',
  'mens-shirts-tshirts-pants-jeans': '👕',
  'mens-ethnic-wear-panjabi-kurta': '🥻',
  'fashion-women': '👠',
  'womens-dresses-saree-salwar-kameez': '👗',
  'hijab-abaya': '🧕',
  'kids-baby-clothing': '👶',
  'footwear-men-women-kids': '👟',
  'bags-accessories': '👜',
  'jewelry-watches': '💎',
  
  'electronics-gadgets': '📱',
  'mobile-phones': '📱',
  'laptops-computers': '💻',
  'tablets': '📱',
  'electronics-accessories-chargers-earphones': '🎧',
  'cameras-photography': '📷',
  'smart-devices-smartwatch-iot': '⌚',
  'gaming-console-accessories': '🎮',
  
  'home-furniture-living': '🏠',
  'furniture-sofa-bed-table': '🛋️',
  'home-decor-lighting-wall-art': '🎨',
  'kitchen-dining': '🍽️',
  'home-appliances-fridge-ac-fan': '❄️',
  'storage-organization': '📦',
  
  'beauty-personal-care': '💄',
  'beauty-skincare': '🧴',
  'beauty-haircare': '💆',
  'beauty-makeup': '💄',
  'beauty-fragrances': '🌹',
  'grooming-men-women': '🪮',
  
  'food-grocery-beverages': '🍕',
  'fresh-food-fruits-vegetables': '🥬',
  'packaged-food': '🍞',
  'snacks-sweets': '🍰',
  'beverages-tea-coffee-juice': '☕',
  'organic-health-food': '🥗',
  
  'health-wellness': '💊',
  'medicines-otc': '💊',
  'supplements-vitamins': '💪',
  'medical-devices': '🩺',
  'fitness-nutrition': '🏋️',
  'personal-hygiene': '🧼',
  
  'sports-outdoor': '⚽',
  'sports-fitness-equipment': '🏃',
  'outdoor-gear': '⛺',
  'cycling': '🚴',
  'team-sports': '⚽',
  'camping-hiking': '⛰️',
  
  'toys-kids-baby': '🧸',
  'toys-games': '🎲',
  'baby-care-diapers-feeding': '🍼',
  'kids-school-supplies': '📚',
  'kids-furniture': '🪑',
  
  'automotive-tools': '🚗',
  'car-accessories': '🚗',
  'motorbike-accessories': '🏍️',
  'automotive-tools-equipment': '🔧',
  'spare-parts': '⚙️',
  
  'pet-supplies': '🐾',
  'pet-food': '🦴',
  'pet-toys': '🎾',
  'pet-grooming': '🧴',
  'pet-accessories': '🐕',
  
  'books-media-education': '📚',
  'books-academic-story-islamic': '📖',
  'ebooks': '📱',
  'stationery': '✏️',
  'educational-materials': '📚',
  
  'tools-hardware-industrial': '🔨',
  'power-tools': '⚡',
  'hand-tools': '🔨',
  'construction-materials': '🏗️',
  'safety-equipment': '🦺',
  
  'office-business-stationery': '📋',
  'office-supplies': '📎',
  'printers-accessories': '🖨️',
  'packaging-materials': '📦',
  'business-equipment': '💼',
  
  'travel-luggage-lifestyle': '✈️',
  'travel-bags-luggage': '🧳',
  'travel-accessories': '🎒',
  'lifestyle-products': '⌚',
  
  'digital-products-services': '💻',
  'software': '💾',
  'online-courses': '🎓',
  'subscriptions': '📺',
  'digital-downloads': '📥',
};

async function addCategoryEmojis() {
  try {
    console.log('🎨 Adding emoji icons to categories...\n');

    let updated = 0;

    for (const [slug, emoji] of Object.entries(CATEGORY_EMOJIS)) {
      const result = await prisma.category.updateMany({
        where: { slug },
        data: { 
          icon: emoji
        },
      });

      if (result.count > 0) {
        updated += result.count;
        console.log(`   ✓ ${slug} → ${emoji}`);
      }
    }

    console.log(`\n✅ Updated ${updated} categories with emoji icons!\n`);

    // Verify
    const total = await prisma.category.count();
    console.log(`📊 Total categories: ${total}`);

  } catch (error) {
    console.error('❌ Error adding emojis:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCategoryEmojis();
