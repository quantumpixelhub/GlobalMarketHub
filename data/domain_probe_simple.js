const domains = [
  'https://milan-bd.com',
  'https://ecstasybd.com',
  'https://livewirebd.com',
  'https://bbb.com.bd',
  'https://takeandtalksbd.com',
  'https://toptenmartltd.com',
  'https://boighar.com',
  'https://shwapno.com',
  'https://bikroy.com',
];

const paths = [
  '/products.json?limit=10',
  '/search/suggest.json?q=shirt&resources[type]=product',
  '/wp-json/wc/store/v1/products?search=shirt&per_page=10',
  '/wp-json/wp/v2/product?search=shirt&per_page=10',
  '/api/products?search=shirt',
  '/search?q=shirt',
];

(async () => {
  for (const domain of domains) {
    for (const path of paths) {
      const url = `${domain}${path}`;
      try {
        const response = await fetch(url, {
          headers: {
            'user-agent': 'Mozilla/5.0',
            accept: 'application/json,text/html,*/*',
          },
        });
        const text = await response.text();
        const contentType = response.headers.get('content-type') || '';
        const priceSignals = (text.match(/\"price\"|\"regular_price\"|\"sale_price\"|৳|Tk/g) || []).length;
        const hasProductLinks = /\/product\//i.test(text);
        if (response.status === 200 && (priceSignals > 10 || hasProductLinks || contentType.includes('json'))) {
          console.log('HIT', response.status, domain, path, 'ct=', contentType, 'len=', text.length, 'priceSig=', priceSignals, 'productLinks=', hasProductLinks);
        }
      } catch {
        // skip
      }
    }
  }
})();
