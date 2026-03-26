const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRIORITY_TIERS = ['positive_review', 'most_sold', 'most_trendy', 'gradual'];

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {
    target: Number(process.env.TARGET_PRODUCTS_PER_CATEGORY || 500),
    minTotalActive: Number(process.env.MIN_TOTAL_ACTIVE_PRODUCTS || 40001),
    scope: (process.env.CATEGORY_SCOPE || 'leaf').toLowerCase(),
    topN: Number(process.env.VERIFICATION_TOP_N || 20),
  };

  for (const token of argv) {
    if (token.startsWith('--target=')) args.target = Number(token.split('=')[1]);
    if (token.startsWith('--min-total=')) args.minTotalActive = Number(token.split('=')[1]);
    if (token.startsWith('--scope=')) args.scope = String(token.split('=')[1] || '').toLowerCase();
    if (token.startsWith('--top-n=')) args.topN = Number(token.split('=')[1]);
  }

  args.target = Number.isFinite(args.target) && args.target > 0 ? Math.floor(args.target) : 500;
  args.minTotalActive = Number.isFinite(args.minTotalActive) && args.minTotalActive > 0
    ? Math.floor(args.minTotalActive)
    : 40001;
  args.topN = Number.isFinite(args.topN) && args.topN > 0 ? Math.floor(args.topN) : 20;

  if (!['leaf', 'main', 'all'].includes(args.scope)) {
    args.scope = 'leaf';
  }

  return args;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getFreshnessScore(createdAt) {
  if (!createdAt) return 0.5;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0.5;

  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 3) return 1;
  if (ageDays <= 15) return 0.85;
  if (ageDays <= 45) return 0.65;
  if (ageDays <= 90) return 0.45;
  return 0.25;
}

function getAgeMinutes(createdAt) {
  if (!createdAt) return Number.POSITIVE_INFINITY;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return Number.POSITIVE_INFINITY;
  return (Date.now() - created.getTime()) / (1000 * 60);
}

function parseSpecs(specifications) {
  if (!specifications) return {};
  if (typeof specifications === 'object') return specifications;

  try {
    return JSON.parse(String(specifications));
  } catch (_error) {
    return {};
  }
}

function getPriorityTier(product) {
  const specs = parseSpecs(product.specifications);
  const tier = String(specs.priorityTier || '').toLowerCase();
  return PRIORITY_TIERS.includes(tier) ? tier : null;
}

function getPriorityOrder(product) {
  const specs = parseSpecs(product.specifications);
  const value = Number(specs.priorityOrder);
  return Number.isFinite(value) ? value : null;
}

function getSoldProxy(product) {
  const specs = parseSpecs(product.specifications);
  const value = Number(specs.syntheticSoldProxy);
  return Number.isFinite(value) ? value : 0;
}

function getTrendMomentum(product) {
  const specs = parseSpecs(product.specifications);
  const value = Number(specs.syntheticTrendMomentum);
  return Number.isFinite(value) ? value : 0;
}

function computeObjectiveScore(product) {
  const rating = clamp01(toNumber(product.rating, 0) / 5);
  const reviewCount = toNumber(product.reviewCount, 0);
  const reviewConfidence = clamp01(Math.log10(reviewCount + 1) / Math.log10(3001));
  const positiveReviewScore = clamp01((rating * 0.65) + (reviewConfidence * 0.35));

  const soldProxy = clamp01(getSoldProxy(product) / 5000);
  const trendMomentum = clamp01(getTrendMomentum(product));
  const freshness = clamp01(getFreshnessScore(product.createdAt));
  const trendScore = clamp01((trendMomentum * 0.6) + (freshness * 0.4));

  return Number((positiveReviewScore * 0.4 + soldProxy * 0.35 + trendScore * 0.25).toFixed(6));
}

function summarizeTierStats(records) {
  const groups = {
    positive_review: [],
    most_sold: [],
    most_trendy: [],
    gradual: [],
  };

  for (const product of records) {
    const tier = getPriorityTier(product);
    if (!tier || !groups[tier]) continue;
    groups[tier].push(product);
  }

  const stats = {};
  for (const tier of PRIORITY_TIERS) {
    const items = groups[tier] || [];
    const count = items.length;
    const avgRating = count ? items.reduce((sum, item) => sum + toNumber(item.rating, 0), 0) / count : 0;
    const avgReviewCount = count ? items.reduce((sum, item) => sum + toNumber(item.reviewCount, 0), 0) / count : 0;
    const avgSoldProxy = count ? items.reduce((sum, item) => sum + getSoldProxy(item), 0) / count : 0;
    const avgTrendMomentum = count ? items.reduce((sum, item) => sum + getTrendMomentum(item), 0) / count : 0;
    const avgAgeMinutes = count ? items.reduce((sum, item) => sum + getAgeMinutes(item.createdAt), 0) / count : 0;

    stats[tier] = {
      count,
      avgRating: Number(avgRating.toFixed(4)),
      avgReviewCount: Number(avgReviewCount.toFixed(2)),
      avgSoldProxy: Number(avgSoldProxy.toFixed(2)),
      avgTrendMomentum: Number(avgTrendMomentum.toFixed(4)),
      avgAgeMinutes: Number(avgAgeMinutes.toFixed(2)),
    };
  }

  return stats;
}

