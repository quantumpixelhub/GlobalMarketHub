import { prisma } from '@/lib/prisma';

export type CommerceTopic =
  | 'PRODUCTS'
  | 'PAYMENTS'
  | 'DELIVERY'
  | 'COUPON'
  | 'CAMPAIGN'
  | 'TOP_DEALS'
  | 'TOP_SELLS'
  | 'TOP_RANKINGS'
  | 'TOP_REVIEWS'
  | 'NEW_ARRIVALS'
  | 'FEATURED'
  | 'MOST_SOLD';

export interface CommerceInsightResult {
  topic: CommerceTopic;
  message: string;
}

const MAX_ITEMS = 10;
const DEFAULT_ITEMS = 5;
const REQUIREMENT_STOP_WORDS = new Set([
  'which',
  'what',
  'is',
  'are',
  'the',
  'a',
  'an',
  'for',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'best',
  'top',
  'most',
  'sold',
  'selling',
  'deal',
  'deals',
  'review',
  'reviews',
  'ranking',
  'ranked',
  'product',
  'products',
  'item',
  'items',
  'show',
  'give',
  'list',
]);

function toBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

function extractLimit(message: string): number {
  const match = message.match(/(?:top|best|show|list|give)\s*(\d{1,2})/i);
  if (!match) return DEFAULT_ITEMS;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_ITEMS;
  return Math.min(parsed, MAX_ITEMS);
}

function cleanSearchPhrase(input: string): string {
  return input
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractProductPhrase(message: string): string | null {
  const patterns = [
    /(?:do you have|do you sell|have|sell|available|find|search)\s+(.+?)(?:\?|$)/i,
    /(?:product|item)\s+(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const phrase = cleanSearchPhrase(match[1]);
      if (phrase.length >= 2) {
        return phrase;
      }
    }
  }

  return null;
}

function extractRequirementTerm(message: string): string | null {
  const patterns = [
    /which\s+(.+?)\s+(?:best|top|most)\s+(?:sold|selling|ranked|reviewed)/i,
    /(?:best|top|most)\s+(?:sold|selling|ranked|reviewed|deals?)\s+(.+?)(?:\?|$)/i,
    /(?:new arrivals?|featured)\s+(?:of|for)?\s*(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const phrase = cleanSearchPhrase(match[1]);
      if (phrase.length >= 2) {
        return phrase;
      }
    }
  }

  const productPhrase = extractProductPhrase(message);
  if (productPhrase) return productPhrase;

  const tokens = cleanSearchPhrase(message)
    .toLowerCase()
    .split(' ')
    .filter((token) => token.length >= 3 && !REQUIREMENT_STOP_WORDS.has(token));

  return tokens.length > 0 ? tokens[0] : null;
}

function buildRequirementWhere(term: string | null) {
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { category: { name: { contains: term, mode: 'insensitive' as const } } },
    ],
  };
}

function detectCommerceTopic(message: string): CommerceTopic | null {
  const lower = message.toLowerCase();

  if (/(most sold|most selling|highest sold)/.test(lower)) return 'MOST_SOLD';
  if (/(top sell|top sold|top selling|best selling|best sold|bestseller|best seller)/.test(lower)) {
    return 'TOP_SELLS';
  }
  if (/(top deal|best deal|hot deal|deals)/.test(lower)) return 'TOP_DEALS';
  if (/(top ranking|top rank|highest rating|best rated|ranking)/.test(lower)) return 'TOP_RANKINGS';
  if (/(top review|most reviewed|best review)/.test(lower)) return 'TOP_REVIEWS';
  if (/(new arrival|just arrived|latest product|latest arrival)/.test(lower)) return 'NEW_ARRIVALS';
  if (/(featured|featured product)/.test(lower)) return 'FEATURED';
  if (/(coupon|promo|discount code|voucher)/.test(lower)) return 'COUPON';
  if (/(campaign|festival|sale event|promotion campaign)/.test(lower)) return 'CAMPAIGN';
  if (/(payment|bkash|nagad|rocket|stripe|uddoktapay|card|how to pay)/.test(lower)) return 'PAYMENTS';
  if (/(delivery|shipping|inside dhaka|outside dhaka|express|standard delivery)/.test(lower)) {
    return 'DELIVERY';
  }
  if (/(product|available|in stock|do you have|do you sell|search)/.test(lower)) return 'PRODUCTS';

  return null;
}

async function getProductsListByCreatedAt(limit: number, featuredOnly = false, requirementTerm: string | null = null) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      ...(featuredOnly ? { isFeatured: true } : {}),
      ...buildRequirementWhere(requirementTerm),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      currentPrice: true,
      originalPrice: true,
      rating: true,
      reviewCount: true,
      stock: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  });
}

