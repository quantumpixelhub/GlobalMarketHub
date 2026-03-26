const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'onto', 'this', 'that', 'these', 'those',
  'of', 'to', 'in', 'on', 'a', 'an', 'by', 'or', 'is', 'are', 'at', 'as', 'be',
  'product', 'products', 'category', 'categories',
]);

const FAMILY_DEFINITIONS = {
  electronics: {
    code: 'ELC',
    keywords: ['electronic', 'electronics', 'gadget', 'phone', 'mobile', 'laptop', 'computer', 'camera', 'audio', 'headphone'],
    brands: ['NovaTech', 'Voltix', 'Auron', 'PixelCore', 'Nexora'],
    descriptors: ['Smart', 'Ultra', 'Pro', 'Wireless', 'Advanced'],
    nouns: ['Headset', 'Smart Watch', 'Bluetooth Speaker', 'Webcam', 'Power Bank', 'Keyboard', 'Mouse'],
    features: ['Bluetooth 5.3', 'Fast charging', 'Low-latency mode', 'Durable shell'],
    priceMin: 1200,
    priceMax: 45000,
  },
  fashion: {
    code: 'FSH',
    keywords: ['fashion', 'apparel', 'clothing', 'dress', 'shirt', 'pant', 'saree', 'panjabi', 'shoe', 'wear'],
    brands: ['StyleRoot', 'UrbanThread', 'ModaLeaf', 'LoomCraft', 'TrendVista'],
    descriptors: ['Classic', 'Modern', 'Slim Fit', 'Comfort', 'Premium'],
    nouns: ['T-Shirt', 'Casual Shirt', 'Denim Pant', 'Kurti', 'Panjabi', 'Sneakers', 'Sandals'],
    features: ['Breathable fabric', 'Easy wash care', 'Comfort fit', 'All-season use'],
    priceMin: 450,
    priceMax: 12000,
  },
  beauty: {
    code: 'BEA',
    keywords: ['beauty', 'personal', 'care', 'skin', 'hair', 'cosmetic', 'makeup', 'face'],
    brands: ['GlowNest', 'PureVita', 'SilkBloom', 'DermaLane', 'FreshAura'],
    descriptors: ['Hydrating', 'Nourishing', 'Daily', 'Revitalizing', 'Sensitive Skin'],
    nouns: ['Face Wash', 'Sunscreen', 'Hair Serum', 'Body Lotion', 'Lip Tint', 'Night Cream'],
    features: ['Paraben-free', 'Dermatologically tested', 'Quick absorption', 'Mild fragrance'],
    priceMin: 280,
    priceMax: 6500,
  },
  home: {
    code: 'HOM',
    keywords: ['home', 'furniture', 'living', 'kitchen', 'decor', 'household', 'bed', 'storage'],
    brands: ['HomeMitra', 'Nestora', 'CraftHaven', 'RoomWise', 'LivingArc'],
    descriptors: ['Space Saving', 'Multipurpose', 'Premium', 'Elegant', 'Heavy Duty'],
    nouns: ['Storage Rack', 'Bedsheet Set', 'Wall Shelf', 'Kitchen Organizer', 'Table Lamp', 'Floor Mat'],
    features: ['Rust-resistant', 'Easy assembly', 'Compact design', 'Long-lasting finish'],
    priceMin: 550,
    priceMax: 22000,
  },
  grocery: {
    code: 'GRC',
    keywords: ['food', 'grocery', 'beverage', 'snack', 'tea', 'coffee', 'organic', 'drink'],
    brands: ['FreshMile', 'DailyHarvest', 'NutriBay', 'GrainJoy', 'Brewora'],
    descriptors: ['Organic', 'Premium', 'Fresh', 'Family Pack', 'Natural'],
    nouns: ['Green Tea', 'Ground Coffee', 'Mixed Nuts', 'Honey Jar', 'Healthy Snack Box'],
    features: ['Hygienic packaging', 'Quality tested', 'Long shelf life', 'Locally sourced'],
    priceMin: 180,
    priceMax: 4500,
  },
  health: {
    code: 'HLT',
    keywords: ['health', 'wellness', 'fitness', 'vitamin', 'supplement', 'care'],
    brands: ['WellSpring', 'VitaForge', 'ActiveCore', 'HealthNest', 'PureLift'],
    descriptors: ['Daily', 'High Potency', 'Balanced', 'Complete', 'Advanced'],
    nouns: ['Multivitamin', 'Protein Blend', 'Omega Capsule', 'Electrolyte Powder', 'Wellness Pack'],
    features: ['Lab tested', 'Easy-to-use serving', 'High purity', 'Trusted formula'],
    priceMin: 350,
    priceMax: 9000,
  },
  sports: {
    code: 'SPT',
    keywords: ['sports', 'outdoor', 'gym', 'exercise', 'fitness', 'training', 'camping'],
    brands: ['FitRidge', 'Trailon', 'Athletix', 'SportCraft', 'MovePeak'],
    descriptors: ['Professional', 'Lightweight', 'Durable', 'All-weather', 'Training'],
    nouns: ['Yoga Mat', 'Resistance Band', 'Training Gloves', 'Football', 'Camping Stool'],
    features: ['Sweat resistant', 'High grip', 'Portable design', 'Reinforced stitching'],
    priceMin: 300,
    priceMax: 18000,
  },
  toys: {
    code: 'TOY',
    keywords: ['toy', 'kids', 'baby', 'child', 'infant', 'play'],
    brands: ['KidMerry', 'PlayNova', 'TinyBloom', 'BabyTrail', 'FunNest'],
    descriptors: ['Educational', 'Safe', 'Interactive', 'Creative', 'Soft Touch'],
    nouns: ['Building Blocks', 'Activity Set', 'Toy Car', 'Learning Board', 'Plush Doll'],
    features: ['Child-safe material', 'Bright colors', 'Skill development', 'Rounded edges'],
    priceMin: 220,
    priceMax: 8000,
  },
  automotive: {
    code: 'AUT',
    keywords: ['auto', 'automotive', 'car', 'bike', 'motor', 'tool', 'garage'],
    brands: ['DriveMate', 'MotoCore', 'RoadAxis', 'TorqueX', 'GearHub'],
    descriptors: ['Heavy Duty', 'Professional', 'Universal', 'Premium', 'Compact'],
    nouns: ['Car Charger', 'Helmet', 'Tool Kit', 'Seat Cover', 'Cleaning Brush Set'],
    features: ['Heat resistant', 'Universal compatibility', 'Shock resistant', 'Reliable build'],
    priceMin: 250,
    priceMax: 16000,
  },
  pet: {
    code: 'PET',
    keywords: ['pet', 'dog', 'cat', 'animal', 'leash', 'litter', 'feed'],
    brands: ['PawNest', 'PetHaven', 'TailJoy', 'FurMitra', 'WhiskerLife'],
    descriptors: ['Nutritious', 'Comfort', 'Premium', 'Daily', 'Hygienic'],
    nouns: ['Pet Food Pack', 'Pet Shampoo', 'Leash Set', 'Litter Sand', 'Pet Bed'],
    features: ['Vet approved', 'Easy digestion', 'Odor control', 'Comfortable texture'],
    priceMin: 240,
    priceMax: 7000,
  },
  books: {
    code: 'BOK',
    keywords: ['book', 'media', 'education', 'study', 'learning', 'notebook'],
    brands: ['EduLeaf', 'ReadVista', 'PageCraft', 'LearnBridge', 'WriteHub'],
    descriptors: ['Comprehensive', 'Beginner', 'Advanced', 'Illustrated', 'Practice'],
    nouns: ['Study Guide', 'Workbook', 'Story Book', 'Practice Set', 'Reference Book'],
    features: ['Clear explanations', 'Updated syllabus', 'High-quality print', 'Structured chapters'],
    priceMin: 180,
    priceMax: 5000,
  },
  office: {
    code: 'OFF',
    keywords: ['office', 'business', 'stationery', 'work', 'printer', 'desk'],
    brands: ['OfficeMate', 'DeskFlow', 'PaperGrid', 'WorkEase', 'StationPro'],
    descriptors: ['Professional', 'Compact', 'Executive', 'Durable', 'Daily Use'],
    nouns: ['Notebook Set', 'Desk Organizer', 'Pen Pack', 'File Folder', 'Marker Set'],
    features: ['Smudge resistant', 'Durable material', 'Neat finish', 'Office-ready'],
    priceMin: 120,
    priceMax: 6500,
  },
  travel: {
    code: 'TRV',
    keywords: ['travel', 'luggage', 'bag', 'trip', 'tour', 'backpack'],
    brands: ['TrailPack', 'Voyago', 'MoveLite', 'TransitPro', 'UrbanVoyage'],
    descriptors: ['Cabin Size', 'Lightweight', 'Expandable', 'Waterproof', 'Premium'],
    nouns: ['Backpack', 'Travel Bag', 'Luggage Trolley', 'Packing Cube Set', 'Neck Pillow'],
    features: ['Tear resistant', 'Smooth zipper', 'Travel-friendly', 'Secure compartments'],
    priceMin: 500,
    priceMax: 20000,
  },
  tools: {
    code: 'TLS',
    keywords: ['tools', 'hardware', 'industrial', 'repair', 'machine', 'safety'],
    brands: ['ToolForge', 'IronEdge', 'BuildCore', 'FixMaster', 'ProWrench'],
    descriptors: ['Industrial', 'Precision', 'Heavy Duty', 'Professional', 'Compact'],
    nouns: ['Hand Tool Set', 'Screwdriver Kit', 'Safety Gloves', 'Multimeter', 'Work Lamp'],
    features: ['Impact resistant', 'Ergonomic grip', 'Reliable accuracy', 'Workshop-ready'],
    priceMin: 300,
    priceMax: 25000,
  },
  digital: {
    code: 'DGT',
    keywords: ['digital', 'software', 'service', 'subscription', 'online', 'license'],
    brands: ['CloudAxis', 'ByteNest', 'SecureSoft', 'StreamLine', 'AppForge'],
    descriptors: ['Premium', 'Secure', 'Instant', 'Business', 'Professional'],
    nouns: ['Software License', 'Cloud Storage Plan', 'Security Suite', 'Design Toolkit'],
    features: ['Instant activation', 'Secure access', '24/7 support', 'Regular updates'],
    priceMin: 250,
    priceMax: 30000,
  },
  generic: {
    code: 'GEN',
    keywords: ['general', 'daily', 'essentials'],
    brands: ['PrimeNest', 'ValueArc', 'EverydayCo', 'CoreMart', 'TrustLeaf'],
    descriptors: ['Essential', 'Premium', 'Daily', 'Smart', 'Reliable'],
    nouns: ['Essentials Pack', 'Daily Utility Item', 'Premium Utility Set'],
    features: ['Quality checked', 'Value for money', 'Everyday usability', 'Reliable performance'],
    priceMin: 200,
    priceMax: 10000,
  },
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {
    target: Number(process.env.TARGET_PRODUCTS_PER_CATEGORY || 500),
    minTotalActive: Number(process.env.MIN_TOTAL_ACTIVE_PRODUCTS || 40001),
    scope: (process.env.CATEGORY_SCOPE || 'leaf').toLowerCase(),
    batch: Number(process.env.EXPANSION_BATCH_SIZE || 200),
    maxCreate: Number(process.env.MAX_SYNTHETIC_CREATE || 50000),
    minRelevanceScore: Number(process.env.MIN_RELEVANCE_SCORE || 0.12),
    apply: process.env.APPLY_EXPANSION === 'true',
    auditOnly: process.env.AUDIT_ONLY === 'true',
  };

  for (const token of argv) {
    if (token === '--apply') args.apply = true;
    if (token === '--audit-only') args.auditOnly = true;
    if (token.startsWith('--target=')) args.target = Number(token.split('=')[1]);
    if (token.startsWith('--scope=')) args.scope = String(token.split('=')[1] || '').toLowerCase();
    if (token.startsWith('--batch=')) args.batch = Number(token.split('=')[1]);
    if (token.startsWith('--max-create=')) args.maxCreate = Number(token.split('=')[1]);
    if (token.startsWith('--min-score=')) args.minRelevanceScore = Number(token.split('=')[1]);
    if (token.startsWith('--min-total=')) args.minTotalActive = Number(token.split('=')[1]);
  }

  args.target = Number.isFinite(args.target) && args.target > 0 ? Math.floor(args.target) : 500;
  args.minTotalActive = Number.isFinite(args.minTotalActive) && args.minTotalActive > 0
    ? Math.floor(args.minTotalActive)
    : 40001;
  args.batch = Number.isFinite(args.batch) && args.batch > 0 ? Math.floor(args.batch) : 200;
  args.maxCreate = Number.isFinite(args.maxCreate) && args.maxCreate > 0 ? Math.floor(args.maxCreate) : 50000;
  args.minRelevanceScore = Number.isFinite(args.minRelevanceScore) ? args.minRelevanceScore : 0.12;

  if (!['leaf', 'main', 'all'].includes(args.scope)) {
    args.scope = 'leaf';
  }

  return args;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function digest(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex');
}

function pseudo(seedNumber) {
  const x = Math.sin(seedNumber) * 10000;
  return x - Math.floor(x);
}

function pick(array, seedNumber) {
  if (!Array.isArray(array) || array.length === 0) return '';
  return array[Math.abs(seedNumber) % array.length];
}

function toTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function inferFamily(category) {
  const combined = `${category.slug || ''} ${category.name || ''} ${category.parent?.slug || ''} ${category.parent?.name || ''}`.toLowerCase();
  let best = 'generic';
  let bestScore = 0;

  for (const [family, config] of Object.entries(FAMILY_DEFINITIONS)) {
    if (family === 'generic') continue;
    const score = config.keywords.reduce((acc, keyword) => (combined.includes(keyword) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = family;
    }
  }

  return best;
}

function buildCategoryKeywords(category, familyKey) {
  const baseTokens = new Set([
    ...toTokens(category.name),
    ...toTokens(category.slug),
    ...toTokens(category.parent?.name || ''),
    ...toTokens(category.parent?.slug || ''),
  ]);

  const family = FAMILY_DEFINITIONS[familyKey] || FAMILY_DEFINITIONS.generic;
  family.keywords.slice(0, 10).forEach((keyword) => {
    toTokens(keyword).forEach((token) => baseTokens.add(token));
  });

  return Array.from(baseTokens).slice(0, 16);
}

function scoreRelevance(product, keywords) {
  if (!keywords.length) return { score: 0, matched: [] };

  const specsText = product.specifications ? JSON.stringify(product.specifications) : '';
  const corpus = `${product.title || ''} ${product.description || ''} ${specsText}`.toLowerCase();

  const matched = keywords.filter((keyword) => corpus.includes(keyword));
  const denominator = Math.max(1, Math.min(8, keywords.length));
  const score = matched.length / denominator;

  return {
    score: Number(score.toFixed(6)),
    matched,
  };
}

async function ensureSyntheticSeller(familyKey, ordinal) {
  const family = FAMILY_DEFINITIONS[familyKey] || FAMILY_DEFINITIONS.generic;
  const email = `synthetic.${familyKey}@globalmarkethub.com`;
  const phone = `+88017${String(10000000 + ordinal).slice(-8)}`;

  return prisma.seller.upsert({
    where: { email },
    update: {
      storeName: `${familyKey.toUpperCase()} Synthetic Store`,
      phone,
      description: `Synthetic catalog expansion seller for ${familyKey} category family.`,
      isVerified: true,
      isActive: true,
      rating: 4.4,
      reviewCount: 350,
    },
    create: {
      storeName: `${familyKey.toUpperCase()} Synthetic Store`,
      email,
      phone,
      description: `Synthetic catalog expansion seller for ${familyKey} category family.`,
      location: 'Bangladesh',
      isVerified: true,
      isActive: true,
      rating: 4.4,
      reviewCount: 350,
    },
  });
}

function resolvePriorityTier(index, total) {
  if (total <= 0) return 'gradual';
  const ratio = index / total;
  if (ratio < 0.2) return 'positive_review';
  if (ratio < 0.4) return 'most_sold';
  if (ratio < 0.6) return 'most_trendy';
  return 'gradual';
}

function getTierProfile(priorityTier) {
  switch (priorityTier) {
    case 'positive_review':
      return {
        ratingMin: 4.75,
        ratingMax: 5,
        reviewMin: 700,
        reviewMax: 3000,
        soldMin: 400,
        soldMax: 2200,
        stockMin: 120,
        stockMax: 420,
        featuredChance: 0.95,
        ageMinutesMin: 0,
        ageMinutesMax: 30,
      };
    case 'most_sold':
      return {
        ratingMin: 4.5,
        ratingMax: 4.92,
        reviewMin: 400,
        reviewMax: 2200,
        soldMin: 700,
        soldMax: 5000,
        stockMin: 180,
        stockMax: 700,
        featuredChance: 0.9,
        ageMinutesMin: 30,
        ageMinutesMax: 120,
      };
    case 'most_trendy':
      return {
        ratingMin: 4.3,
        ratingMax: 4.85,
        reviewMin: 180,
        reviewMax: 1200,
        soldMin: 250,
        soldMax: 1600,
        stockMin: 90,
        stockMax: 360,
        featuredChance: 0.85,
        ageMinutesMin: 120,
        ageMinutesMax: 480,
      };
    default:
      return {
        ratingMin: 3.8,
        ratingMax: 4.65,
        reviewMin: 12,
        reviewMax: 520,
        soldMin: 10,
        soldMax: 420,
        stockMin: 30,
        stockMax: 240,
        featuredChance: 0.08,
        ageMinutesMin: 480,
        ageMinutesMax: 24000,
      };
  }
}

function generateSyntheticProduct({ category, familyKey, sellerId, offset, priorityTier, priorityOrder }) {
  const family = FAMILY_DEFINITIONS[familyKey] || FAMILY_DEFINITIONS.generic;
  const seed = Number.parseInt(digest(`${category.id}-${offset}`).slice(0, 10), 16);
  const tierProfile = getTierProfile(priorityTier);

  const brand = pick(family.brands, seed);
  const descriptor = pick(family.descriptors, seed + 17);
  const noun = pick(family.nouns, seed + 29);
  const featureA = pick(family.features, seed + 37);
  const featureB = pick(family.features, seed + 53);
  const variantCode = digest(`${category.slug}-${offset}-${Date.now()}`).slice(0, 6).toUpperCase();

  const title = `${brand} ${descriptor} ${noun} for ${category.name} ${variantCode}`;
  const slugBase = slugify(`${title}-${category.slug}`).slice(0, 90);
  const uniqueHash = digest(`${title}-${offset}-${Date.now()}`).slice(0, 10);

  const priceSpread = Math.max(1, family.priceMax - family.priceMin);
  const priceRaw = family.priceMin + Math.floor(pseudo(seed + 71) * priceSpread);
  const currentPrice = Math.max(80, Math.round(priceRaw / 10) * 10);
  const originalPrice = Math.max(currentPrice + 10, Math.round(currentPrice * (1.12 + pseudo(seed + 83) * 0.28)));
  const stock = tierProfile.stockMin + Math.floor(pseudo(seed + 97) * Math.max(1, tierProfile.stockMax - tierProfile.stockMin));

  const rating = Number((tierProfile.ratingMin + pseudo(seed + 131) * Math.max(0.01, tierProfile.ratingMax - tierProfile.ratingMin)).toFixed(2));
  const reviewCount = tierProfile.reviewMin + Math.floor(pseudo(seed + 149) * Math.max(1, tierProfile.reviewMax - tierProfile.reviewMin));
  const soldProxy = tierProfile.soldMin + Math.floor(pseudo(seed + 163) * Math.max(1, tierProfile.soldMax - tierProfile.soldMin));
  const trendMomentum = Number((0.55 + pseudo(seed + 173) * 0.45).toFixed(4));
  const isFeatured = pseudo(seed + 181) < tierProfile.featuredChance;

  const ageMinutes = tierProfile.ageMinutesMin + Math.floor(pseudo(seed + 191) * Math.max(1, tierProfile.ageMinutesMax - tierProfile.ageMinutesMin));
  const createdAt = new Date(Date.now() - ageMinutes * 60 * 1000);

  const imageSeed = `${category.slug || 'category'}-${uniqueHash}`;
  const imageUrl = `https://picsum.photos/seed/${imageSeed}/800/800`;

  return {
    title,
    slug: `${slugBase}-${uniqueHash.slice(0, 6)}`,
    sku: `SYN-${family.code}-${uniqueHash.toUpperCase()}`,
    description: `${title}. Designed for ${category.name} shoppers with ${featureA.toLowerCase()} and ${featureB.toLowerCase()}. This is synthetic catalog data generated for recommendation and ranking coverage tests.`,
    originalPrice,
    currentPrice,
    mainImage: imageUrl,
    images: [imageUrl],
    stock,
    lowStockThreshold: 10,
    categoryId: category.id,
    sellerId,
    rating,
    reviewCount,
    specifications: {
      source: 'synthetic-phase6',
      generatedAt: new Date().toISOString(),
      family: familyKey,
      categoryName: category.name,
      priorityTier,
      priorityOrder,
      syntheticSoldProxy: soldProxy,
      syntheticTrendMomentum: trendMomentum,
      keyFeatureA: featureA,
      keyFeatureB: featureB,
      targetUse: category.name,
    },
    certifications: ['synthetic-generated', `synthetic-${familyKey}`, `priority-${priorityTier}`],
    isActive: true,
    isFeatured,
    createdAt,
  };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function buildCreatePlan({ selectedCategories, activeCountByCategory, args, totalActiveBefore }) {
  const planByCategory = new Map();
  let remainingBudget = args.maxCreate;
  let basePlannedCreates = 0;

  for (const category of selectedCategories) {
    const currentCount = activeCountByCategory.get(category.id) || 0;
    const deficit = Math.max(0, args.target - currentCount);
    const planned = Math.min(deficit, remainingBudget);
    planByCategory.set(category.id, planned);
    basePlannedCreates += planned;
    remainingBudget -= planned;
  }

  for (const category of selectedCategories) {
    if (!planByCategory.has(category.id)) {
      planByCategory.set(category.id, 0);
    }
  }

  let projectedTotalAfterPlan = totalActiveBefore + basePlannedCreates;
  let extraCreatesForMinimumTotal = 0;

  if (remainingBudget > 0 && projectedTotalAfterPlan < args.minTotalActive) {
    let needed = args.minTotalActive - projectedTotalAfterPlan;
    const rotation = selectedCategories
      .slice()
      .sort((a, b) => (activeCountByCategory.get(a.id) || 0) - (activeCountByCategory.get(b.id) || 0));

    let cursor = 0;
    while (needed > 0 && remainingBudget > 0 && rotation.length > 0) {
      const targetCategory = rotation[cursor % rotation.length];
      planByCategory.set(targetCategory.id, (planByCategory.get(targetCategory.id) || 0) + 1);
      needed -= 1;
      remainingBudget -= 1;
      extraCreatesForMinimumTotal += 1;
      cursor += 1;
    }

    projectedTotalAfterPlan = totalActiveBefore + basePlannedCreates + extraCreatesForMinimumTotal;
  }

  return {
    planByCategory,
    basePlannedCreates,
    extraCreatesForMinimumTotal,
    totalPlannedCreates: basePlannedCreates + extraCreatesForMinimumTotal,
    projectedTotalAfterPlan,
    exhaustedBudget: remainingBudget <= 0,
  };
}

async function main() {
  const args = parseArgs();

  console.log('Phase 6: Category relevance audit + synthetic expansion');
  console.log(`- target per category: ${args.target}`);
  console.log(`- minimum total active products: ${args.minTotalActive}`);
  console.log(`- scope: ${args.scope}`);
  console.log(`- apply expansion: ${args.apply}`);
  console.log(`- audit only: ${args.auditOnly}`);

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          children: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const selectedCategories = categories.filter((category) => {
    if (args.scope === 'all') return true;
    if (args.scope === 'main') return !category.parentId;
    return category._count.children === 0;
  });

  if (selectedCategories.length === 0) {
    throw new Error('No categories selected for the configured scope.');
  }

  const activeCountsRows = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { isActive: true },
    _count: { _all: true },
  });

  const activeCountByCategory = new Map(activeCountsRows.map((row) => [row.categoryId, row._count._all]));
  const totalActiveBefore = activeCountsRows.reduce((sum, row) => sum + row._count._all, 0);
  const createPlan = buildCreatePlan({
    selectedCategories,
    activeCountByCategory,
    args,
    totalActiveBefore,
  });

  console.log(`- active products before run: ${totalActiveBefore}`);
  console.log(`- planned creates to reach targets: ${createPlan.basePlannedCreates}`);
  console.log(`- extra creates for minimum total: ${createPlan.extraCreatesForMinimumTotal}`);
  console.log(`- total planned creates: ${createPlan.totalPlannedCreates}`);
  console.log(`- projected active products after plan: ${createPlan.projectedTotalAfterPlan}`);

  if (createPlan.exhaustedBudget && createPlan.projectedTotalAfterPlan < args.minTotalActive) {
    console.warn('WARNING: max-create budget may be too low to satisfy minimum total active products.');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    config: args,
    totals: {
      selectedCategories: selectedCategories.length,
      totalActiveBefore,
      minimumTotalRequired: args.minTotalActive,
      projectedTotalAfterPlan: createPlan.projectedTotalAfterPlan,
      auditedProducts: 0,
      suspiciousProducts: 0,
      plannedCreates: 0,
      extraCreatesForMinimumTotal: createPlan.extraCreatesForMinimumTotal,
      createdProducts: 0,
      remainingDeficitAfterRun: 0,
      createdByTier: {
        positive_review: 0,
        most_sold: 0,
        most_trendy: 0,
        gradual: 0,
      },
    },
    categories: [],
    suspiciousSamples: [],
  };

  const sellerCache = new Map();

  for (let idx = 0; idx < selectedCategories.length; idx += 1) {
    const category = selectedCategories[idx];
    const familyKey = inferFamily(category);
    const keywords = buildCategoryKeywords(category, familyKey);

    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        specifications: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const relevanceScores = products.map((product) => {
      const { score, matched } = scoreRelevance(product, keywords);
      return {
        productId: product.id,
        title: product.title,
        score,
        matched,
      };
    });

    const suspicious = relevanceScores
      .filter((entry) => entry.score < args.minRelevanceScore)
      .sort((a, b) => a.score - b.score);

    const avgScore = relevanceScores.length
      ? relevanceScores.reduce((sum, entry) => sum + entry.score, 0) / relevanceScores.length
      : 0;

    const currentCount = activeCountByCategory.get(category.id) || 0;
    const deficit = Math.max(0, args.target - currentCount);
    const plannedCreate = createPlan.planByCategory.get(category.id) || 0;
    const extraForMinimumTotal = Math.max(0, plannedCreate - deficit);

    let created = 0;
    if (!args.auditOnly && args.apply && plannedCreate > 0) {
      if (!sellerCache.has(familyKey)) {
        const seller = await ensureSyntheticSeller(familyKey, sellerCache.size + 1);
        sellerCache.set(familyKey, seller.id);
      }

      const sellerId = sellerCache.get(familyKey);
      const syntheticRows = [];
      for (let i = 0; i < plannedCreate; i += 1) {
        const priorityTier = resolvePriorityTier(i, plannedCreate);
        syntheticRows.push(generateSyntheticProduct({
          category,
          familyKey,
          sellerId,
          offset: currentCount + i + 1,
          priorityTier,
          priorityOrder: i + 1,
        }));
      }

      for (const chunk of chunkArray(syntheticRows, args.batch)) {
        const result = await prisma.product.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        created += result.count;

        for (const row of chunk) {
          const tier = row?.specifications?.priorityTier;
          if (tier && Object.prototype.hasOwnProperty.call(report.totals.createdByTier, tier)) {
            report.totals.createdByTier[tier] += 1;
          }
        }
      }

      activeCountByCategory.set(category.id, currentCount + created);
    }

    const remainingDeficit = Math.max(0, args.target - ((activeCountByCategory.get(category.id) || currentCount)));

    report.totals.auditedProducts += products.length;
    report.totals.suspiciousProducts += suspicious.length;
    report.totals.plannedCreates += plannedCreate;
    report.totals.createdProducts += created;
    report.totals.remainingDeficitAfterRun += remainingDeficit;

    report.categories.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      family: familyKey,
      currentCount,
      targetCount: args.target,
      deficit,
      plannedCreate,
      extraForMinimumTotal,
      created,
      remainingDeficit,
      relevance: {
        averageScore: Number(avgScore.toFixed(6)),
        minAcceptableScore: args.minRelevanceScore,
        suspiciousCount: suspicious.length,
      },
    });

    report.suspiciousSamples.push(
      ...suspicious.slice(0, 5).map((entry) => ({
        categoryId: category.id,
        categoryName: category.name,
        productId: entry.productId,
        title: entry.title,
        score: entry.score,
        matchedKeywords: entry.matched,
      }))
    );

    console.log(
      `[${idx + 1}/${selectedCategories.length}] ${category.name}: active=${currentCount}, deficit=${deficit}, created=${created}, suspicious=${suspicious.length}`
    );
  }

  const reportDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `category_relevance_audit_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\nAudit + expansion summary');
  console.log(`- categories processed: ${report.totals.selectedCategories}`);
  console.log(`- products audited: ${report.totals.auditedProducts}`);
  console.log(`- suspicious products: ${report.totals.suspiciousProducts}`);
  console.log(`- planned creates: ${report.totals.plannedCreates}`);
  console.log(`- extra creates for minimum total: ${report.totals.extraCreatesForMinimumTotal}`);
  console.log(`- created products: ${report.totals.createdProducts}`);
  console.log(`- remaining deficit: ${report.totals.remainingDeficitAfterRun}`);
  console.log(`- active products before run: ${report.totals.totalActiveBefore}`);
  console.log(`- projected active products after plan: ${report.totals.projectedTotalAfterPlan}`);
  console.log(`- minimum total required: ${report.totals.minimumTotalRequired}`);
  console.log(`- created by tier: ${JSON.stringify(report.totals.createdByTier)}`);
  console.log(`- report: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error('Phase 6 script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
