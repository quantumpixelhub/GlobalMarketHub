const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PER_CATEGORY = Math.max(5, Number(process.env.REAL_IMPORT_PER_CATEGORY || 40));
const DARAZ_PAGES = Math.max(1, Number(process.env.REAL_IMPORT_DARAZ_PAGES || 3));
const PRIORITY_PER_CATEGORY = Math.max(
  PER_CATEGORY,
  Number(process.env.PRIORITY_PER_CATEGORY || Math.max(PER_CATEGORY * 2, 60)),
);
const PRIORITY_CATEGORY_SLUGS = new Set(
  String(
    process.env.PRIORITY_CATEGORY_SLUGS ||
      'electronics-gadgets,fashion-apparel,beauty-personal-care,home-furniture-living,food-grocery-beverages'
  )
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
);

const CATEGORY_QUERY_MAP = {
  'fashion-apparel': ['mens tshirt', 'women dress', 'panjabi', 'sneakers'],
  'electronics-gadgets': ['smartphone', 'wireless earbuds', 'smart watch', 'laptop bag'],
  'home-furniture-living': ['home decor', 'bedsheet', 'kitchen organizer', 'sofa cover'],
  'beauty-personal-care': ['skin care', 'face wash', 'sunscreen', 'hair serum'],
  'food-grocery-beverages': ['coffee', 'green tea', 'snacks', 'honey'],
  'health-wellness': ['vitamin', 'protein powder', 'omega 3', 'bp machine'],
  'sports-outdoor': ['dumbbell', 'yoga mat', 'football', 'camping tent'],
  'toys-kids-baby': ['kids toy', 'baby diapers', 'lego', 'remote car'],
  'automotive-tools': ['car accessories', 'helmet', 'tool kit', 'car polish'],
  'pet-supplies': ['cat food', 'dog food', 'pet leash', 'pet shampoo'],
  'books-media-education': ['english book', 'islamic book', 'kids story book', 'notebook'],
  'tools-hardware-industrial': ['drill machine', 'hand tools', 'safety gloves', 'multimeter'],
  'office-business-stationery': ['office stationery', 'printer ink', 'stapler', 'file folder'],
  'travel-luggage-lifestyle': ['travel bag', 'luggage trolley', 'backpack', 'neck pillow'],
  'digital-products-services': ['headphone', 'usb flash drive', 'keyboard', 'gaming mouse'],
};

const TARGET_MAIN_CATEGORY_SLUGS = Object.keys(CATEGORY_QUERY_MAP);

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

