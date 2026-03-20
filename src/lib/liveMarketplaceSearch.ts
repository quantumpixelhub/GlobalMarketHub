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

const parseIntSafe = (value: string) => {
  const num = Number(String(value || '').replace(/[^0-9]/g, ''));
  return Number.isFinite(num) ? Math.round(num) : 0;
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
  const res = await fetch(wrapped, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  const text = await res.text();
  return { status: res.status, text };
};

const fetchDirect = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  const text = await res.text();
  return { status: res.status, text };
};

const parseDaraz = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/[^)]+)\)\s*\n\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)\s*\n\s*৳\s*([0-9,]+)(?:\s*\n\s*([0-9]{1,2})% Off)?/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[3] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[5]);
    if (currentPrice <= 0) continue;

    const discount = parseIntSafe(m[6] || '0');
    const originalPrice = discount > 0 ? Math.round(currentPrice / (1 - discount / 100)) : currentPrice;

    offers.push({
      platform: 'daraz',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: m[4],
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: discount > 0,
      sellerName: 'Daraz Marketplace',
    });
  }

  return offers;
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
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)[^\]]*####\s*([^\]]+?)\s*(?:Brand:[^\]]+)?(?:~~TK\.\s*([0-9,]+)~~\s*)?TK\.\s*([0-9,]+)\]\((https?:\/\/www\.rokomari\.com\/product\/[^\s)]+)[^)]*\)/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[2] || '').replace(/\s+/g, ' ').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[4]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[3] ? parsePrice(m[3]) : currentPrice;

    offers.push({
      platform: 'rokomari',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: m[5],
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: originalPrice > currentPrice,
      sellerName: 'Rokomari',
    });
  }

  return offers;
};

const parseStartech = (markdown: string, query: string, max: number): LiveOffer[] => {
  const regex = /\[!\[Image[^\]]*\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/www\.startech\.com\.bd\/[^)]+)\)[\s\S]{0,300}?#### \[([^\]]+)\]\((https?:\/\/www\.startech\.com\.bd\/[^)]+)\)[\s\S]{0,220}?([0-9,]+)৳(?:([0-9,]+)৳)?/gi;
  const offers: LiveOffer[] = [];

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[3] || '').trim();
    if (!matchesQuery(title, query)) continue;

    const currentPrice = parsePrice(m[5]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[6] ? parsePrice(m[6]) : currentPrice;

    offers.push({
      platform: 'startech',
      sellerType: 'DOMESTIC',
      title,
      externalUrl: m[4],
      imageUrl: m[1],
      currentPrice,
      originalPrice,
      discountVerified: originalPrice > currentPrice,
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
  const offers: LiveOffer[] = [];
  const queryTokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
  const broadPhoneQuery = /(phone|mobile|smartphone|android|iphone)/i.test(String(query || ''));
  const regex = /!\[Image\s+\d+:[^\]]*\]\((https?:\/\/[^)]+)\)[\s\S]{0,220}?####\s+([^\n\r]+?)\s+৳\s*([0-9,]+)(?:~~৳\s*([0-9,]+)~~)?[\s\S]{0,220}?\]\((https?:\/\/www\.pickaboo\.com\/product-detail\/[^)\s]+)\)/gi;
  const seen = new Set<string>();

  let m;
  while ((m = regex.exec(markdown)) !== null && offers.length < max) {
    const title = String(m[2] || '').trim();
    const relevant = broadPhoneQuery || matchesQuery(title, query) || queryTokens.some((token) => title.toLowerCase().includes(token));
    if (!title || !relevant) continue;

    const currentPrice = parsePrice(m[3]);
    if (currentPrice <= 0) continue;

    const originalPrice = m[4] ? parsePrice(m[4]) : currentPrice;
    const externalUrl = String(m[5] || '').replace(/&amp;/g, '&');
    const key = externalUrl.split('/').pop() || title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      platform: 'pickaboo',
      sellerType: 'DOMESTIC',
      title,
      externalUrl,
      imageUrl: m[1],
      currentPrice,
      originalPrice: Math.max(originalPrice, currentPrice),
      discountVerified: originalPrice > currentPrice,
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

export async function liveMarketplaceSearch(query: string, maxPerSeller = 16) {
  const q = String(query || '').trim();
  if (!q) {
    return { domestic: [] as LiveOffer[], international: [] as LiveOffer[], errors: [] as string[] };
  }

  const tasks: Array<Promise<{ seller: string; offers: LiveOffer[]; error?: string }>> = [
    (async () => {
      try {
        const { status, text } = await fetchViaJina(`https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'daraz', offers: [], error: `HTTP ${status}` };
        return { seller: 'daraz', offers: parseDaraz(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'daraz', offers: [], error: (error as Error).message };
      }
    })(),
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
  ];

  const settled = await Promise.all(tasks);

  const allOffers = settled.flatMap((result) => result.offers);
  const domestic = allOffers.filter((offer) => offer.sellerType === 'DOMESTIC');
  const international = allOffers.filter((offer) => offer.sellerType === 'INTERNATIONAL');
  const errors = settled.filter((result) => result.error).map((result) => `${result.seller}: ${result.error}`);

  return { domestic, international, errors };
}
