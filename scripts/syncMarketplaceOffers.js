const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_QUERY = process.env.SEARCH_QUERY || 'coffee';
const MAX_PER_SELLER = Math.max(1, Number(process.env.MAX_PER_SELLER || 120));
const SELLERS = (process.env.SELLERS || 'daraz,chaldal,rokomari,startech,pickaboo,yellow,sailor,cats-eye,aliexpress,alibaba,amazon')
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

const REGISTERED_SOURCES = [
  'daraz',
  'evaly',
  'ajkerdeal',
  'priyoshop',
  'othoba',
  'bagdoom',
  'clickbd',
  'bdstall',
  'unikart',
  'meena-click',
  'bikroy',
  'chaldal',
  'shwapno',
  'rokomari',
  'boighar',
  'pickaboo',
  'startech',
  'ryans',
  'techland-bd',
  'gadget-and-gear',
  'aarong',
  'yellow',
  'sailor',
  'cats-eye',
  'ecstasy',
  'easy',
  'milan',
  'top-ten',
  'shajgoj',
  'beauty-booth-bd',
  'bbb',
  'livewire',
  'take-and-talks-bd',
  'alibaba',
  'aliexpress',
  'amazon',
];

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
const unsupportedProvider = (buildUrl, reason) => ({ buildUrl, parse: () => [], unsupportedReason: reason });

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

async function fetchDirect(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });

  const text = await response.text();
  return { status: response.status, text, wrappedUrl: url };
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