async function getTopDeals(limit: number, requirementTerm: string | null = null) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      originalPrice: { gt: 0 },
      ...buildRequirementWhere(requirementTerm),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      currentPrice: true,
      originalPrice: true,
      rating: true,
      reviewCount: true,
    },
    take: 80,
  });

  return products
    .map((product) => {
      const original = Number(product.originalPrice);
      const current = Number(product.currentPrice);
      const discount = original > current ? ((original - current) / original) * 100 : 0;
      return {
        ...product,
        original,
        current,
        discount,
      };
    })
    .filter((product) => product.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, limit);
}

async function getTopSold(limit: number, requirementTerm: string | null = null) {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: 'DELIVERED',
      },
      ...(requirementTerm ? { product: buildRequirementWhere(requirementTerm) } : {}),
    },
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: 'desc' },
    },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const ids = grouped.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
      currentPrice: true,
      rating: true,
      reviewCount: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  return grouped
    .map((row) => {
      const product = productMap.get(row.productId);
      if (!product) return null;
      return {
        ...product,
        sold: row._sum.quantity || 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function formatProductLine(index: number, product: {
  title: string;
  currentPrice: number;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  discount?: number;
}): string {
  const parts = [`${index}. ${product.title}`, `Price: ${toBdt(product.currentPrice)}`];
  if (typeof product.discount === 'number') parts.push(`Discount: ${product.discount.toFixed(1)}%`);
  if (typeof product.rating === 'number') parts.push(`Rating: ${product.rating.toFixed(1)}/5`);
  if (typeof product.reviewCount === 'number') parts.push(`Reviews: ${product.reviewCount}`);
  if (typeof product.sold === 'number') parts.push(`Sold: ${product.sold}`);
  return `- ${parts.join(' | ')}`;
}

async function buildProductsResponse(message: string): Promise<CommerceInsightResult> {
  const phrase = extractProductPhrase(message);
  const limit = extractLimit(message);

  if (phrase) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        OR: [
          { title: { contains: phrase, mode: 'insensitive' } },
          { description: { contains: phrase, mode: 'insensitive' } },
          { category: { name: { contains: phrase, mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      take: limit,
      select: {
        title: true,
        currentPrice: true,
        rating: true,
        reviewCount: true,
        category: { select: { name: true } },
      },
    });

    if (products.length === 0) {
      return {
        topic: 'PRODUCTS',
        message:
          `I could not find in-stock products matching "${phrase}" right now. Try a broader keyword or category (for example: phone, laptop, fashion, skincare).`,
      };
    }

    const lines = products.map((product, idx) =>
      formatProductLine(idx + 1, {
        title: `${product.title} (${product.category?.name || 'General'})`,
        currentPrice: Number(product.currentPrice),
        rating: Number(product.rating),
        reviewCount: product.reviewCount,
      })
    );

    return {
      topic: 'PRODUCTS',
      message: `Here are matching in-stock products for "${phrase}":\n${lines.join('\n')}`,
    };
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: limit,
    select: {
      title: true,
      currentPrice: true,
      rating: true,
      reviewCount: true,
      category: { select: { name: true } },
    },
  });

  const lines = products.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: `${product.title} (${product.category?.name || 'General'})`,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
    })
  );

  return {
    topic: 'PRODUCTS',
    message:
      lines.length > 0
        ? `Top in-stock products right now:\n${lines.join('\n')}`
        : 'No in-stock products are available right now.',
  };
}

async function buildPaymentsResponse(): Promise<CommerceInsightResult> {
  const gateways = await prisma.paymentGatewayConfig.findMany({
    where: { isEnabled: true },
    orderBy: [{ priority: 'asc' }, { displayName: 'asc' }],
    select: {
      gatewayName: true,
      displayName: true,
      minAmount: true,
      maxAmount: true,
      transactionFee: true,
      description: true,
    },
  });

  const lines = gateways.map((gateway) => {
    const min = Number(gateway.minAmount);
    const max = Number(gateway.maxAmount);
    const fee = Number(gateway.transactionFee);
    return `- ${gateway.displayName} (${gateway.gatewayName}) | Limit: ${toBdt(min)} - ${toBdt(max)} | Fee: ${fee}%${gateway.description ? ` | ${gateway.description}` : ''}`;
  });

  return {
    topic: 'PAYMENTS',
    message:
      lines.length > 0
        ? `Available payment methods right now (COD is unavailable):\n${lines.join('\n')}`
        : 'No online payment method is enabled right now. Please contact support.',
  };
}

