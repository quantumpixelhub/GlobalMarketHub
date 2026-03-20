const sites = [
  'https://www.bestelectronics.com.bd',
  'https://www.bdhardwarestore.com',
  'https://totaltools.com.bd',
  'https://www.ingco.com/bd',
  'https://waltonplaza.com.bd',
  'https://computersource.com.bd',
  'https://hatil.com',
  'https://www.otobi.com',
  'https://regalfurniturebd.com',
  'https://rflbestbuy.com',
  'https://ghorerbazar.com',
  'https://healthrevolutionbd.com',
];

const searchPaths = [
  '/search?q=fan',
  '/search?query=fan',
  '/search?keyword=fan',
  '/catalogsearch/result/?q=fan',
  '/product/search?search=fan',
  '/products/search?q=fan',
];

const wrap = (url) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`;

(async () => {
  for (const site of sites) {
    console.log('\nSITE', site);
    let found = false;
    for (const p of searchPaths) {
      const url = `${site}${p}`;
      try {
        const res = await fetch(wrap(url), {
          headers: {
            'user-agent': 'Mozilla/5.0',
            'accept-language': 'en-US,en;q=0.9',
          },
        });
        const text = await res.text();
        const price = (text.match(/৳\s*[0-9,]+|Tk\.?\s*[0-9,]+|\$\s*[0-9,.]+/gi) || []).length;
        const products = (text.match(/\/product\/|\/products\/|product-detail|catalog\/product|###\s+\[/gi) || []).length;
        if (res.status === 200 && (price > 5 || products > 5)) {
          found = true;
          console.log('HIT', p, 'status', res.status, 'len', text.length, 'price', price, 'products', products);
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!found) console.log('NO_HIT');
  }
})();
