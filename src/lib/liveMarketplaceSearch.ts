const parseTopTenShopify = (jsonText: string, query: string, max: number): LiveOffer[] => {
  // Parse Shopify JSON API response (common format for Shopify stores)
  const offers: LiveOffer[] = [];
  const seen = new Set<string>();
  
  try {
    // Try to parse as JSON
    let data: any;
    try {
      data = JSON.parse(jsonText);
    } catch {
      // If JSON parse fails, return empty array
      return [];
    }
    
    // Handle different Shopify API response formats
    const products = data.products || data.resources?.products || [];
    
    if (!Array.isArray(products)) return [];
    
    for (const product of products) {
      if (offers.length >= max) break;
      if (!product || typeof product !== 'object') continue;
      
      const title = product.title || product.name || '';
      if (!title || !matchesQuery(title, query) || title.length < 5 || title.length > 200) continue;
      
      // Get price from variants or variants default price
      let price = 0;
      if (product.variants && Array.isArray(product.variants) && product.variants[0]) {
        price = product.variants[0].price || product.variants[0].cost || 0;
      } else if (product.price) {
        price = product.price;
      }
      
      if (typeof price === 'string') {
        price = parsePrice(String(price));
      } else if (typeof price === 'number') {
        price = Math.round(price);
      } else {
        continue;
      }
      
      if (price <= 0) continue;
      
      const { handle, id } = product;
      const productId = handle || id || title.toLowerCase().replace(/\s+/g, '-');
      if (seen.has(productId)) continue;
      seen.add(productId);
      
      const imageUrl = product.featured_image?.src || product.image?.src || '';
      const externalUrl = product.url || `https://toptenmartltd.com/products/${handle}`;
      
      offers.push({
        platform: 'top-ten',
        sellerType: 'DOMESTIC',
        title,
        externalUrl,
        imageUrl,
        currentPrice: price,
        originalPrice: price,
        discountVerified: false,
        sellerName: 'Top Ten Mart',
      });
    }
  } catch (error) {
    // Silently fail and return empty array
  }
  
  return offers;
};

type SellerType = 'DOMESTIC' | 'INTERNATIONAL';

export type LiveOffer = {
  platform: string;
  sellerType: SellerType;
  title: string;
  externalUrl: string;
  imageUrl?: string;
  currentPrice: number;
  originalPrice: number;
  discountVerified: boolean;
  sellerName: string;
};

const parsePrice = (value: string) => {
  const num = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const matchesQuery = (title: string, query: string) => {
  const titleNorm = normalize(title);
  const queryNorm = normalize(query);
  if (!queryNorm) return true;
  if (titleNorm.includes(queryNorm)) return true;

  const tokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  if (!tokens.length) return false;
  return tokens.every((token) => title.toLowerCase().includes(token));
};

const fetchViaJina = async (url: string) => {
  const wrapped = `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  const res = await fetch(wrapped, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const text = await res.text();
  return { status: res.status, text };
};

const fetchDirect = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const text = await res.text();
  return { status: res.status, text };
};


const parseChaldal = (markdown: string, query: string, max: number): LiveOffer[] => {
  const lines = markdown.split(/\r?\n/).map((l) => l.trim());
  const offers: LiveOffer[] = [];

  for (let i = 0; i < lines.length && offers.length < max; i += 1) {
    const line = lines[i];
    if (!line.startsWith('![Image') || !line.includes('i.chaldn.com')) continue;

    const imageMatch = line.match(/\((https?:\/\/[^)]+)\)/);
    let price = 0;
    let title = '';

    for (let j = i + 1; j < Math.min(i + 16, lines.length); j += 1) {
      const candidate = lines[j];
      if (!candidate) continue;

      if (!price && /^৳$/.test(candidate)) {
        for (let k = j + 1; k < Math.min(i + 18, lines.length); k += 1) {
          const parsed = parsePrice(lines[k]);
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

    title = title.trim();
    if (!title || !matchesQuery(title, query) || price <= 0) continue;

    offers.push({
      platform: 'chaldal',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: `https://chaldal.com/search/${encodeURIComponent(title)}`,
      imageUrl: imageMatch?.[1],
      currentPrice: price,
      originalPrice: price,
      discountVerified: false,
      sellerName: 'Chaldal',
    });
  }

  return offers;
};

const parseRokomari = (markdown: string, query: string, max: number): LiveOffer[] => {
  // Robust parser for Rokomari - flexible line-by-line approach
  const lines = markdown.split(/\r?\n/).map((l) => l.trim());
  const offers: LiveOffer[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length && offers.length < max; i++) {
    const line = lines[i];
    
    // Look for markdown links [text](url)
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;
    
    let title = linkMatch[1];
    let url = linkMatch[2];
    
    // Clean up title and remove image placeholders
    title = title.replace(/[#*_`\[\]!]/g, '').replace(/^Image\s+\d+:\s*/i, '').trim();
    
    // Must be rokomari URL or contain search term
    if (!url.includes('rokomari.com') && !matchesQuery(title, query)) continue;
    if (!title || title.match(/^image/i) || title.length < 5 || title.length > 200) continue;
    
    // If not rokomari URL yet, keep looking
    if (!url.includes('rokomari.com')) {
      let foundRokomariUrl = false;
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLink = lines[j].match(/\[(.*?)\]\((https?:\/\/www\.rokomari\.com\/[^)]+)\)/);
        if (nextLink) {
          url = nextLink[2];
          foundRokomariUrl = true;
          break;
        }
      }
      if (!foundRokomariUrl) continue;
    }
    
    if (!matchesQuery(title, query)) continue;
    
    // Look for price (TK. format)
    let price = 0;
    let imageUrl = '';
    
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 10); j++) {
      const priceLine = lines[j];
      
      // Look for TK. or ৳ price
      if (priceLine.includes('TK.') || priceLine.includes('৳')) {
        const priceMatch = priceLine.match(/(?:TK\.|৳)\s*([0-9,]+)/);
        if (priceMatch) {
          price = parsePrice(priceMatch[1]);
          if (price > 0) break;
        }
      }
      
      // Look for image
      if (!imageUrl && priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i)) {
        imageUrl = priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i)?.[0] || '';
      }
    }
    
    if (price < 50) continue;
    
    const key = url.split('/').pop() || title;
    if (seen.has(key)) continue;
    seen.add(key);
    
    offers.push({
      platform: 'rokomari',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: url,
      imageUrl,
      currentPrice: price,
      originalPrice: price,
      discountVerified: false,
      sellerName: 'Rokomari',
    });
  }

  return offers;
};