async function fetchDarazOffers(query) {
  const offers = [];

  for (let page = 1; page <= DARAZ_PAGES; page += 1) {
    const url = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ''}&ajax=true`;
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      continue;
    }

    const payload = await response.json();
    const list = payload?.mods?.listItems || [];

    for (const item of list) {
      const title = String(item?.name || '').trim();
      const price = asNumber(item?.price, 0);
      const image = String(item?.image || '').trim();
      const itemUrl = String(item?.itemUrl || '').trim();

      if (!title || price <= 0 || !itemUrl) {
        continue;
      }

      offers.push({
        title,
        currentPrice: price,
        originalPrice: asNumber(item?.originalPrice, price) || price,
        image: image || null,
        url: itemUrl.startsWith('http') ? itemUrl : `https:${itemUrl}`,
        sellerName: String(item?.sellerName || 'Daraz Marketplace').trim(),
        rating: asNumber(item?.ratingScore, 0),
        reviewCount: Math.max(0, Math.round(asNumber(item?.review, 0))),
      });
    }
  }

  return offers;
}

async function ensureImportSeller() {
  const email = 'marketplace@globalmarkethub.com';

  return prisma.seller.upsert({
    where: { email },
    update: {
      storeName: 'Marketplace Aggregator',
      phone: '+8801700000000',
      description: 'Real products imported from marketplace sources for category coverage.',
      isVerified: true,
      isActive: true,
    },
    create: {
      storeName: 'Marketplace Aggregator',
      email,
      phone: '+8801700000000',
      description: 'Real products imported from marketplace sources for category coverage.',
      location: 'Bangladesh',
      isVerified: true,
      isActive: true,
      rating: 4.5,
      reviewCount: 120,
    },
  });
}

async function importForCategory(category, sellerId) {
  const queryList = CATEGORY_QUERY_MAP[category.slug] || [category.name];
  const targetCount = PRIORITY_CATEGORY_SLUGS.has(category.slug) ? PRIORITY_PER_CATEGORY : PER_CATEGORY;
  const offers = [];
  const seenUrls = new Set();

  for (const query of queryList) {
    if (offers.length >= targetCount) break;

    const queryOffers = await fetchDarazOffers(query);
    for (const offer of queryOffers) {
      if (offers.length >= targetCount) break;
      if (seenUrls.has(offer.url)) continue;
      seenUrls.add(offer.url);
      offers.push({ ...offer, importedCategoryQuery: query });
    }
  }

  let imported = 0;
  let scanned = 0;

  for (const offer of offers) {
    if (imported >= targetCount) break;
    scanned += 1;

    const idHash = hash(offer.url);
    const slugBase = slugify(`${offer.title}-${category.slug}`).slice(0, 70);
    const sku = `DAR-${idHash.toUpperCase()}`;

    await prisma.product.upsert({
      where: { sku },
      update: {
        title: offer.title,
        description: `${offer.title} (Imported live marketplace product for ${category.name}).`,
        originalPrice: offer.originalPrice > 0 ? offer.originalPrice : offer.currentPrice,
        currentPrice: offer.currentPrice,
        mainImage: offer.image || `https://picsum.photos/seed/${idHash}/800/800`,
        images: offer.image ? [offer.image] : [`https://picsum.photos/seed/${idHash}/800/800`],
        stock: 25,
        categoryId: category.id,
        sellerId,
        rating: offer.rating > 0 ? Number(offer.rating.toFixed(1)) : 4.1,
        reviewCount: offer.reviewCount > 0 ? offer.reviewCount : 10,
        specifications: {
          source: 'daraz',
          sourceUrl: offer.url,
          importedAt: new Date().toISOString(),
          importedCategoryQuery: offer.importedCategoryQuery,
          importedSellerName: offer.sellerName,
        },
        certifications: ['live-imported'],
        isActive: true,
      },
      create: {
        title: offer.title,
        slug: `${slugBase}-${idHash.slice(0, 6)}`,
        sku,
        description: `${offer.title} (Imported live marketplace product for ${category.name}).`,
        originalPrice: offer.originalPrice > 0 ? offer.originalPrice : offer.currentPrice,
        currentPrice: offer.currentPrice,
        mainImage: offer.image || `https://picsum.photos/seed/${idHash}/800/800`,
        images: offer.image ? [offer.image] : [`https://picsum.photos/seed/${idHash}/800/800`],
        stock: 25,
        lowStockThreshold: 5,
        categoryId: category.id,
        sellerId,
        rating: offer.rating > 0 ? Number(offer.rating.toFixed(1)) : 4.1,
        reviewCount: offer.reviewCount > 0 ? offer.reviewCount : 10,
        specifications: {
          source: 'daraz',
          sourceUrl: offer.url,
          importedAt: new Date().toISOString(),
          importedCategoryQuery: offer.importedCategoryQuery,
          importedSellerName: offer.sellerName,
        },
        certifications: ['live-imported'],
        isActive: true,
        isFeatured: false,
      },
    });

    imported += 1;
  }

  return { query: queryList.join(' | '), imported, scanned, targetCount };
}

async function main() {
  console.log(`Importing real category-wise products (target=${PER_CATEGORY} per category)...`);

  const mainCategories = await prisma.category.findMany({
    where: {
      parentId: null,
      slug: { in: TARGET_MAIN_CATEGORY_SLUGS },
    },
    orderBy: { name: 'asc' },
  });

  if (!mainCategories.length) {
    throw new Error('No main categories found. Run taxonomy sync first.');
  }

  const seller = await ensureImportSeller();
  const summary = [];

  for (const category of mainCategories) {
    const result = await importForCategory(category, seller.id);
    summary.push({ category: category.name, ...result });
    console.log(`- ${category.name}: imported ${result.imported}/${result.targetCount} (queries="${result.query}")`);
  }

  const counts = await prisma.category.findMany({
    where: { parentId: null },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\nFinal active product counts by main category:');
  for (const row of counts) {
    console.log(`  ${row.name}: ${row._count.products}`);
  }

  console.log('\nImport completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
