(async () => {
  const fs = require('fs');
  const url = 'https://toptenmartltd.com/search/suggest.json?q=shirt&resources[type]=product';
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json,*/*',
    },
  });
  const text = await response.text();
  fs.writeFileSync('data/topten_suggest.json', text);
  console.log('status', response.status, 'len', text.length);
  const parsed = JSON.parse(text);
  console.log('keys', Object.keys(parsed));
  const products = parsed?.resources?.results?.products || [];
  console.log('products', products.length);
  if (products[0]) {
    console.log('product_keys', Object.keys(products[0]).slice(0, 20).join(','));
    console.log('title', products[0].title);
    console.log('price', products[0].price || products[0].price_min);
    console.log('url', products[0].url);
    console.log('image', products[0].image || products[0].featured_image?.url || '');
  }
})();