const parseStartech = (markdown: string, query: string, max: number): LiveOffer[] => {
  // Robust parser for Startech - flexible approach
  const lines = markdown.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
  const offers: LiveOffer[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length && offers.length < max; i++) {
    const line = lines[i];
    
    // Look for markdown links [text](url)
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;
    
    let title = linkMatch[1];
    const url = linkMatch[2];
    
    // Clean up title and filter out image references
    title = title.replace(/[#*_`\[\]!]/g, '').replace(/^Image\s+\d+:\s*/i, '').trim();
    
    // Skip if it's just "Image" or invalid title
    if (!title || title.match(/^image/i) || title.length < 5 || title.length > 200) continue;
    
    // Check if this is a startech product URL or matches query
    if (!url.includes('startech.com')) continue;
    if (!matchesQuery(title, query)) continue;
    
    // Skip cache/image URLs
    if (url.includes('/cache/') || url.includes('image.cache') || !url.includes('/product')) continue;
    
    // Look for price in surrounding lines
    let price = 0;
    let imageUrl = '';
    
    for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 12); j++) {
      const priceLine = lines[j];
      
      // Look for ৳ price format
      if (priceLine.includes('৳')) {
        const priceMatch = priceLine.match(/([0-9,]+)\s*৳/);
        if (priceMatch) {
          price = parsePrice(priceMatch[1]);
          if (price > 100) break; // Reasonable min price
        }
      }
      
      // Look for image (but skip cache URLs)
      if (!imageUrl && priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i) && !priceLine.includes('/cache/')) {
        imageUrl = priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i)?.[0] || '';
      }
    }
    
    if (price <= 0) continue;
    
    const key = `${title}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    offers.push({
      platform: 'startech',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: url.split('?')[0].split('#')[0], // Remove query params
      imageUrl,
      currentPrice: price,
      originalPrice: price,
      discountVerified: false,
      sellerName: 'Startech',
    });
  }

  return offers;
};

const parseTechland = (html: string, query: string, max: number): LiveOffer[] => {
  const regex = /<a href="(https?:\/\/www\.techlandbd\.com\/[^"#?]+)">([^<]{12,})<\/a>[\s\S]{0,7000}?<span class="text-red-600">৳\s*([0-9,]+)<\/span>(?:[\s\S]{0,220}?line-through">৳\s*([0-9,]+)<\/span>)?/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(html)) !== null && offers.length < max) {
    const title = String(m[2] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[3]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[4] ? parsePrice(m[4]) : currentPrice;
    const lead = html.slice(Math.max(0, m.index - 2200), m.index);
    const imageMatches = [...lead.matchAll(/https:\/\/www\.techlandbd\.com\/cache\/images\/uploads\/products\/[^"\s<>]+/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][0] : undefined;

    offers.push({
      platform: 'techland-bd',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: m[1],
      imageUrl,
      currentPrice,
      originalPrice,
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Techland BD',
    });
  }

  return offers;
};

const parsePickaboo = (markdown: string, query: string, max: number): LiveOffer[] => {
  // Robust parser for Pickaboo - more flexible approach
  const offers: LiveOffer[] = [];
  const lines = markdown.split(/\r?\n/).map((l) => l.trim());
  const seen = new Set<string>();

  for (let i = 0; i < lines.length && offers.length < max; i++) {
    const line = lines[i];
    
    // Look for markdown links - could be to pickaboo or any product URL
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;
    
    let title = linkMatch[1];
    const url = linkMatch[2];
    
    // Clean up title formatting
    title = title.replace(/<[^>]+>/g, '').replace(/[#*_`]/g, '').trim();
    
    // Must contain query
    if (!matchesQuery(title, query) || title.length < 5 || title.length > 200) continue;
    
    // Look for price in surrounding lines
    let price = 0;
    let imageUrl = '';
    
    for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 12); j++) {
      const priceLine = lines[j];
      
      // Look for various price patterns
      let priceMatch = priceLine.match(/[৳]\s*([0-9,]+)/);
      if (priceMatch) {
        price = parsePrice(priceMatch[1]);
        if (price > 0) break;
      }
      
      // Also try strikethrough price format for original price
      if (!imageUrl && (priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i) || priceLine.includes('![Image'))) {
        imageUrl = priceLine.match(/https?:\/\/[^\s)]*\.(?:jpg|jpeg|png|webp)/i)?.[0] || '';
      }
    }
    
    if (price <= 0) continue;
    
    // Deduplicate by URL
    const key = url.split('/').pop() || title;
    if (seen.has(key)) continue;
    seen.add(key);
    
    offers.push({
      platform: 'pickaboo',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: url.replace(/&amp;/g, '&'),
      imageUrl,
      currentPrice: price,
      originalPrice: price,
      discountVerified: false,
      sellerName: 'Pickaboo',
    });
  }

  return offers;
};

