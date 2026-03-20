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

const probes = [
  '/products.json?limit=20',
  '/search/suggest.json?q=fan&resources[type]=product&resources[limit]=10',
  '/wp-json/wc/store/v1/products?search=fan&per_page=10',
  '/wp-json/wp/v2/product?search=fan&per_page=10',
  '/api/products?search=fan',
  '/search?q=fan',
  '/',
];

(async () => {
  for (const site of sites) {
    console.log('\nSITE', site);
    for (const path of probes) {
      const url = `${site}${path}`;
      try {
        const response = await fetch(url, {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            accept: 'application/json,text/html,*/*',
          },
        });
        const text = await response.text();
        const ct = response.headers.get('content-type') || '';
        const priceSignals = (text.match(/"price"|"regular_price"|"sale_price"|"compare_at_price"|৳|Tk\.?\s*[0-9]/g) || []).length;
        const productSignals = (text.match(/"products"|"variants"|"handle"|\/product\/|\/products\//g) || []).length;
        const isJson = ct.includes('json');
        if (response.status === 200 && (isJson || priceSignals > 5 || productSignals > 10)) {
          console.log('HIT', path, 'status', response.status, 'ct', ct, 'len', text.length, 'price', priceSignals, 'prod', productSignals);
        }
      } catch {
        // ignore
      }
    }
  }
})();