function evaluateTierObjectives(tierStats) {
  const positive = tierStats.positive_review;
  const sold = tierStats.most_sold;
  const trendy = tierStats.most_trendy;
  const gradual = tierStats.gradual;

  const checks = [
    {
      name: 'positive_review_has_highest_rating',
      pass: positive.avgRating >= sold.avgRating && positive.avgRating >= trendy.avgRating,
      details: {
        positive: positive.avgRating,
        mostSold: sold.avgRating,
        mostTrendy: trendy.avgRating,
      },
    },
    {
      name: 'positive_review_has_highest_review_count',
      pass: positive.avgReviewCount >= sold.avgReviewCount && positive.avgReviewCount >= trendy.avgReviewCount,
      details: {
        positive: positive.avgReviewCount,
        mostSold: sold.avgReviewCount,
        mostTrendy: trendy.avgReviewCount,
      },
    },
    {
      name: 'most_sold_has_highest_sold_proxy',
      pass: sold.avgSoldProxy >= positive.avgSoldProxy && sold.avgSoldProxy >= trendy.avgSoldProxy,
      details: {
        positive: positive.avgSoldProxy,
        mostSold: sold.avgSoldProxy,
        mostTrendy: trendy.avgSoldProxy,
      },
    },
    {
      name: 'most_trendy_is_fresher_than_gradual',
      pass: trendy.avgAgeMinutes < gradual.avgAgeMinutes,
      details: {
        mostTrendyAgeMinutes: trendy.avgAgeMinutes,
        gradualAgeMinutes: gradual.avgAgeMinutes,
      },
    },
  ];

  return {
    pass: checks.every((check) => check.pass),
    checks,
  };
}

function checkTierSequence(productsByPriorityOrder) {
  const size = productsByPriorityOrder.length;
  if (size === 0) {
    return {
      pass: false,
      reason: 'no_priority_products',
    };
  }

  const expectedTierAtIndex = (index, total) => {
    const ratio = index / total;
    if (ratio < 0.2) return 'positive_review';
    if (ratio < 0.4) return 'most_sold';
    if (ratio < 0.6) return 'most_trendy';
    return 'gradual';
  };

  const mismatches = [];
  for (let i = 0; i < size; i += 1) {
    const actualTier = getPriorityTier(productsByPriorityOrder[i]);
    const expectedTier = expectedTierAtIndex(i, size);
    if (actualTier !== expectedTier) {
      mismatches.push({ index: i + 1, actualTier, expectedTier });
      if (mismatches.length >= 10) break;
    }
  }

  const pass = mismatches.length === 0;

  return {
    pass,
    size,
    mismatchSample: mismatches,
  };
}