const parseAliExpress = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /!\[Image\s+\d+[^\]]*\]\((https?:\/\/[^)]*aliexpress-media[^)]+)\)[\s\S]{0,600}?###\s+([^\n$]+?)\s+\$\s*([0-9.,]+)(?:\s+\$\s*([0-9.,]+))?[\s\S]{0,800}?\]\((https?:\/\/www\.aliexpress\.[^)\s]+)\)/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[2] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const usdCurrent = parsePrice(m[3]);
    if (usdCurrent <= 0) continue;

    const usdOriginal = m[4] ? parsePrice(m[4]) : usdCurrent;
    const bdtRate = 122;
    const currentPrice = Math.round(usdCurrent * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(usdOriginal * bdtRate));

    offers.push({
      platform: 'aliexpress',
      sellerType: 'INTERNATIONAL',
      title,
      externalUrl: String(m[5] || '').replace(/&amp;/g, '&'),
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: usdOriginal > usdCurrent,
      sellerName: 'AliExpress Marketplace',
    });
  }

  return offers;
};

const parseAlibaba = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /\[!\[Image\s+\d+[^\]]*\]\((https?:\/\/s\.alicdn\.com\/[^)]+)\)\]\((https?:\/\/www\.alibaba\.com\/product-detail\/[^)\s]+)\)[\s\S]{0,280}?##\s+\[([^\]]+)\]\((https?:\/\/www\.alibaba\.com\/product-detail\/[^)\s]+)\)[\s\S]{0,220}?\[\$([0-9.,]+)(?:-([0-9.,]+))?/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[3] || '').replace(/!\[Image[^\]]*\]/g, '').trim();
    if (!matchesQuery(title, query)) continue;

    const usdCurrent = parsePrice(m[5]);
    if (usdCurrent <= 0) continue;

    const usdUpper = m[6] ? parsePrice(m[6]) : usdCurrent;
    const bdtRate = 122;
    const currentPrice = Math.round(usdCurrent * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(usdUpper * bdtRate));

    offers.push({
      platform: 'alibaba',
      sellerType: 'INTERNATIONAL',
      title,
      externalUrl: String(m[4] || m[2] || '').replace(/&amp;/g, '&'),
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: false,
      sellerName: 'Alibaba Marketplace',
    });
  }

  return offers;
};

const parseAmazon = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /\[##\s+([^\]]+)\]\((https?:\/\/(?:www\.)?amazon\.[^)]*?\/dp\/\s*([A-Z0-9]{10})[^)]*)\)/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[1] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const externalUrl = String(m[2] || '').replace(/\s+/g, '').replace(/&amp;/g, '&');
    if (!externalUrl || /aax-us-east-retail-direct/i.test(externalUrl)) continue;

    const nearText = markdown.slice(m.index, m.index + 6000);
    const priceMatch = nearText.match(/Price, product page\[\$([0-9,]+(?:\.[0-9]{1,2})?)(?:\$([0-9,]+(?:\.[0-9]{1,2})?))?/i);
    if (!priceMatch) continue;

    const usdCurrent = parsePrice(priceMatch[1]);
    if (usdCurrent <= 0) continue;

    const usdOriginal = priceMatch[2] ? parsePrice(priceMatch[2]) : usdCurrent;
    const bdtRate = 122;
    const currentPrice = Math.round(usdCurrent * bdtRate);
    const originalPrice = Math.max(currentPrice, Math.round(usdOriginal * bdtRate));

    const lookBehind = markdown.slice(Math.max(0, m.index - 520), m.index);
    const imageMatches = [...lookBehind.matchAll(/!\[Image\s+\d+:[^\]]*\]\((https?:\/\/m\.media-amazon\.com\/[^)]+)\)/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : undefined;

    offers.push({
      platform: 'amazon',
      sellerType: 'INTERNATIONAL',
      title,
      externalUrl,
      imageUrl,
      currentPrice,
      originalPrice,
      discountVerified: usdOriginal > usdCurrent,
      sellerName: 'Amazon Marketplace',
    });
  }

  return offers;
};

const parseBagdoom = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /### \[([^\]]+)\]\((https?:\/\/www\.bagdoom\.com\/product\/[^\s)]+)[^)]*\)(?:[\s\S]{0,120}?~~৳([0-9.,]+)~~)?[\s\S]{0,100}?৳([0-9.,]+)/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[1] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[4]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[3] ? parsePrice(m[3]) : currentPrice;

    offers.push({
      platform: 'bagdoom',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: m[2],
      imageUrl: undefined,
      currentPrice,
      originalPrice,
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Bagdoom Marketplace',
    });
  }

  return offers;
};

const parseRyans = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/www\.ryans\.com\/storage\/products\/[^)]+)\)\]\((https?:\/\/www\.ryans\.com\/[^)\s]+)\)[\s\S]{0,260}?\[([^\]]+)\]\((https?:\/\/www\.ryans\.com\/[^)\s]+)\)[\s\S]{0,180}?Tk\s*([0-9,]+)(?:[\s\S]{0,140}?Regular Price[\s\S]{0,50}?Tk\s*([0-9,]+))?/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[3] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[5]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[6] ? parsePrice(m[6]) : currentPrice;
    const url = m[4] || m[2];

    offers.push({
      platform: 'ryans',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: url,
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Ryans Computers',
    });
  }

  return offers;
};

