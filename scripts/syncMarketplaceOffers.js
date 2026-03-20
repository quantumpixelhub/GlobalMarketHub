const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_QUERY = process.env.SEARCH_QUERY || 'coffee';
const MAX_PER_SELLER = Math.max(1, Number(process.env.MAX_PER_SELLER || 120));
const SELLERS = (process.env.SELLERS || 'daraz,chaldal,rokomari,aliexpress')
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

const normalizeText = (value) => String(value || '').trim();

const parsePrice = (value) => {
  const num = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const parseIntSafe = (value) => {
  const num = Number(String(value || '').replace(/[^0-9]/g, ''));
  return Number.isFinite(num) ? Math.round(num) : 0;
};

const shortHash = (value) => crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 16);

const slugParts = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

async function findRelatedProduct(title) {
  const parts = slugParts(title).slice(0, 5);
  if (!parts.length) return null;

  const where = {
    isActive: true,
    OR: parts.map((token) => ({
      title: { contains: token, mode: 'insensitive' },
    })),
  };

  return prisma.product.findFirst({
    where,
    orderBy: { reviewCount: 'desc' },
    select: { id: true },
  });
}

async function fetchViaJina(url) {
  const wrapped = `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`;
  const response = await fetch(wrapped, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });

  const text = await response.text();
  return { status: response.status, text, wrappedUrl: wrapped };
}