function buildDeliveryResponse(): CommerceInsightResult {
  return {
    topic: 'DELIVERY',
    message: [
      'Current delivery charges and speed:',
      '- Inside Dhaka | Standard: BDT 60 | Express: BDT 120',
      '- Outside Dhaka | Standard: BDT 120 | Express: BDT 180',
      'Delivery time (typical):',
      '- Inside Dhaka: 1-2 business days (standard), same/next day (express)',
      '- Outside Dhaka: 3-5 business days (standard), 1-2 business days (express)',
    ].join('\n'),
  };
}

async function buildCouponResponse(): Promise<CommerceInsightResult> {
  const coupon = await prisma.marketingCoupon.findFirst({
    where: { status: 'ACTIVE', expiresAt: { gte: new Date() } },
    orderBy: { updatedAt: 'desc' },
    select: {
      code: true,
      discount: true,
      minOrder: true,
      usedCount: true,
      totalUsage: true,
      expiresAt: true,
    },
  });

  if (!coupon) {
    return {
      topic: 'COUPON',
      message: 'There is no active coupon at the moment. Check again soon for new offers.',
    };
  }

  const usageLeft = Math.max(0, coupon.totalUsage - coupon.usedCount);
  return {
    topic: 'COUPON',
    message: [
      `Active coupon: ${coupon.code}`,
      `- Discount: ${Number(coupon.discount)}%`,
      `- Minimum order: ${toBdt(Number(coupon.minOrder))}`,
      `- Remaining uses: ${usageLeft}`,
      `- Expires on: ${new Date(coupon.expiresAt).toLocaleDateString()}`,
    ].join('\n'),
  };
}

async function buildCampaignResponse(limit: number): Promise<CommerceInsightResult> {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ updatedAt: 'desc' }, { startsAt: 'desc' }],
    take: limit,
    select: {
      name: true,
      badge: true,
      discountText: true,
      startsAt: true,
      endsAt: true,
      description: true,
    },
  });

  if (campaigns.length === 0) {
    return {
      topic: 'CAMPAIGN',
      message: 'No active campaign is running right now.',
    };
  }

  const lines = campaigns.map(
    (campaign, idx) =>
      `- ${idx + 1}. ${campaign.name} [${campaign.badge}] | ${campaign.discountText} | ${new Date(campaign.startsAt).toLocaleDateString()} - ${new Date(campaign.endsAt).toLocaleDateString()} | ${campaign.description}`
  );

  return {
    topic: 'CAMPAIGN',
    message: `Active campaigns:\n${lines.join('\n')}`,
  };
}

async function buildTopDealsResponse(
  limit: number,
  requirementTerm: string | null
): Promise<CommerceInsightResult> {
  const deals = await getTopDeals(limit, requirementTerm);
  if (deals.length === 0) {
    return {
      topic: 'TOP_DEALS',
      message: requirementTerm
        ? `No discounted in-stock deals are available for "${requirementTerm}" right now.`
        : 'No discounted in-stock deals are available right now.',
    };
  }

  const lines = deals.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: product.title,
      currentPrice: product.current,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      discount: product.discount,
    })
  );

  return {
    topic: 'TOP_DEALS',
    message: `${requirementTerm ? `Top deals for "${requirementTerm}"` : 'Top deals right now'}:\n${lines.join('\n')}`,
  };
}

async function getTopRatedProductsByRequirement(requirementTerm: string | null, limit: number) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      ...buildRequirementWhere(requirementTerm),
    },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: limit,
    select: {
      title: true,
      currentPrice: true,
      rating: true,
      reviewCount: true,
    },
  });
}

async function buildTopSellsResponse(
  limit: number,
  topic: CommerceTopic,
  message: string
): Promise<CommerceInsightResult> {
  const requirementTerm = extractRequirementTerm(message);
  const topSold = await getTopSold(limit, requirementTerm);

  if (topSold.length === 0) {
    const fallbackProducts = await getTopRatedProductsByRequirement(requirementTerm, limit);
    if (fallbackProducts.length > 0) {
      const fallbackLines = fallbackProducts.map((product, idx) =>
        formatProductLine(idx + 1, {
          title: product.title,
          currentPrice: Number(product.currentPrice),
          rating: Number(product.rating),
          reviewCount: product.reviewCount,
        })
      );

      return {
        topic,
        message: [
          requirementTerm
            ? `No delivered-order sales data found for "${requirementTerm}" yet.`
            : 'No delivered-order sales data found yet.',
          'Best matching top-rated in-stock options:',
          ...fallbackLines,
        ].join('\n'),
      };
    }

    return {
      topic,
      message: requirementTerm
        ? `No delivered-order sales data or in-stock matches found for "${requirementTerm}" yet.`
        : 'No delivered-order sales data is available yet.',
    };
  }

  const lines = topSold.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: product.title,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      sold: product.sold,
    })
  );

  return {
    topic,
    message: `${
      topic === 'MOST_SOLD' ? 'Most sold items' : 'Top selling items'
    }${requirementTerm ? ` for "${requirementTerm}"` : ''}:\n${lines.join('\n')}`,
  };
}