const parseShajgoj = (markdown: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  const queryTokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
  const regex = /!\[Image\s+\d+:[^\]]*\]\((https?:\/\/[^)]+)\)\s*([^\[]+?)\s+SALE\s+\?\s*([0-9]+(?:\.[0-9]{2})?)\?\s*([0-9]+(?:\.[0-9]{2})?)[\s\S]{0,120}?\]\((https?:\/\/shop\.shajgoj\.com\/product\/[^)\s]+)\)/gi;
  const seen = new Set<string>();

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[2] || '').trim();
    if (!title) continue;

    const titleLower = title.toLowerCase();
    const relevant = queryTokens.length === 0 || matchesQuery(title, query) || queryTokens.some((token) => titleLower.includes(token));
    if (!relevant) continue;

    const originalPrice = parsePrice(m[3]);
    const currentPrice = parsePrice(m[4]);
    if (currentPrice <= 0) continue;

    const externalUrl = String(m[5] || '').replace(/&amp;/g, '&');
    const key = externalUrl.split('/').pop() || titleLower;
    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      platform: 'shajgoj',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl: m[1],
      currentPrice,
      originalPrice: Math.max(originalPrice, currentPrice),
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Shajgoj',
    });
  }

  return offers;
};

const parseYellow = (html: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  const regex = /<div class="product-item">[\s\S]{0,7000}?<a class="card-title[^"]*" href="([^"]+)">([\s\S]{1,160}?)<\/a>[\s\S]{0,1600}?<span class="price-item price-item--regular">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>[\s\S]{0,700}?(?:<span class="price-item price-item--sale">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>)?/gi;
  const seen = new Set<string>();

  let m;
  while ((m = regex.exec(html)) !== null && offers.length < max) {
    const title = String(m[2] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!title || !matchesQuery(title, query)) continue;

    const regularPrice = parsePrice(m[3]);
    const salePrice = m[4] ? parsePrice(m[4]) : regularPrice;
    const currentPrice = salePrice > 0 ? salePrice : regularPrice;
    if (currentPrice <= 0) continue;

    const externalUrl = String(m[1] || '').startsWith('http')
      ? String(m[1])
      : `https://www.yellowclothing.net${String(m[1] || '')}`;
    const key = externalUrl.split('?')[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const lead = html.slice(Math.max(0, m.index - 2500), m.index + 300);
    const imageMatches = [...lead.matchAll(/https:\/\/www\.yellowclothing\.net\/cdn\/shop\/files\/[^"\s<>]+/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][0] : undefined;

    offers.push({
      platform: 'yellow',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl,
      currentPrice,
      originalPrice: Math.max(regularPrice, currentPrice),
      discountVerified: regularPrice > currentPrice,
      sellerName: 'YELLOW Clothing',
    });
  }

  return offers;
};

const parseSailorApi = (jsonText: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  let payload: unknown;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    return offers;
  }

  const rows = Array.isArray((payload as { data?: unknown[] })?.data)
    ? ((payload as { data: unknown[] }).data as Array<Record<string, unknown>>)
    : [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (offers.length >= max) return offers;

    const title = String(row.name || '').trim();
    if (!title || !matchesQuery(title, query)) continue;

    const currentRaw = Number(row.main_price || 0);
    if (!Number.isFinite(currentRaw) || currentRaw <= 0) continue;

    const originalRaw = Number(row.stroked_price || currentRaw);
    const slug = String(row.slug || '').trim();
    const id = String(row.id || '').trim();
    const key = id || slug || title.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    offers.push({
      platform: 'sailor',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: slug ? `https://sailor.clothing/product/${slug}` : `https://sailor.clothing/search?search=${encodeURIComponent(title)}`,
      imageUrl: String(row.thumbnail_image || '') || undefined,
      currentPrice: Math.round(currentRaw),
      originalPrice: Math.max(Math.round(originalRaw), Math.round(currentRaw)),
      discountVerified: originalRaw > currentRaw,
      sellerName: 'Sailor',
    });
  }

  return offers;
};

const parseCatsEye = (html: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  const regex = /<a class="product-item-link" href="(https?:\/\/catseye\.com\.bd\/catalog\/product\/view\/id\/\d+\/s\/[^"\s]+)"[^>]*>\s*([\s\S]{1,220}?)\s*<\/a>[\s\S]{0,1700}?id="product-price-\d+"\s+data-price-amount="([0-9.]+)"[\s\S]{0,700}?(?:id="old-price-\d+"\s+data-price-amount="([0-9.]+)")?/gi;
  const seen = new Set<string>();

  let m;
  while ((m = regex.exec(html)) !== null && offers.length < max) {
    const title = String(m[2] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || !matchesQuery(title, query)) continue;

    const currentRaw = Number(m[3]);
    if (!Number.isFinite(currentRaw) || currentRaw <= 0) continue;

    const originalRaw = m[4] ? Number(m[4]) : currentRaw;
    const externalUrl = String(m[1] || '').replace(/&amp;/g, '&');
    const key = externalUrl.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const lead = html.slice(Math.max(0, m.index - 2200), m.index + 250);
    const imageMatches = [...lead.matchAll(/data-src="(https?:\/\/catseye\.com\.bd\/pub\/media\/catalog\/product\/[^"\s]+)"/gi)];
    const imageUrl = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : undefined;

    offers.push({
      platform: 'cats-eye',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl,
      currentPrice: Math.round(currentRaw),
      originalPrice: Math.max(Math.round(originalRaw), Math.round(currentRaw)),
      discountVerified: originalRaw > currentRaw,
      sellerName: 'Cats Eye',
    });
  }

  return offers;
};

const parseEasyStoreApi = (jsonText: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  let payload: unknown;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    return offers;
  }

  const rows = Array.isArray(payload) ? (payload as Array<Record<string, unknown>>) : [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (offers.length >= max) return offers;

    const title = String(row?.name || '').trim();
    if (!title || !matchesQuery(title, query)) continue;

    const prices = (row?.prices || {}) as Record<string, unknown>;
    const currentPrice = parsePrice(String(prices.price || prices.regular_price || prices.sale_price || '0'));
    if (currentPrice <= 0) continue;

    const originalPrice = parsePrice(String(prices.regular_price || prices.sale_price || prices.price || '0')) || currentPrice;
    const externalUrl = String(row?.permalink || '').trim();
    if (!externalUrl) continue;

    const key = String(row?.id || externalUrl).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const images = Array.isArray(row?.images) ? (row.images as Array<Record<string, unknown>>) : [];
    const imageUrl = String(images[0]?.src || images[0]?.thumbnail || '').trim() || undefined;

    offers.push({
      platform: 'easy',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl,
      currentPrice,
      originalPrice: Math.max(originalPrice, currentPrice),
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Easy Fashion',
    });
  }

  return offers;
};

const parseDaraz = (markdown: string, query: string, max: number): LiveOffer[] => {
  // Fallback: If markdown is short or doesn't have expected format, return nothing
  if (!markdown || markdown.length < 100) return [];
  
  // More robust parser - try multiple approaches
  const lines = markdown.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && l.length > 2);
  const offers: LiveOffer[] = [];
  const seen = new Set<string>();
  
  // Approach 1: Look for markdown links [text](url) with nearby prices
  for (let i = 0; i < lines.length && offers.length < max; i++) {
    const line = lines[i];
    
    // Skip image markdown and meta lines
    if (line.startsWith('![') || line.startsWith('> ') || line === '') continue;
    
    // Look for markdown links [text](url)
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;
    
    let title = linkMatch[1];
    const url = linkMatch[2];
    
    // Clean up title and validate
    title = title.replace(/[#*_`\[\]!]/g, '').replace(/^Image\s+\d+:\s*/i, '').trim();
    if (!title || title.match(/^image/i) || !matchesQuery(title, query) || title.length < 5 || title.length > 200) continue;
    if (!url.includes('daraz')) continue; // Must be daraz URL
    
    // Look for price nearby
    let price = 0;
    let imageUrl = '';
    
    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 15); j++) {
      if (j === i) continue;
      const priceLine = lines[j];
      
      // Look for ৳ price
      if (priceLine.includes('৳')) {
        const priceMatch = priceLine.match(/৳\s*([0-9,]+)/);
        if (priceMatch) {
          price = parsePrice(priceMatch[1]);
          if (price > 100) break; // Filter out prices that are too low
        }
      }
      
      // Look for image URLs (prioritize content images, not meta)
      if (!imageUrl && priceLine.match(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)/i)) {
        imageUrl = priceLine.match(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)/i)?.[0] || '';
      }
    }
    
    if (price > 100) { // Reasonable minimum for BD market
      const key = `${title}|${price}`;
      if (!seen.has(key)) {
        seen.add(key);
        offers.push({
          platform: 'daraz',
          sellerType: 'DOMESTIC',
          title,
          externalUrl: url.split('?')[0].split('#')[0],
          imageUrl,
          currentPrice: price,
          originalPrice: price,
          discountVerified: false,
          sellerName: 'Daraz',
        });
      }
    }
  }
  
  // Approach 2: If limited results, look for daraz URLs directly  
  if (offers.length < max * 0.5) {
    const urlRegex = /https?:\/\/www\.daraz\.com\.bd\/[^\s)]+/g;
    let match;
    while ((match = urlRegex.exec(markdown)) !== null && offers.length < max) {
      const url = match[0];
      
      // Find title: look before the URL in a reasonable window
      const beforeUrl = markdown.substring(Math.max(0, match.index - 500), match.index);
      const titleMatches = beforeUrl.match(/\[([^\]]{10,200})\]\s*(?:\(|$)/);
      if (!titleMatches) continue;
      
      let title = titleMatches[1].replace(/[#*_`\[\]!]/g, '').replace(/^Image\s+\d+:\s*/i, '').trim();
      if (!title || title.match(/^image/i) || !matchesQuery(title, query)) continue;
      
      // Find price after URL
      const afterUrl = markdown.substring(match.index, Math.min(markdown.length, match.index + 500));
      const priceMatch = afterUrl.match(/৳\s*([0-9,]+)/);
      if (!priceMatch) continue;
      
      const price = parsePrice(priceMatch[1]);
      if (price > 100) {
        const key = `${title}|${price}`;
        if (!seen.has(key)) {
          seen.add(key);
          offers.push({
            platform: 'daraz',
            sellerType: 'DOMESTIC',
            title,
            externalUrl: url.split('?')[0].split('#')[0],
            imageUrl: '',
            currentPrice: price,
            originalPrice: price,
            discountVerified: false,
            sellerName: 'Daraz',
          });
        }
      }
    }
  }

  return offers;
};
const parseComputerSource = (html: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  const blockRegex = /<div class="product-wrap">[\s\S]{0,12000}?<\/div>\s*<\/div>/gi;
  const seen = new Set<string>();

  let m;
  while ((m = blockRegex.exec(html)) !== null && offers.length < max) {
    const block = m[0];
    const nameMatch = block.match(/<h4 class="name">\s*<a href="(https?:\/\/computersource\.com\.bd\/[^"\s]+)">([\s\S]{1,220}?)<\/a>/i);
    if (!nameMatch) continue;

    const externalUrl = String(nameMatch[1] || '').trim().replace(/&amp;/g, '&');
    const title = String(nameMatch[2] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || !matchesQuery(title, query)) continue;

    const priceNewMatch = block.match(/class="price-new\s+price"[\s\S]{0,180}?<span>([0-9,]+)<\/span>/i);
    const priceFallbackMatch = block.match(/class="price"[^>]*>[\s\S]{0,120}?<span>([0-9,]+)<\/span>/i);
    const currentPrice = parsePrice((priceNewMatch?.[1] || priceFallbackMatch?.[1] || '').trim());
    if (currentPrice <= 0) continue;

    const oldPriceMatch = block.match(/class="price-old\s+price"[\s\S]{0,180}?<span>([0-9,]+)<\/span>/i);
    const originalPrice = parsePrice(String(oldPriceMatch?.[1] || '')) || currentPrice;
    const key = externalUrl.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const imageMatch = block.match(/<img\s+src="(https?:\/\/computersource\.com\.bd\/[^"\s]+)"/i);

    offers.push({
      platform: 'computersource',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl: imageMatch?.[1],
      currentPrice,
      originalPrice: Math.max(originalPrice, currentPrice),
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Computer Source',
    });
  }

  return offers;
};

