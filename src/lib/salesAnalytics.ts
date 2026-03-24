/**
 * Sales Analytics & Top-Selling Products
 * Provides real data for customer inquiries about popular products
 */

import { prisma } from '@/lib/prisma';

export interface TopProduct {
  id: string;
  title: string;
  slug: string;
  currentPrice: string;
  totalSold: number;
  rating: string;
  mainImage: string;
}

/**
 * Get top-selling products in a category within a time period
 */
export async function getTopSellingProducts(
  categoryName?: string,
  days: number = 30,
  limit: number = 5
): Promise<TopProduct[]> {
  try {
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build base query
    let whereClause: any = {
      order: {
        status: 'DELIVERED', // Only count completed orders
        createdAt: { gte: startDate },
      },
    };

    // If category is specified, filter by category
    if (categoryName && categoryName.trim()) {
      whereClause.product = {
        category: {
          name: {
            contains: categoryName,
            mode: 'insensitive',
          },
        },
      };
    } else {
      whereClause.product = {};
    }

    // Group by product and sum quantities
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: whereClause,
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (topProducts.length === 0) {
      return [];
    }

    // Fetch product details
    const productIds = topProducts.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        currentPrice: true,
        rating: true,
        mainImage: true,
      },
    });

    // Map back with sold quantities in original order
    const result = topProducts
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product
          ? {
              ...product,
              currentPrice: String(product.currentPrice),
              rating: String(product.rating),
              totalSold: item._sum.quantity || 0,
            }
          : null;
      })
      .filter((item): item is TopProduct => item !== null);

    return result;
  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    return [];
  }
}

/**
 * Get top-selling products overall (all categories)
 */
export async function getTopSellingProductsOverall(
  days: number = 30,
  limit: number = 5
): Promise<TopProduct[]> {
  return getTopSellingProducts(undefined, days, limit);
}

/**
 * Format products for display in chat
 */
export function formatProductsForChat(products: TopProduct[]): string {
  if (products.length === 0) {
    return 'Currently, we have great products available! Use the search bar to explore our latest deals. 🛍️';
  }

  let response = '🔥 **Most Sold Products** (Last 30 Days):\n\n';

  products.forEach((product, index) => {
    response += `${index + 1}. **${product.title}**\n`;
    response += `   💰 Price: ${product.currentPrice} BDT\n`;
    response += `   ⭐ Rating: ${product.rating}/5\n`;
    response += `   📦 Sold: ${product.totalSold} units\n\n`;
  });

  response += `**Want to buy?** Click the product name or search for it in our store! 🛒`;

  return response;
}

/**
 * Detect time period from message
 */
export function detectTimePeriod(message: string): number {
  const lower = message.toLowerCase();

  if (lower.includes('today') || lower.includes('24 hours')) {
    return 1;
  }
  if (lower.includes('this week') || lower.includes('last 7 days')) {
    return 7;
  }
  if (lower.includes('this month') || lower.includes('last 30 days') || lower.includes('last month')) {
    return 30;
  }
  if (lower.includes('this quarter') || lower.includes('3 months')) {
    return 90;
  }
  if (lower.includes('this year') || lower.includes('12 months')) {
    return 365;
  }

  // Default to 30 days (last month)
  return 30;
}

/**
 * Extract product category from message
 */
export function extractCategory(message: string): string | undefined {
  const lower = message.toLowerCase();

  // Common categories
  const categories: { [key: string]: string } = {
    phone: 'Electronics',
    mobile: 'Electronics',
    smartphone: 'Electronics',
    laptop: 'Electronics',
    computer: 'Electronics',
    tablet: 'Electronics',
    earbuds: 'Electronics',
    headphone: 'Electronics',
    speaker: 'Electronics',
    charger: 'Electronics',
    trimmer: 'Electronics',
    camera: 'Electronics',
    watch: 'Electronics',
    keyboard: 'Electronics',
    mouse: 'Electronics',

    dress: 'Fashion',
    shirt: 'Fashion',
    pants: 'Fashion',
    jeans: 'Fashion',
    shoes: 'Fashion',
    sneakers: 'Fashion',
    boots: 'Fashion',
    jacket: 'Fashion',
    coat: 'Fashion',
    saree: 'Fashion',
    top: 'Fashion',

    skincare: 'Beauty',
    moisturizer: 'Beauty',
    serum: 'Beauty',
    cream: 'Beauty',
    lotion: 'Beauty',
    shampoo: 'Beauty',
    soap: 'Beauty',
    cosmetics: 'Beauty',
    makeup: 'Beauty',
    fragrance: 'Beauty',

    furniture: 'Home',
    sofa: 'Home',
    bed: 'Home',
    table: 'Home',
    chair: 'Home',
    lamp: 'Home',
    pillow: 'Home',
    bedsheet: 'Home',
    towel: 'Home',
    kitchen: 'Home',
  };

  for (const [keyword, category] of Object.entries(categories)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  return undefined;
}