async function main() {
  const args = parseArgs();

  console.log('Phase 7: End-to-end ranking objective verification');
  console.log(`- scope: ${args.scope}`);
  console.log(`- target per category: ${args.target}`);
  console.log(`- minimum total active products: ${args.minTotalActive}`);
  console.log(`- top-N objective sample: ${args.topN}`);

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
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
    throw new Error('No categories found for selected scope.');
  }

  const totalActive = await prisma.product.count({ where: { isActive: true } });

  const activeCountsRows = await prisma.product.groupBy({
    by: ['categoryId'],
    where: {
      isActive: true,
      categoryId: { in: selectedCategories.map((category) => category.id) },
    },
    _count: { _all: true },
  });
  const activeCountByCategory = new Map(activeCountsRows.map((row) => [row.categoryId, row._count._all]));

  const allSelectedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: { in: selectedCategories.map((category) => category.id) },
    },
    select: {
      id: true,
      categoryId: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
      isFeatured: true,
      certifications: true,
      specifications: true,
    },
  });

  const productsByCategory = new Map();
  for (const product of allSelectedProducts) {
    if (!productsByCategory.has(product.categoryId)) {
      productsByCategory.set(product.categoryId, []);
    }
    productsByCategory.get(product.categoryId).push(product);
  }

  const belowTargetCategories = [];
  const categoryChecks = [];
  let tierSequencePassCount = 0;
  let topNPriorityDominancePassCount = 0;

  for (const category of selectedCategories) {
    const activeCount = activeCountByCategory.get(category.id) || 0;
    if (activeCount < args.target) {
      belowTargetCategories.push({
        categoryId: category.id,
        categoryName: category.name,
        activeCount,
        target: args.target,
      });
    }

    const categoryProducts = productsByCategory.get(category.id) || [];
    const priorityProducts = categoryProducts
      .map((product) => ({ product, order: getPriorityOrder(product) }))
      .filter((entry) => entry.order !== null)
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((entry) => entry.product);

    const tierSequence = checkTierSequence(priorityProducts);
    if (tierSequence.pass) {
      tierSequencePassCount += 1;
    }

    const rankedByObjective = categoryProducts
      .map((product) => {
        const tier = getPriorityTier(product) || 'unknown';
        const objectiveScore = computeObjectiveScore(product);
        return {
          product,
          tier,
          objectiveScore,
        };
      })
      .sort((a, b) => b.objectiveScore - a.objectiveScore);

    const topN = rankedByObjective.slice(0, args.topN);
    const priorityHits = topN.filter((entry) => ['positive_review', 'most_sold', 'most_trendy'].includes(entry.tier)).length;
    const dominanceRatio = topN.length ? priorityHits / topN.length : 0;
    const dominancePass = dominanceRatio >= 0.7;
    if (dominancePass) {
      topNPriorityDominancePassCount += 1;
    }

    categoryChecks.push({
      categoryId: category.id,
      categoryName: category.name,
      activeCount,
      target: args.target,
      targetPass: activeCount >= args.target,
      priorityProducts: priorityProducts.length,
      tierSequencePass: tierSequence.pass,
      topNPriorityDominancePass: dominancePass,
      topNPriorityDominanceRatio: Number(dominanceRatio.toFixed(4)),
    });
  }

  const allPriorityProducts = allSelectedProducts.filter((product) => getPriorityTier(product) !== null);
  const tierStats = summarizeTierStats(allPriorityProducts);
  const tierObjective = evaluateTierObjectives(tierStats);

  const overallChecks = {
    totalActiveCheck: {
      pass: totalActive >= args.minTotalActive,
      actual: totalActive,
      required: args.minTotalActive,
    },
    categoryTargetCheck: {
      pass: belowTargetCategories.length === 0,
      belowTargetCount: belowTargetCategories.length,
    },
    tierObjectiveCheck: tierObjective,
    tierSequenceCoverageCheck: {
      pass: tierSequencePassCount === selectedCategories.length,
      passCount: tierSequencePassCount,
      totalCategories: selectedCategories.length,
    },
    topNPriorityDominanceCheck: {
      pass: topNPriorityDominancePassCount / selectedCategories.length >= 0.95,
      passCount: topNPriorityDominancePassCount,
      totalCategories: selectedCategories.length,
      ratio: Number((topNPriorityDominancePassCount / selectedCategories.length).toFixed(4)),
    },
  };

  const overallPass =
    overallChecks.totalActiveCheck.pass &&
    overallChecks.categoryTargetCheck.pass &&
    overallChecks.tierObjectiveCheck.pass &&
    overallChecks.tierSequenceCoverageCheck.pass &&
    overallChecks.topNPriorityDominanceCheck.pass;

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 7,
    objective: 'End-to-end verification against ranking objectives',
    config: args,
    summary: {
      overallPass,
      totalActive,
      selectedCategories: selectedCategories.length,
      belowTargetCategories: belowTargetCategories.length,
      tierSequencePassCount,
      topNPriorityDominancePassCount,
      topNPriorityDominanceRatio: Number((topNPriorityDominancePassCount / selectedCategories.length).toFixed(4)),
      priorityProductsAnalyzed: allPriorityProducts.length,
    },
    checks: overallChecks,
    tierStats,
    belowTargetCategories,
    categoryChecks,
  };

  const reportDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `phase7_ranking_verification_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\nPhase 7 verification summary');
  console.log(`- overall pass: ${overallPass}`);
  console.log(`- total active products: ${totalActive}`);
  console.log(`- below-target categories: ${belowTargetCategories.length}`);
  console.log(`- tier sequence pass count: ${tierSequencePassCount}/${selectedCategories.length}`);
  console.log(`- top-N priority dominance pass count: ${topNPriorityDominancePassCount}/${selectedCategories.length}`);
  console.log(`- tier objective pass: ${tierObjective.pass}`);
  console.log(`- report: ${reportPath}`);

  if (!overallPass) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error('Phase 7 verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