async function buildTopRankingsResponse(
  limit: number,
  requirementTerm: string | null
): Promise<CommerceInsightResult> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      ...buildRequirementWhere(requirementTerm),
    },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: limit,
    select: {
      title: true,
      currentPrice: true,
      rating: true,
      reviewCount: true,
    },
  });

  const lines = products.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: product.title,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
    })
  );

  return {
    topic: 'TOP_RANKINGS',
    message:
      lines.length > 0
        ? `${
            requirementTerm
              ? `Top ranking products for "${requirementTerm}" (by rating and reviews)`
              : 'Top ranking products (by rating and reviews)'
          }:\n${lines.join('\n')}`
        : requirementTerm
          ? `No ranking data available for "${requirementTerm}" yet.`
          : 'No ranking data available yet.',
  };
}

async function buildTopReviewsResponse(
  limit: number,
  requirementTerm: string | null
): Promise<CommerceInsightResult> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      reviewCount: { gt: 0 },
      ...buildRequirementWhere(requirementTerm),
    },
    orderBy: [{ reviewCount: 'desc' }, { rating: 'desc' }],
    take: limit,
    select: {
      title: true,
      currentPrice: true,
      rating: true,
      reviewCount: true,
    },
  });

  const lines = products.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: product.title,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
    })
  );

  return {
    topic: 'TOP_REVIEWS',
    message:
      lines.length > 0
        ? `${requirementTerm ? `Top reviewed products for "${requirementTerm}"` : 'Top reviewed products'}:\n${lines.join('\n')}`
        : requirementTerm
          ? `No reviewed products are available for "${requirementTerm}" yet.`
          : 'No reviewed products are available yet.',
  };
}

async function buildNewArrivalsResponse(
  limit: number,
  requirementTerm: string | null
): Promise<CommerceInsightResult> {
  const products = await getProductsListByCreatedAt(limit, false, requirementTerm);
  const lines = products.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: `${product.title} (${product.category?.name || 'General'})`,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
    })
  );

  return {
    topic: 'NEW_ARRIVALS',
    message:
      lines.length > 0
        ? `${requirementTerm ? `New arrivals for "${requirementTerm}"` : 'New arrivals'}:\n${lines.join('\n')}`
        : requirementTerm
          ? `No new arrivals found for "${requirementTerm}" right now.`
          : 'No new arrivals found right now.',
  };
}

async function buildFeaturedResponse(
  limit: number,
  requirementTerm: string | null
): Promise<CommerceInsightResult> {
  const products = await getProductsListByCreatedAt(limit, true, requirementTerm);
  const lines = products.map((product, idx) =>
    formatProductLine(idx + 1, {
      title: `${product.title} (${product.category?.name || 'General'})`,
      currentPrice: Number(product.currentPrice),
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
    })
  );

  return {
    topic: 'FEATURED',
    message:
      lines.length > 0
        ? `${requirementTerm ? `Featured products for "${requirementTerm}"` : 'Featured products'}:\n${lines.join('\n')}`
        : requirementTerm
          ? `No featured products found for "${requirementTerm}" right now.`
          : 'No featured products are active right now.',
  };
}

export async function getCommerceInsightResponse(message: string): Promise<CommerceInsightResult | null> {
  const topic = detectCommerceTopic(message);
  if (!topic) return null;

  const limit = extractLimit(message);
  const requirementTerm = extractRequirementTerm(message);

  switch (topic) {
    case 'PRODUCTS':
      return buildProductsResponse(message);
    case 'PAYMENTS':
      return buildPaymentsResponse();
    case 'DELIVERY':
      return buildDeliveryResponse();
    case 'COUPON':
      return buildCouponResponse();
    case 'CAMPAIGN':
      return buildCampaignResponse(limit);
    case 'TOP_DEALS':
      return buildTopDealsResponse(limit, requirementTerm);
    case 'TOP_SELLS':
      return buildTopSellsResponse(limit, 'TOP_SELLS', message);
    case 'TOP_RANKINGS':
      return buildTopRankingsResponse(limit, requirementTerm);
    case 'TOP_REVIEWS':
      return buildTopReviewsResponse(limit, requirementTerm);
    case 'NEW_ARRIVALS':
      return buildNewArrivalsResponse(limit, requirementTerm);
    case 'FEATURED':
      return buildFeaturedResponse(limit, requirementTerm);
    case 'MOST_SOLD':
      return buildTopSellsResponse(limit, 'MOST_SOLD', message);
    default:
      return null;
  }
}