const parseGhorerbazar = (html: string, query: string, max: number): LiveOffer[] => {
  const offers: LiveOffer[] = [];
  const blockRegex = /<div class="tp-product-card">[\s\S]{0,12000}?<\/div>\s*<\/div>/gi;
  const seen = new Set<string>();

  let m;
  while ((m = blockRegex.exec(html)) !== null && offers.length < max) {
    const block = m[0];
    const urlMatch = block.match(/<a href="(https?:\/\/ghorerbazar\.com\/products\/[^"\s]+)"\s+class="tp-product-img"/i);
    const titleMatch = block.match(/class="tp-product-title">([\s\S]{1,220}?)<\/a>/i);
    const externalUrl = String(urlMatch?.[1] || '').trim().replace(/&amp;/g, '&');
    const title = String(titleMatch?.[1] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!externalUrl || !title || !matchesQuery(title, query)) continue;

    const discountPriceMatch = block.match(/class="(?:disct-price|new-price)">[^0-9]*([0-9,]+)</i);
    const regularPriceMatch = block.match(/class="(?:main-price|old-price)">[^0-9]*([0-9,]+)</i);
    const currentPrice = parsePrice(String(discountPriceMatch?.[1] || ''));
    if (currentPrice <= 0) continue;

    const originalPrice = parsePrice(String(regularPriceMatch?.[1] || '')) || currentPrice;
    const key = externalUrl.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const imageMatch = block.match(/<img[^>]+(?:data-src|src)="(https?:\/\/[^"\s]+)"/i);

    offers.push({
      platform: 'ghorerbazar',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl: imageMatch?.[1],
      currentPrice,
      originalPrice: Math.max(originalPrice, currentPrice),
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Ghorer Bazar',
    });
  }

  return offers;
};