function parseDaraz(markdown, query) {
  const offers = [];
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/[^)]+)\)\s*\n\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)\s*\n\s*৳\s*([0-9,]+)(?:\s*\n\s*([0-9]{1,2})% Off)?/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[3]);
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPrice = parsePrice(match[5]);
    if (currentPrice <= 0) {
      continue;
    }

    const discountPercent = parseIntSafe(match[6]);
    const url = match[4];
    const externalIdMatch = url.match(/-i(\d+)\.html/i);
    const externalId = externalIdMatch ? `daraz-${externalIdMatch[1]}` : `daraz-${shortHash(url)}`;
    const originalPrice = discountPercent > 0
      ? Math.round(currentPrice / (1 - (discountPercent / 100)))
      : currentPrice;

    offers.push({
      platform: 'daraz',
      externalId,
      externalUrl: url,
      title,
      sellerName: 'Daraz Marketplace',
      imageUrl: match[1] || null,
      categoryName: 'Marketplace',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseChaldal(markdown, query) {
  const lines = markdown.split(/\r?\n/).map((l) => l.trim());
  const offers = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith('![Image') || !line.includes('i.chaldn.com')) {
      continue;
    }

    const imageMatch = line.match(/\((https?:\/\/[^)]+)\)/);
    let price = 0;
    let title = '';

    for (let j = i + 1; j < Math.min(i + 12, lines.length); j += 1) {
      const candidate = lines[j];
      if (!candidate) continue;

      if (!price && /^৳$/.test(candidate)) {
        for (let k = j + 1; k < Math.min(i + 16, lines.length); k += 1) {
          const next = lines[k];
          if (!next) continue;
          const parsed = parsePrice(next);
          if (parsed > 0) {
            price = parsed;
            j = k;
            break;
          }
        }
        continue;
      }

      if (!price && /৳/.test(candidate)) {
        price = parsePrice(candidate);
        continue;
      }

      if (!title && price > 0 && /[a-zA-Z]/.test(candidate) && !/^(gm|kg|ml|l|pcs|pc|hr)$/i.test(candidate)) {
        title = candidate;
        break;
      }
    }

    title = normalizeText(title);
    if (!title || !title.toLowerCase().includes(query.toLowerCase()) || price <= 0) {
      continue;
    }

    const externalId = `chaldal-${shortHash(`${title}-${price}-${imageMatch ? imageMatch[1] : ''}`)}`;
    offers.push({
      platform: 'chaldal',
      externalId,
      externalUrl: `https://chaldal.com/search/${encodeURIComponent(title)}`,
      title,
      sellerName: 'Chaldal',
      imageUrl: imageMatch ? imageMatch[1] : null,
      categoryName: 'Groceries',
      externalPrice: price,
      externalOriginalPrice: price,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseRokomari(markdown, query) {
  const offers = [];
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)[^\]]*####\s*([^\]]+?)\s*(?:Brand:[^\]]+)?(?:~~TK\.\s*([0-9,]+)~~\s*)?TK\.\s*([0-9,]+)\]\((https?:\/\/www\.rokomari\.com\/product\/[^\s)]+)[^)]*\)/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[2].replace(/\s+/g, ' '));
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPrice = parsePrice(match[4]);
    if (currentPrice <= 0) {
      continue;
    }

    const originalPrice = match[3] ? parsePrice(match[3]) : currentPrice;
    const url = match[5];
    const productIdMatch = url.match(/\/product\/(\d+)\//i);

    offers.push({
      platform: 'rokomari',
      externalId: productIdMatch ? `rokomari-${productIdMatch[1]}` : `rokomari-${shortHash(url)}`,
      externalUrl: url,
      title,
      sellerName: 'Rokomari',
      imageUrl: match[1] || null,
      categoryName: 'Books & Grocery',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice || currentPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseAliExpress(markdown, query) {
  const offers = [];
  const regex = /!\[Image\s+\d+[^\]]*\]\((https?:\/\/[^)]*aliexpress-media[^)]+)\)[\s\S]{0,600}?###\s+([^\n$]+?)\s+\$\s*([0-9.,]+)(?:\s+\$\s*([0-9.,]+))?[\s\S]{0,800}?\]\((https?:\/\/www\.aliexpress\.[^)\s]+)\)/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[2]);
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPriceUsd = parsePrice(match[3]);
    if (currentPriceUsd <= 0) {
      continue;
    }

    const originalPriceUsd = match[4] ? parsePrice(match[4]) : currentPriceUsd;
    const bdtRate = 122;
    const currentPrice = Math.round(currentPriceUsd * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(originalPriceUsd * bdtRate));

    const url = match[5].replace(/&amp;/g, '&');
    const itemIdMatch = url.match(/\/item\/(\d+)\.html/i);
    const externalId = itemIdMatch ? `aliexpress-${itemIdMatch[1]}` : `aliexpress-${shortHash(url)}`;

    offers.push({
      platform: 'aliexpress',
      externalId,
      externalUrl: url,
      title,
      sellerName: 'AliExpress Marketplace',
      imageUrl: match[1] || null,
      categoryName: 'Global Marketplace',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

const providers = {
  daraz: {
    buildUrl: (q) => `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(q)}`,
    parse: parseDaraz,
  },
  chaldal: {
    buildUrl: (q) => `https://chaldal.com/search/${encodeURIComponent(q)}`,
    parse: parseChaldal,
  },
  rokomari: {
    buildUrl: (q) => `https://www.rokomari.com/search?term=${encodeURIComponent(q)}`,
    parse: parseRokomari,
  },
  alibaba: {
    buildUrl: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`,
    parse: () => [],
  },
  aliexpress: {
    buildUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`,
    parse: parseAliExpress,
  },
};

async function upsertOffer(offer) {
  const relatedProduct = await findRelatedProduct(offer.title);

  await prisma.externalProduct.upsert({
    where: {
      platform_externalId: {
        platform: offer.platform,
        externalId: offer.externalId,
      },
    },
    update: {
      productId: relatedProduct?.id || null,
      externalUrl: offer.externalUrl,
      title: offer.title,
      sellerName: offer.sellerName || null,
      imageUrl: offer.imageUrl || null,
      categoryName: offer.categoryName || null,
      externalPrice: offer.externalPrice,
      externalOriginalPrice: offer.externalOriginalPrice || offer.externalPrice,
      externalRating: offer.externalRating,
      externalReviewCount: offer.externalReviewCount || 0,
      isTracked: true,
      isSynthetic: false,
      lastSyncedAt: new Date(),
    },
    create: {
      productId: relatedProduct?.id || null,
      platform: offer.platform,
      externalId: offer.externalId,
      externalUrl: offer.externalUrl,
      title: offer.title,
      sellerName: offer.sellerName || null,
      imageUrl: offer.imageUrl || null,
      categoryName: offer.categoryName || null,
      externalPrice: offer.externalPrice,
      externalOriginalPrice: offer.externalOriginalPrice || offer.externalPrice,
      externalRating: offer.externalRating,
      externalReviewCount: offer.externalReviewCount || 0,
      isTracked: true,
      isSynthetic: false,
      lastSyncedAt: new Date(),
    },
  });
}

async function syncSeller(seller, query) {
  const provider = providers[seller];
  if (!provider) {
    return { seller, fetched: 0, imported: 0, error: 'Provider not configured' };
  }

  const url = provider.buildUrl(query);
  const { status, text, wrappedUrl } = await fetchViaJina(url);

  if (status !== 200) {
    return {
      seller,
      fetched: 0,
      imported: 0,
      error: `HTTP ${status} from ${wrappedUrl}`,
    };
  }

  if (seller === 'alibaba' && /SecurityCompromiseError|"code":451/i.test(text)) {
    return {
      seller,
      fetched: 0,
      imported: 0,
      error: 'Source blocked in current environment (451)',
    };
  }

  const parsed = provider.parse(text, query).slice(0, MAX_PER_SELLER);

  let imported = 0;
  for (const offer of parsed) {
    if (!offer.externalUrl || !offer.title || !offer.externalPrice) {
      continue;
    }
    await upsertOffer(offer);
    imported += 1;
  }

  return {
    seller,
    fetched: parsed.length,
    imported,
    error: null,
  };
}

async function main() {
  console.log(`Syncing marketplace offers. query="${DEFAULT_QUERY}", sellers=${SELLERS.join(',')}, maxPerSeller=${MAX_PER_SELLER}`);

  const results = [];
  for (const seller of SELLERS) {
    try {
      const result = await syncSeller(seller, DEFAULT_QUERY);
      results.push(result);
      if (result.error) {
        console.log(`- ${seller}: ERROR ${result.error}`);
      } else {
        console.log(`- ${seller}: fetched=${result.fetched}, imported=${result.imported}`);
      }
    } catch (error) {
      results.push({ seller, fetched: 0, imported: 0, error: error.message });
      console.log(`- ${seller}: ERROR ${error.message}`);
    }
  }

  const importedTotal = results.reduce((sum, r) => sum + (r.imported || 0), 0);
  const withErrors = results.filter((r) => r.error);

  console.log(`Done. Total imported=${importedTotal}`);
  if (withErrors.length) {
    console.log('Errors:');
    withErrors.forEach((r) => console.log(`  * ${r.seller}: ${r.error}`));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