function parseStartech(markdown, query) {
  const offers = [];
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/www\.startech\.com\.bd\/[^)]+)\)[\s\S]{0,300}?#### \[([^\]]+)\]\((https?:\/\/www\.startech\.com\.bd\/[^)]+)\)[\s\S]{0,220}?([0-9,]+)৳(?:([0-9,]+)৳)?/gi;

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

    const originalPrice = match[6] ? parsePrice(match[6]) : currentPrice;
    const url = match[4];
    const slug = url.split('/').pop() || url;

    offers.push({
      platform: 'startech',
      externalId: `startech-${shortHash(slug)}`,
      externalUrl: url,
      title,
      sellerName: 'Startech',
      imageUrl: match[1] || null,
      categoryName: 'Electronics',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseTechland(html, query) {
  const offers = [];
  const regex = /<a href="(https?:\/\/www\.techlandbd\.com\/[^"#?]+)">([^<]{12,})<\/a>[\s\S]{0,7000}?<span class="text-red-600">৳\s*([0-9,]+)<\/span>(?:[\s\S]{0,220}?line-through">৳\s*([0-9,]+)<\/span>)?/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = normalizeText(match[1]);
    const title = normalizeText(match[2]);
    if (!url || !title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPrice = parsePrice(match[3]);
    if (currentPrice <= 0) {
      continue;
    }

    const originalPrice = match[4] ? parsePrice(match[4]) : currentPrice;
    const slug = url.split('/').pop() || url;
    const lead = html.slice(Math.max(0, match.index - 2200), match.index);
    const imageCandidates = [...lead.matchAll(/https:\/\/www\.techlandbd\.com\/cache\/images\/uploads\/products\/[^"\s<>]+/gi)];
    const imageUrl = imageCandidates.length ? imageCandidates[imageCandidates.length - 1][0] : null;

    offers.push({
      platform: 'techland-bd',
      externalId: `techland-${shortHash(slug)}`,
      externalUrl: url,
      title,
      sellerName: 'Techland BD',
      imageUrl,
      categoryName: 'Electronics',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parsePickaboo(markdown, query) {
  const offers = [];
  const queryTokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
  const broadPhoneQuery = /(phone|mobile|smartphone|android|iphone)/i.test(String(query || ''));
  const regex = /!\[Image\s+\d+:[^\]]*\]\((https?:\/\/[^)]+)\)[\s\S]{0,220}?####\s+([^\n\r]+?)\s+৳\s*([0-9,]+)(?:~~৳\s*([0-9,]+)~~)?[\s\S]{0,220}?\]\((https?:\/\/www\.pickaboo\.com\/product-detail\/[^)\s]+)\)/gi;
  const seen = new Set();

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[2]);
    const titleLower = title.toLowerCase();
    const relevant = broadPhoneQuery || queryTokens.some((token) => titleLower.includes(token));
    if (!title || !relevant) {
      continue;
    }

    const currentPrice = parsePrice(match[3]);
    if (currentPrice <= 0) {
      continue;
    }

    const originalPrice = match[4] ? parsePrice(match[4]) : currentPrice;
    const detailUrl = match[5].replace(/&amp;/g, '&');
    const slug = detailUrl.split('/').pop() || shortHash(detailUrl);
    const externalId = `pickaboo-${slug}`;
    if (seen.has(externalId)) {
      continue;
    }
    seen.add(externalId);

    offers.push({
      platform: 'pickaboo',
      externalId,
      externalUrl: detailUrl,
      title,
      sellerName: 'Pickaboo',
      imageUrl: match[1] || null,
      categoryName: 'Electronics',
      externalPrice: currentPrice,
      externalOriginalPrice: Math.max(originalPrice, currentPrice),
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

function parseAlibaba(markdown, query) {
  const offers = [];
  const regex = /\[!\[Image\s+\d+[^\]]*\]\((https?:\/\/s\.alicdn\.com\/[^)]+)\)\]\((https?:\/\/www\.alibaba\.com\/product-detail\/[^)\s]+)\)[\s\S]{0,280}?##\s+\[([^\]]+)\]\((https?:\/\/www\.alibaba\.com\/product-detail\/[^)\s]+)\)[\s\S]{0,220}?\[\$([0-9.,]+)(?:-([0-9.,]+))?/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const rawTitle = normalizeText(match[3]).replace(/!\[Image[^\]]*\]/g, '').trim();
    if (!rawTitle || !rawTitle.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const usdCurrent = parsePrice(match[5]);
    if (usdCurrent <= 0) {
      continue;
    }

    const usdUpper = match[6] ? parsePrice(match[6]) : usdCurrent;
    const bdtRate = 122;
    const currentPrice = Math.round(usdCurrent * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(usdUpper * bdtRate));

    const url = (match[4] || match[2]).replace(/&amp;/g, '&');
    const itemIdMatch = url.match(/_(\d+)\.html/i);
    const externalId = itemIdMatch ? `alibaba-${itemIdMatch[1]}` : `alibaba-${shortHash(url)}`;

    offers.push({
      platform: 'alibaba',
      externalId,
      externalUrl: url,
      title: rawTitle,
      sellerName: 'Alibaba Marketplace',
      imageUrl: match[1] || null,
      categoryName: 'Global Wholesale',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseAmazon(markdown, query) {
  const offers = [];
  const regex = /\[##\s+([^\]]+)\]\((https?:\/\/(?:www\.)?amazon\.[^)]*?\/dp\/\s*([A-Z0-9]{10})[^)]*)\)/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[1]);
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const url = (match[2] || '').replace(/\s+/g, '').replace(/&amp;/g, '&');
    if (!url || /aax-us-east-retail-direct/i.test(url)) {
      continue;
    }

    const nearText = markdown.slice(match.index, match.index + 6000);
    const priceMatch = nearText.match(/Price, product page\[\$([0-9,]+(?:\.[0-9]{1,2})?)(?:\$([0-9,]+(?:\.[0-9]{1,2})?))?/i);
    if (!priceMatch) {
      continue;
    }

    const usdCurrent = parsePrice(priceMatch[1]);
    if (usdCurrent <= 0) {
      continue;
    }

    const usdOriginal = priceMatch[2] ? parsePrice(priceMatch[2]) : usdCurrent;
    const bdtRate = 122;
    const currentPrice = Math.round(usdCurrent * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(usdOriginal * bdtRate));

    const lookBehind = markdown.slice(Math.max(0, match.index - 520), match.index);
    const imageMatches = [...lookBehind.matchAll(/!\[Image\s+\d+:[^\]]*\]\((https?:\/\/m\.media-amazon\.com\/[^)]+)\)/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : null;

    offers.push({
      platform: 'amazon',
      externalId: `amazon-${match[3]}`,
      externalUrl: url,
      title,
      sellerName: 'Amazon Marketplace',
      imageUrl,
      categoryName: 'Global Marketplace',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseBagdoom(markdown, query) {
  const offers = [];
  const regex = /### \[([^\]]+)\]\((https?:\/\/www\.bagdoom\.com\/product\/[^\s)]+)[^)]*\)(?:[\s\S]{0,120}?~~৳([0-9.,]+)~~)?[\s\S]{0,100}?৳([0-9.,]+)/gi;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[1]);
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPrice = parsePrice(match[4]);
    if (currentPrice <= 0) {
      continue;
    }

    const originalPrice = match[3] ? parsePrice(match[3]) : currentPrice;
    const url = match[2];
    const slug = url.split('/').pop() || url;

    offers.push({
      platform: 'bagdoom',
      externalId: `bagdoom-${shortHash(slug)}`,
      externalUrl: url,
      title,
      sellerName: 'Bagdoom Marketplace',
      imageUrl: null,
      categoryName: 'Marketplace',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseRyans(markdown, query) {
  const offers = [];
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/www\.ryans\.com\/storage\/products\/[^)]+)\)\]\((https?:\/\/www\.ryans\.com\/[^)\s]+)\)[\s\S]{0,260}?\[([^\]]+)\]\((https?:\/\/www\.ryans\.com\/[^)\s]+)\)[\s\S]{0,180}?Tk\s*([0-9,]+)(?:[\s\S]{0,140}?Regular Price[\s\S]{0,50}?Tk\s*([0-9,]+))?/gi;

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

    const originalPrice = match[6] ? parsePrice(match[6]) : currentPrice;
    const url = match[4] || match[2];
    const slug = url.split('/').pop() || url;

    offers.push({
      platform: 'ryans',
      externalId: `ryans-${shortHash(slug)}`,
      externalUrl: url,
      title,
      sellerName: 'Ryans Computers',
      imageUrl: match[1] || null,
      categoryName: 'Electronics',
      externalPrice: currentPrice,
      externalOriginalPrice: originalPrice,
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseShajgoj(markdown, query) {
  const offers = [];
  const queryTokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
  const regex = /!\[Image\s+\d+:[^\]]*\]\((https?:\/\/[^)]+)\)\s*([^\[]+?)\s+SALE\s+\?\s*([0-9]+(?:\.[0-9]{2})?)\?\s*([0-9]+(?:\.[0-9]{2})?)[\s\S]{0,120}?\]\((https?:\/\/shop\.shajgoj\.com\/product\/[^)\s]+)\)/gi;
  const seen = new Set();

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const title = normalizeText(match[2]);
    if (!title) {
      continue;
    }

    const titleLower = title.toLowerCase();
    const relevant = queryTokens.length === 0 || queryTokens.some((token) => titleLower.includes(token));
    if (!relevant) {
      continue;
    }

    const originalPrice = parsePrice(match[3]);
    const currentPrice = parsePrice(match[4]);
    if (currentPrice <= 0) {
      continue;
    }

    const externalUrl = match[5].replace(/&amp;/g, '&');
    const slug = externalUrl.split('/').pop() || shortHash(externalUrl);
    const externalId = `shajgoj-${slug}`;
    if (seen.has(externalId)) {
      continue;
    }
    seen.add(externalId);

    offers.push({
      platform: 'shajgoj',
      externalId,
      externalUrl,
      title,
      sellerName: 'Shajgoj',
      imageUrl: match[1] || null,
      categoryName: 'Beauty & Personal Care',
      externalPrice: currentPrice,
      externalOriginalPrice: Math.max(originalPrice, currentPrice),
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseYellow(html, query) {
  const offers = [];
  const regex = /<div class="product-item">[\s\S]{0,7000}?<a class="card-title[^"]*" href="([^"]+)">([\s\S]{1,160}?)<\/a>[\s\S]{0,1600}?<span class="price-item price-item--regular">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>[\s\S]{0,700}?(?:<span class="price-item price-item--sale">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>)?/gi;
  const seen = new Set();

  let match;
  while ((match = regex.exec(html)) !== null) {
    const title = normalizeText(match[2]).replace(/<[^>]*>/g, '').trim();
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const regularPrice = parsePrice(match[3]);
    const salePrice = match[4] ? parsePrice(match[4]) : regularPrice;
    const currentPrice = salePrice > 0 ? salePrice : regularPrice;
    if (currentPrice <= 0) {
      continue;
    }

    const externalUrl = (match[1] || '').startsWith('http')
      ? match[1]
      : `https://www.yellowclothing.net${match[1]}`;
    const slug = (externalUrl.split('?')[0].split('/').pop() || shortHash(externalUrl)).toLowerCase();
    const externalId = `yellow-${slug}`;
    if (seen.has(externalId)) {
      continue;
    }
    seen.add(externalId);

    const lead = html.slice(Math.max(0, match.index - 2500), match.index + 300);
    const imageMatches = [...lead.matchAll(/https:\/\/www\.yellowclothing\.net\/cdn\/shop\/files\/[^"\s<>]+/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][0] : null;

    offers.push({
      platform: 'yellow',
      externalId,
      externalUrl,
      title,
      sellerName: 'YELLOW Clothing',
      imageUrl,
      categoryName: 'Fashion',
      externalPrice: currentPrice,
      externalOriginalPrice: Math.max(regularPrice, currentPrice),
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseSailorApi(jsonText, query) {
  const offers = [];
  let payload;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    return offers;
  }

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const q = String(query || '').toLowerCase();
  for (const row of rows) {
    const title = normalizeText(row?.name);
    if (!title || !title.toLowerCase().includes(q)) {
      continue;
    }

    const currentPrice = Number(row?.main_price || 0);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      continue;
    }

    const originalPrice = Number(row?.stroked_price || currentPrice);
    const externalId = row?.id ? `sailor-${row.id}` : `sailor-${shortHash(`${title}-${currentPrice}`)}`;
    const slug = normalizeText(row?.slug);
    const externalUrl = slug ? `https://sailor.clothing/product/${slug}` : null;
    if (!externalUrl) {
      continue;
    }

    offers.push({
      platform: 'sailor',
      externalId,
      externalUrl,
      title,
      sellerName: 'Sailor',
      imageUrl: normalizeText(row?.thumbnail_image) || null,
      categoryName: 'Fashion',
      externalPrice: Math.round(currentPrice),
      externalOriginalPrice: Math.max(Math.round(originalPrice), Math.round(currentPrice)),
      externalRating: Number.isFinite(Number(row?.rating)) ? Number(row?.rating) : null,
      externalReviewCount: parseIntSafe(row?.sales || 0),
    });
  }

  return offers;
}

function parseCatsEye(html, query) {
  const offers = [];
  const regex = /<a class="product-item-link" href="(https?:\/\/catseye\.com\.bd\/catalog\/product\/view\/id\/\d+\/s\/[^"\s]+)"[^>]*>\s*([\s\S]{1,220}?)\s*<\/a>[\s\S]{0,1700}?id="product-price-\d+"\s+data-price-amount="([0-9.]+)"[\s\S]{0,700}?(?:id="old-price-\d+"\s+data-price-amount="([0-9.]+)")?/gi;
  const seen = new Set();

  let match;
  while ((match = regex.exec(html)) !== null) {
    const title = normalizeText(match[2]).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const currentPrice = Number(match[3]);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      continue;
    }

    const originalPrice = match[4] ? Number(match[4]) : currentPrice;
    const externalUrl = match[1].replace(/&amp;/g, '&');
    const idMatch = externalUrl.match(/\/id\/(\d+)\//i);
    const externalId = idMatch ? `cats-eye-${idMatch[1]}` : `cats-eye-${shortHash(externalUrl)}`;
    if (seen.has(externalId)) {
      continue;
    }
    seen.add(externalId);

    const lead = html.slice(Math.max(0, match.index - 2200), match.index + 250);
    const imageMatches = [...lead.matchAll(/data-src="(https?:\/\/catseye\.com\.bd\/pub\/media\/catalog\/product\/[^"\s]+)"/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : null;

    offers.push({
      platform: 'cats-eye',
      externalId,
      externalUrl,
      title,
      sellerName: 'Cats Eye',
      imageUrl,
      categoryName: 'Fashion',
      externalPrice: Math.round(currentPrice),
      externalOriginalPrice: Math.max(Math.round(originalPrice), Math.round(currentPrice)),
      externalRating: null,
      externalReviewCount: 0,
    });
  }

  return offers;
}

function parseEasyStoreApi(jsonText, query) {
  const offers = [];
  let payload;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    return offers;
  }

  const rows = Array.isArray(payload) ? payload : [];
  const queryLower = String(query || '').toLowerCase();
  const seen = new Set();

  for (const row of rows) {
    const title = normalizeText(row?.name);
    if (!title || !title.toLowerCase().includes(queryLower)) {
      continue;
    }

    const currentPrice = parsePrice(row?.prices?.price || row?.prices?.regular_price || row?.prices?.sale_price || '');
    if (currentPrice <= 0) {
      continue;
    }

    const originalPrice = parsePrice(row?.prices?.regular_price || row?.prices?.sale_price || row?.prices?.price || '') || currentPrice;
    const externalUrl = normalizeText(row?.permalink || row?.add_to_cart?.url || '');
    if (!externalUrl) {
      continue;
    }

    const id = normalizeText(row?.id);
    const externalId = id ? `easy-${id}` : `easy-${shortHash(externalUrl)}`;
    if (seen.has(externalId)) {
      continue;
    }
    seen.add(externalId);

    offers.push({
      platform: 'easy',
      externalId,
      externalUrl,
      title,
      sellerName: 'Easy Fashion',
      imageUrl: row?.images?.[0]?.src || row?.images?.[0]?.thumbnail || null,
      categoryName: row?.categories?.[0]?.name || 'Fashion',
      externalPrice: currentPrice,
      externalOriginalPrice: Math.max(originalPrice, currentPrice),
      externalRating: Number.isFinite(Number(row?.average_rating)) ? Number(row?.average_rating) : null,
      externalReviewCount: parseIntSafe(row?.review_count || 0),
    });
  }

  return offers;
}

const providers = {
  daraz: {
    buildUrl: (q) => `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(q)}`,
    parse: parseDaraz,
  },
  bagdoom: {
    buildUrl: (q) => `https://www.bagdoom.com/search?query=${encodeURIComponent(q)}`,
    parse: parseBagdoom,
  },
  chaldal: {
    buildUrl: (q) => `https://chaldal.com/search/${encodeURIComponent(q)}`,
    parse: parseChaldal,
  },
  rokomari: {
    buildUrl: (q) => `https://www.rokomari.com/search?term=${encodeURIComponent(q)}`,
    parse: parseRokomari,
  },
  ryans: {
    buildUrl: (q) => `https://www.ryans.com/search?q=${encodeURIComponent(q)}`,
    parse: parseRyans,
  },
  startech: {
    buildUrl: (q) => `https://www.startech.com.bd/product/search?search=${encodeURIComponent(q)}`,
    parse: parseStartech,
  },
  'techland-bd': {
    buildUrl: (q) => `https://www.techlandbd.com/index.php?route=product/search&search=${encodeURIComponent(q)}`,
    parse: parseTechland,
    fetch: fetchDirect,
  },
  alibaba: {
    buildUrl: (q) => `https://m.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`,
    parse: parseAlibaba,
  },
  aliexpress: {
    buildUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`,
    parse: parseAliExpress,
  },
  amazon: {
    buildUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    parse: parseAmazon,
  },
  evaly: unsupportedProvider((q) => `https://evaly.com.bd/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  ajkerdeal: unsupportedProvider((q) => `https://ajkerdeal.com/search?keyword=${encodeURIComponent(q)}`, 'Connector queued'),
  priyoshop: unsupportedProvider((q) => `https://priyoshop.com/search?keyword=${encodeURIComponent(q)}`, 'Connector queued'),
  othoba: unsupportedProvider((q) => `https://othoba.com/search?text=${encodeURIComponent(q)}`, 'Connector queued'),
  
  clickbd: unsupportedProvider((q) => `https://www.clickbd.com/search.php?q=${encodeURIComponent(q)}`, 'Connector queued'),
  bdstall: unsupportedProvider((q) => `https://www.bdstall.com/search/${encodeURIComponent(q)}`, 'Connector queued'),
  unikart: unsupportedProvider((q) => `https://unikart.com.bd/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  'meena-click': unsupportedProvider((q) => `https://meenaclick.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  bikroy: unsupportedProvider((q) => `https://bikroy.com/en/ads/bangladesh?query=${encodeURIComponent(q)}`, 'Connector queued'),
  shwapno: unsupportedProvider((q) => `https://www.shwapno.com/search?text=${encodeURIComponent(q)}`, 'Connector queued'),
  boighar: unsupportedProvider((q) => `https://boighar.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  pickaboo: {
    buildUrl: (q) => `https://www.pickaboo.com/product/${encodeURIComponent(String(q).trim().toLowerCase().replace(/\s+/g, '-'))}`,
    parse: parsePickaboo,
  },
  shajgoj: {
    buildUrl: (q) => `https://shop.shajgoj.com/search?type=product&q=${encodeURIComponent(q)}`,
    parse: parseShajgoj,
  },
  yellow: {
    buildUrl: (q) => `https://www.yellowclothing.net/search?q=${encodeURIComponent(q)}`,
    parse: parseYellow,
    fetch: fetchDirect,
  },
  sailor: {
    buildUrl: () => 'https://backend.sailor.clothing/api/v2/products/category/8',
    parse: parseSailorApi,
    fetch: fetchDirect,
  },
  'cats-eye': {
    buildUrl: (q) => `https://catseye.com.bd/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    parse: parseCatsEye,
    fetch: fetchDirect,
  },
  
  'gadget-and-gear': unsupportedProvider((q) => `https://gadgetandgear.com/search?type=product&q=${encodeURIComponent(q)}`, 'Connector queued'),
  aarong: unsupportedProvider((q) => `https://www.aarong.com/catalogsearch/result/?q=${encodeURIComponent(q)}`, 'Connector queued'),
  ecstasy: unsupportedProvider((q) => `https://ecstasybd.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  easy: {
    buildUrl: (q) => `https://easyfashion.com.bd/wp-json/wc/store/v1/products?search=${encodeURIComponent(q)}&per_page=60`,
    parse: parseEasyStoreApi,
    fetch: fetchDirect,
  },
  milan: unsupportedProvider((q) => `https://milan-bd.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  'top-ten': unsupportedProvider((q) => `https://topten.com.bd/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  'beauty-booth-bd': unsupportedProvider((q) => `https://beautybooth.com.bd/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  bbb: unsupportedProvider((q) => `https://bbb.com.bd/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  livewire: unsupportedProvider((q) => `https://livewirebd.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
  'take-and-talks-bd': unsupportedProvider((q) => `https://takeandtalksbd.com/search?q=${encodeURIComponent(q)}`, 'Connector queued'),
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

  if (provider.unsupportedReason) {
    return { seller, fetched: 0, imported: 0, error: provider.unsupportedReason };
  }

  const urls =
    seller === 'alibaba'
      ? [
          provider.buildUrl(query),
          `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodeURIComponent(query)}`,
          `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`,
        ]
      : seller === 'pickaboo'
        ? [
            'https://www.pickaboo.com/product/smartphone',
            provider.buildUrl(query),
          ]
      : seller === 'shajgoj'
        ? [
            provider.buildUrl(query),
            `https://shop.shajgoj.com/product-category/${encodeURIComponent(String(query).trim().toLowerCase().replace(/\s+/g, '-'))}/`,
            'https://shop.shajgoj.com/product-category/face/',
          ]
      : seller === 'sailor'
        ? [
            'https://backend.sailor.clothing/api/v2/products/category/8',
            'https://backend.sailor.clothing/api/v2/products/category/9',
            'https://backend.sailor.clothing/api/v2/products/category/12',
            'https://backend.sailor.clothing/api/v2/products/category/100',
            'https://backend.sailor.clothing/api/v2/products/category/136',
            'https://backend.sailor.clothing/api/v2/products/category/225',
          ]
      : seller === 'cats-eye'
        ? [
            provider.buildUrl(query),
            `https://www.catseye.com.bd/catalogsearch/result/?q=${encodeURIComponent(query)}`,
          ]
      : [provider.buildUrl(query)];

  let status = 0;
  let text = '';
  let wrappedUrl = '';

  for (const url of urls) {
    const fetchFn = provider.fetch || fetchViaJina;
    const res = await fetchFn(url);
    status = res.status;
    text = res.text;
    wrappedUrl = res.wrappedUrl;

    const blockedAlibaba = seller === 'alibaba' && (status === 451 || /SecurityCompromiseError|"code":451/i.test(text));
    if (blockedAlibaba) {
      continue;
    }

    if (status === 200) {
      if (seller === 'shajgoj') {
        const probeParsed = provider.parse(text, query);
        if (!probeParsed.length) {
          continue;
        }
      }
      break;
    }
  }

  if (seller === 'alibaba' && (status === 451 || /SecurityCompromiseError|"code":451/i.test(text))) {
    return {
      seller,
      fetched: 0,
      imported: 0,
      error: null,
    };
  }

  if (status !== 200) {
    return {
      seller,
      fetched: 0,
      imported: 0,
      error: `HTTP ${status} from ${wrappedUrl}`,
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
  console.log(`Registered sources: ${REGISTERED_SOURCES.length}`);
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
