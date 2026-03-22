const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_PER_CATEGORY = Math.max(50, Number(process.env.TOP20_TARGET_PER_CATEGORY || 150));
const MAX_PAGES_PER_QUERY = Math.max(1, Number(process.env.TOP20_MAX_PAGES_PER_QUERY || 5));

const TOP_20_CATEGORIES = [
  { name: 'Smartphones', slug: 'smartphones', queries: ['smartphone', 'android phone', 'xiaomi mobile', 'samsung mobile'] },
  { name: 'Mobile Accessories', slug: 'mobile-accessories', queries: ['mobile charger', 'phone case', 'power bank', 'screen protector'] },
  { name: 'Laptops & Computers', slug: 'laptops-computers-top20', queries: ['laptop', 'gaming laptop', 'keyboard mouse', 'computer accessories'] },
  { name: 'Audio & Earbuds', slug: 'audio-earbuds', queries: ['wireless earbuds', 'headphone', 'bluetooth speaker', 'neckband'] },
  { name: 'Men Fashion', slug: 'men-fashion-top20', queries: ['mens tshirt', 'panjabi', 'mens jeans', 'mens shoes'] },
  { name: 'Women Fashion', slug: 'women-fashion-top20', queries: ['women dress', 'saree', 'salwar kameez', 'womens handbag'] },
  { name: 'Beauty & Skincare', slug: 'beauty-skincare-top20', queries: ['face wash', 'serum', 'sunscreen', 'night cream'] },
  { name: 'Makeup & Personal Care', slug: 'makeup-personal-care-top20', queries: ['lipstick', 'foundation', 'hair oil', 'body lotion'] },
  { name: 'Groceries', slug: 'groceries-top20', queries: ['soybean oil', 'rice', 'biscuits', 'instant noodles'] },
  { name: 'Beverages', slug: 'beverages-top20', queries: ['coffee', 'green tea', 'juice', 'energy drink'] },
  { name: 'Home Decor', slug: 'home-decor-top20', queries: ['wall decor', 'tissue box', 'bedsheet', 'curtain'] },
  { name: 'Kitchen Essentials', slug: 'kitchen-essentials-top20', queries: ['kitchen organizer', 'cookware set', 'water bottle', 'knife set'] },
  { name: 'Home Appliances', slug: 'home-appliances-top20', queries: ['blender', 'electric kettle', 'rice cooker', 'fan'] },
  { name: 'Baby & Kids', slug: 'baby-kids-top20', queries: ['baby diapers', 'baby dress', 'kids toy', 'baby feeding bottle'] },
  { name: 'Toys & Games', slug: 'toys-games-top20', queries: ['remote car', 'lego', 'educational toy', 'board game'] },
  { name: 'Health & Wellness', slug: 'health-wellness-top20', queries: ['vitamin', 'protein powder', 'bp machine', 'glucometer'] },
  { name: 'Sports & Outdoor', slug: 'sports-outdoor-top20', queries: ['dumbbell', 'yoga mat', 'football', 'camping tent'] },
  { name: 'Automotive & Tools', slug: 'automotive-tools-top20', queries: ['car accessories', 'bike helmet', 'tool kit', 'car polish'] },
  { name: 'Office & Stationery', slug: 'office-stationery-top20', queries: ['notebook', 'printer ink', 'office chair', 'stapler'] },
  { name: 'Travel & Luggage', slug: 'travel-luggage-top20', queries: ['travel bag', 'backpack', 'luggage trolley', 'neck pillow'] },
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const asNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hash = (value) => crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchDarazAjax(query, page) {
  const url = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ''}&ajax=true`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const list = payload?.mods?.listItems || [];

  return list
    .map((item) => {
      const title = String(item?.name || '').trim();
      const currentPrice = asNumber(item?.price, 0);
      const originalPrice = asNumber(item?.originalPrice, currentPrice) || currentPrice;
      const image = String(item?.image || '').trim();
      const itemUrl = String(item?.itemUrl || '').trim();
      const sellerName = String(item?.sellerName || 'Daraz Marketplace').trim();

      if (!title || currentPrice <= 0 || !itemUrl) return null;

      return {
        title,
        currentPrice,
        originalPrice,
        image: image || null,
        url: itemUrl.startsWith('http') ? itemUrl : `https:${itemUrl}`,
        sellerName,
        rating: asNumber(item?.ratingScore, 0),
        reviewCount: Math.max(0, Math.round(asNumber(item?.review, 0))),
      };
    })
    .filter(Boolean);
}

async function ensureImportSeller() {
  return prisma.seller.upsert({
    where: { email: 'marketplace@globalmarkethub.com' },
    update: {
      storeName: 'Marketplace Aggregator',
      phone: '+8801700000000',
      description: 'Real products imported from marketplace sources.',
      isVerified: true,
      isActive: true,
    },
    create: {
      storeName: 'Marketplace Aggregator',
      email: 'marketplace@globalmarkethub.com',
      phone: '+8801700000000',
      description: 'Real products imported from marketplace sources.',
      location: 'Bangladesh',
      isVerified: true,
      isActive: true,
      rating: 4.5,
      reviewCount: 120,
    },
  });
}

async function ensureTopCategories() {
  const created = [];

  for (const item of TOP_20_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: `Top internet-demand category: ${item.name}`,
        parentId: null,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: `Top internet-demand category: ${item.name}`,
        parentId: null,
      },
    });

    created.push({ ...item, id: category.id });
  }

  return created;
}

async function importForCategory(category, sellerId) {
  const uniqueByUrl = new Map();

  for (const query of category.queries) {
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page += 1) {
      if (uniqueByUrl.size >= TARGET_PER_CATEGORY) break;

      const offers = await fetchDarazAjax(query, page);
      for (const offer of offers) {
        if (uniqueByUrl.size >= TARGET_PER_CATEGORY) break;
        if (!uniqueByUrl.has(offer.url)) {
          uniqueByUrl.set(offer.url, { ...offer, importedQuery: query });
        }
      }

      await sleep(120);
    }

    if (uniqueByUrl.size >= TARGET_PER_CATEGORY) break;
  }

  let imported = 0;
  for (const offer of uniqueByUrl.values()) {
    const idHash = hash(offer.url);
    const sku = `TOP20-${category.slug.toUpperCase().slice(0, 12)}-${idHash}`;
    const uniqueSlug = `${category.slug}-${idHash}`;

    await prisma.product.upsert({
      where: { sku },
      update: {
        title: offer.title,
        description: `${offer.title} (Top20 imported product for ${category.name})`,
        originalPrice: offer.originalPrice > 0 ? offer.originalPrice : offer.currentPrice,
        currentPrice: offer.currentPrice,
        mainImage: offer.image || `https://picsum.photos/seed/${idHash}/800/800`,
        images: offer.image ? [offer.image] : [`https://picsum.photos/seed/${idHash}/800/800`],
        stock: 25,
        lowStockThreshold: 5,
        categoryId: category.id,
        sellerId,
        rating: offer.rating > 0 ? Number(offer.rating.toFixed(1)) : 4.2,
        reviewCount: offer.reviewCount > 0 ? offer.reviewCount : 10,
        specifications: {
          source: 'daraz',
          sourceUrl: offer.url,
          importedAt: new Date().toISOString(),
          importedCategory: category.slug,
          importedQuery: offer.importedQuery,
        },
        certifications: ['live-imported', 'top20-import'],
        isActive: true,
      },
      create: {
        title: offer.title,
        slug: uniqueSlug,
        sku,
        description: `${offer.title} (Top20 imported product for ${category.name})`,
        originalPrice: offer.originalPrice > 0 ? offer.originalPrice : offer.currentPrice,
        currentPrice: offer.currentPrice,
        mainImage: offer.image || `https://picsum.photos/seed/${idHash}/800/800`,
        images: offer.image ? [offer.image] : [`https://picsum.photos/seed/${idHash}/800/800`],
        stock: 25,
        lowStockThreshold: 5,
        categoryId: category.id,
        sellerId,
        rating: offer.rating > 0 ? Number(offer.rating.toFixed(1)) : 4.2,
        reviewCount: offer.reviewCount > 0 ? offer.reviewCount : 10,
        specifications: {
          source: 'daraz',
          sourceUrl: offer.url,
          importedAt: new Date().toISOString(),
          importedCategory: category.slug,
          importedQuery: offer.importedQuery,
        },
        certifications: ['live-imported', 'top20-import'],
        isActive: true,
        isFeatured: false,
      },
    });

    imported += 1;
  }

  return { imported, collected: uniqueByUrl.size };
}

async function main() {
  console.log(`Importing top 20 categories with target ${TARGET_PER_CATEGORY} products each...`);

  const seller = await ensureImportSeller();
  const categories = await ensureTopCategories();

  for (const category of categories) {
    const result = await importForCategory(category, seller.id);
    console.log(`- ${category.name}: imported=${result.imported}, collected=${result.collected}`);
  }

  console.log('Top20 import complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
