(async () => {
  const fs = require('fs');
  const url = 'https://toptenmartltd.com/products.json?limit=20';
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json,*/*',
    },
  });
  const text = await response.text();
  fs.writeFileSync('data/topten_products.json', text);
  console.log('status', response.status, 'len', text.length);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.log('json_parse_failed');
    return;
  }

  const products = Array.isArray(parsed.products) ? parsed.products : [];
  console.log('products', products.length);
  if (!products.length) return;

  const p = products[0];
  console.log('keys', Object.keys(p).slice(0, 20).join(','));
  console.log('title', p.title);
  console.log('handle', p.handle);
  console.log('price', p.variants?.[0]?.price, 'compare', p.variants?.[0]?.compare_at_price);
  console.log('image', p.image?.src || p.images?.[0]?.src || '');
})();
