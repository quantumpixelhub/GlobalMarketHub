type SellerType = 'DOMESTIC' | 'INTERNATIONAL';

export type LiveOffer = {
  platform: string;
  sellerType: SellerType;
  title: string;
  externalUrl: string;
  imageUrl?: string;
  currentPrice: number;
  originalPrice: number;
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
      sellerName: 'Startech',
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
      sellerName: 'AliExpress Marketplace',
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
        const { status, text } = await fetchViaJina(`https://www.startech.com.bd/product/search?search=${encodeURIComponent(q)}`);
        if (status !== 200) return { seller: 'startech', offers: [], error: `HTTP ${status}` };
        return { seller: 'startech', offers: parseStartech(text, q, maxPerSeller) };
      } catch (error) {
        return { seller: 'startech', offers: [], error: (error as Error).message };
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
  ];

  const settled = await Promise.all(tasks);

  const allOffers = settled.flatMap((result) => result.offers);
  const domestic = allOffers.filter((offer) => offer.sellerType === 'DOMESTIC');
  const international = allOffers.filter((offer) => offer.sellerType === 'INTERNATIONAL');
  const errors = settled.filter((result) => result.error).map((result) => `${result.seller}: ${result.error}`);

  return { domestic, international, errors };
}
