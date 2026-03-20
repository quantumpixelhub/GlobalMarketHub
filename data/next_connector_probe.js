const roots = [
  'https://aarong.com',
  'https://www.aarong.com',
  'https://ecstasybd.com',
  'https://milan-bd.com',
  'https://topten.com.bd',
  'https://beautybooth.com.bd',
  'https://bbb.com.bd',
  'https://livewirebd.com',
  'https://takeandtalksbd.com',
  'https://othoba.com',
  'https://priyoshop.com',
  'https://ajkerdeal.com',
  'https://evaly.com.bd',
];

const paths = [
  '/wp-json/wc/store/v1/products?search=shirt&per_page=5',
  '/wp-json/wp/v2/product?search=shirt&per_page=5',
  '/wp-json',
  '/graphql',
  '/api/products?search=shirt',
];

(async () => {
  for (const root of roots) {
    for (const path of paths) {
      const url = `${root}${path}`;
      try {
        const response = await fetch(url, {
          headers: {
            'user-agent': 'Mozilla/5.0',
            accept: 'application/json,text/html,*/*',
          },
        });
        const text = await response.text();
        const priceCount = (text.match(/"price"|"regular_price"|"sale_price"|৳|Tk/g) || []).length;
        const nameCount = (text.match(/"name"|"title"|"slug"/g) || []).length;
        const hasRoutes = /wc\/store|routes|graphql|products/i.test(text);
        if (response.status === 200 && (priceCount > 0 || hasRoutes)) {
          console.log('HIT', response.status, priceCount, nameCount, url, 'len', text.length);
        }
      } catch {
        // ignore
      }
    }
  }
})();