export async function liveMarketplaceSearch(
  query: string,
  maxPerSeller = 16,
  options?: { darazOnly?: boolean }
) {
  const q = String(query || '').trim();
  if (!q) {
    return { domestic: [] as LiveOffer[], international: [] as LiveOffer[], errors: [] as string[], coverage: '' };
  }

  const createDarazTask = async () => {
      try {
        const baseUrl = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(q)}`;
        const darazTarget = Math.min(1000, Math.max(maxPerSeller, maxPerSeller * 2));
        const pagesToScan = Math.min(50, Math.max(2, Math.ceil(darazTarget / 22)));

        const merged: LiveOffer[] = [];
        const seen = new Set<string>();
        let firstPageStatus = 0;
        let consecutiveMissPages = 0;

        for (let pageIndex = 0; pageIndex < pagesToScan; pageIndex += 1) {
          if (merged.length >= darazTarget) break;
          if (pageIndex > 6 && consecutiveMissPages >= 3) break;

          const url = pageIndex === 0 ? baseUrl : `${baseUrl}&page=${pageIndex + 1}`;
          let response: { status: number; text: string };
          try {
            response = await fetchViaJina(url);
          } catch {
            response = { status: 0, text: '' };
          }

          if (pageIndex === 0) {
            firstPageStatus = response.status;
          }

          if (response.status !== 200 || !response.text) {
            consecutiveMissPages += 1;
            continue;
          }

          const parsed = parseDaraz(response.text, q, darazTarget);
          let addedOnThisPage = 0;
          for (const offer of parsed) {
            if (merged.length >= darazTarget) break;
            const key = `${offer.externalUrl.split('?')[0]}|${offer.currentPrice}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(offer);
            addedOnThisPage += 1;
          }

          if (addedOnThisPage === 0) {
            consecutiveMissPages += 1;
          } else {
            consecutiveMissPages = 0;
          }
        }

        if (merged.length === 0) {
          if (firstPageStatus !== 200) {
            return { seller: 'daraz', offers: [], error: `HTTP ${firstPageStatus || 0}` };
          }
        }

        return { seller: 'daraz', offers: merged };
      } catch (error) {
        return { seller: 'daraz', offers: [], error: (error as Error).message };
      }
  };

  const tasks: Array<Promise<{ seller: string; offers: LiveOffer[]; error?: string }>> = [
    createDarazTask(),
  ];

  if (!options?.darazOnly) {
    tasks.push(
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.bagdoom.com/search?query=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'bagdoom', offers: [], error: `HTTP ${status}` };
        return { seller: 'bagdoom', offers: parseBagdoom(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'bagdoom', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://chaldal.com/search/${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'chaldal', offers: [], error: `HTTP ${status}` };
        return { seller: 'chaldal', offers: parseChaldal(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'chaldal', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.rokomari.com/search?term=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'rokomari', offers: [], error: `HTTP ${status}` };
        return { seller: 'rokomari', offers: parseRokomari(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'rokomari', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.ryans.com/search?q=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'ryans', offers: [], error: `HTTP ${status}` };
        return { seller: 'ryans', offers: parseRyans(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'ryans', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.startech.com.bd/product/search?search=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'startech', offers: [], error: `HTTP ${status}` };
        return { seller: 'startech', offers: parseStartech(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'startech', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchDirect(`https://www.techlandbd.com/index.php?route=product/search&search=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'techland-bd', offers: [], error: `HTTP ${status}` };
        return { seller: 'techland-bd', offers: parseTechland(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'techland-bd', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const slugQuery = encodeURIComponent(String(q).trim().toLowerCase().replace(/\s+/g, '-'));
        const primary = await fetchViaJina(`https://www.pickaboo.com/product/${slugQuery}`);
        const primaryOffers = primary.status === 200 ? parsePickaboo(primary.text, q, maxPerSeller) : [];
        if (primaryOffers.length > 0) {
          return { seller: 'pickaboo', offers: primaryOffers };
        }

        const fallback = await fetchViaJina('https://www.pickaboo.com/product/smartphone');
        if (fallback.status !== 200) return { seller: 'pickaboo', offers: [], error: `HTTP ${fallback.status}` };
        return { seller: 'pickaboo', offers: parsePickaboo(fallback.text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'pickaboo', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const slugQuery = encodeURIComponent(String(q).trim().toLowerCase().replace(/\s+/g, '-'));
        const urls = [
          `https://shop.shajgoj.com/search?type=product&q=${encodeURIComponent(q)}`,
          `https://shop.shajgoj.com/product-category/${slugQuery}/`,
          'https://shop.shajgoj.com/product-category/face/',
        ];

        for (const url of urls) {
          const { status, text } = await fetchViaJina(url);
          if (status !== 200) continue;

          const parsed = parseShajgoj(text, q, maxPerSeller);
          if (parsed.length > 0) {
            return { seller: 'shajgoj', offers: parsed };
          }
        }

        return { seller: 'shajgoj', offers: [] };
      } catch (error) {
        return { seller: 'shajgoj', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchDirect(`https://www.yellowclothing.net/search?q=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'yellow', offers: [], error: `HTTP ${status}` };
        return { seller: 'yellow', offers: parseYellow(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'yellow', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const urls = [
          'https://backend.sailor.clothing/api/v2/products/category/8',
          'https://backend.sailor.clothing/api/v2/products/category/9',
          'https://backend.sailor.clothing/api/v2/products/category/12',
          'https://backend.sailor.clothing/api/v2/products/category/100',
          'https://backend.sailor.clothing/api/v2/products/category/136',
          'https://backend.sailor.clothing/api/v2/products/category/225',
        ];

        const merged: LiveOffer[] = [];
        const seen = new Set<string>();
        for (const url of urls) {
          const { status, text } = await fetchDirect(url);
          if (status !== 200) continue;

          const parsed = parseSailorApi(text, q, maxPerSeller);
          for (const offer of parsed) {
            if (merged.length >= maxPerSeller) break;
            const key = offer.externalUrl.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(offer);
          }
          if (merged.length >= maxPerSeller) break;
        }

        return { seller: 'sailor', offers: merged };
      } catch (error) {
        return { seller: 'sailor', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const urls = [
          `https://catseye.com.bd/catalogsearch/result/?q=${encodeURIComponent(q)}`,
          `https://www.catseye.com.bd/catalogsearch/result/?q=${encodeURIComponent(q)}`,
        ];

        for (const url of urls) {
          const { status, text } = await fetchDirect(url);
          if (status !== 200) continue;

          const parsed = parseCatsEye(text, q, maxPerSeller);
          if (parsed.length > 0) {
            return { seller: 'cats-eye', offers: parsed };
          }
        }

        return { seller: 'cats-eye', offers: [] };
      } catch (error) {
        return { seller: 'cats-eye', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchDirect(`https://easyfashion.com.bd/wp-json/wc/store/v1/products?search=${encodeURIComponent(q)}&per_page=40`);
        if (status !== 200) return { seller: 'easy', offers: [], error: `HTTP ${status}` };
        return { seller: 'easy', offers: parseEasyStoreApi(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'easy', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const urls = [
          `https://toptenmartltd.com/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=40`,
          'https://toptenmartltd.com/products.json?limit=80',
        ];

        for (const url of urls) {
          const { status, text } = await fetchDirect(url);
          if (status !== 200) continue;

          const parsed = parseTopTenShopify(text, q, maxPerSeller);
          if (parsed.length > 0) {
            return { seller: 'top-ten', offers: parsed };
          }
        }

        return { seller: 'top-ten', offers: [] };
      } catch (error) {
        return { seller: 'top-ten', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchDirect(`https://computersource.com.bd/index.php?route=product/search&search=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'computersource', offers: [], error: `HTTP ${status}` };
        return { seller: 'computersource', offers: parseComputerSource(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'computersource', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchDirect(`https://ghorerbazar.com/?s=${encodeURIComponent(q)}&post_type=product`);
        if (status !== 200) return { seller: 'ghorerbazar', offers: [], error: `HTTP ${status}` };
        return { seller: 'ghorerbazar', offers: parseGhorerbazar(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'ghorerbazar', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'aliexpress', offers: [], error: `HTTP ${status}` };
        return { seller: 'aliexpress', offers: parseAliExpress(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'aliexpress', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://m.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`);
        if (status === 451 || /SecurityCompromiseError|"code":451/i.test(text)) {
          return { seller: 'alibaba', offers: [] };
        }
        if (status !== 200) return { seller: 'alibaba', offers: [], error: `HTTP ${status}` };
        return { seller: 'alibaba', offers: parseAlibaba(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'alibaba', offers: [], error: (error as Error).message };
      }
    })(),
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'amazon', offers: [], error: `HTTP ${status}` };
        return { seller: 'amazon', offers: parseAmazon(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'amazon', offers: [], error: (error as Error).message };
      }
    })(),
    );
  }

  const settled = await Promise.all(tasks);

  // Seller tier system: Priority determines sort order and fallback strategy
  const SELLER_TIERS: Record<string, { tier: number; score: number }> = {
    // Tier 1: Proven high-volume, international reach
    'aliexpress': { tier: 1, score: 100 },
    'amazon': { tier: 1, score: 100 },
    'alibaba': { tier: 1, score: 95 },

    // Tier 2: Proven domestic, strong data
    'daraz': { tier: 2, score: 90 },
    'rokomari': { tier: 2, score: 85 },

    // Tier 3: Solid domestic performers
    'chaldal': { tier: 3, score: 70 },
    'startech': { tier: 3, score: 70 },
    'techland': { tier: 3, score: 65 },
    'pickaboo': { tier: 3, score: 60 },
    'bagdoom': { tier: 3, score: 55 },
    'ryans': { tier: 3, score: 55 },

    // Tier 4: Moderate performers
    'shajgoj': { tier: 4, score: 45 },
    'yellow': { tier: 4, score: 40 },
    'sailor': { tier: 4, score: 40 },
    'cats-eye': { tier: 4, score: 40 },

    // Tier 5: New/specialized
    'easy': { tier: 5, score: 30 },
    'top-ten': { tier: 5, score: 30 },
    'computersource': { tier: 5, score: 30 },
    'ghorerbazar': { tier: 5, score: 30 },
  };

  // Calculate seller result counts for dynamic scoring
  const sellerResultCounts: Record<string, number> = {};
  settled.forEach((result) => {
    sellerResultCounts[result.seller] = result.offers.length;
  });

  // Sort offers with intelligent ranking
  const sortOffers = (offers: LiveOffer[]): LiveOffer[] => {
    return offers.sort((a, b) => {
      // 1. Sort by seller tier (proven sellers first)
      const tierA = SELLER_TIERS[a.platform]?.tier ?? 99;
      const tierB = SELLER_TIERS[b.platform]?.tier ?? 99;
      if (tierA !== tierB) return tierA - tierB;

      // 2. Within same tier, sort by base score
      const scoreA = SELLER_TIERS[a.platform]?.score ?? 0;
      const scoreB = SELLER_TIERS[b.platform]?.score ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // 3. Prefer offers with images (better data quality)
      const hasImageA = !!a.imageUrl ? 1 : 0;
      const hasImageB = !!b.imageUrl ? 1 : 0;
      if (hasImageA !== hasImageB) return hasImageB - hasImageA;

      // 4. Prefer discounted items
      const discountPercentA = ((a.originalPrice - a.currentPrice) / a.originalPrice) * 100;
      const discountPercentB = ((b.originalPrice - b.currentPrice) / b.originalPrice) * 100;
      if (Math.abs(discountPercentA - discountPercentB) > 5) return discountPercentB - discountPercentA;

      // 5. For same tier/score, sort by price (ascending - cheaper first within same tier)
      if (a.currentPrice !== b.currentPrice) return a.currentPrice - b.currentPrice;

      // 6. By platform name for deterministic ordering
      return a.platform.localeCompare(b.platform);
    });
  };

  const allOffers = settled.flatMap((result) => result.offers);
  const domestic = sortOffers(allOffers.filter((offer) => offer.sellerType === 'DOMESTIC'));
  const international = sortOffers(allOffers.filter((offer) => offer.sellerType === 'INTERNATIONAL'));
  const errors = settled.filter((result) => result.error).map((result) => `${result.seller}: ${result.offers.length === 0 ? result.error : ''}`).filter(Boolean);

  // Log seller coverage for debugging
  const coverage = settled
    .filter((r) => r.offers.length > 0)
    .map((r) => `${r.seller}: ${r.offers.length}`)
    .join(', ');

  return { domestic, international, errors, coverage };
}
