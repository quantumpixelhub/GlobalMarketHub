(async () => {
  const fs = require('fs');
  const url = 'https://beautybooth.com.bd/api/products?search=shirt';
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json,*/*',
    },
  });

  const text = await response.text();
  fs.writeFileSync('data/beautybooth_products_search.json', text);

  const priceCount = (text.match(/"price"|"regular_price"|"discount_price"|"sale_price"/g) || []).length;
  const nameCount = (text.match(/"name"|"title"|"slug"/g) || []).length;
  const imageCount = (text.match(/"image"|"thumbnail"|"featured_image"/g) || []).length;

  console.log('status', response.status, 'len', text.length);
  console.log('price', priceCount, 'name', nameCount, 'image', imageCount);
})();
