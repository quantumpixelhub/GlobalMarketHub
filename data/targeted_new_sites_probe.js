const targets = [
  'https://www.bdhardwarestore.com/product/search?search=fan',
  'https://www.bdhardwarestore.com/index.php?route=product/search&search=fan',
  'https://computersource.com.bd/index.php?route=product/search&search=fan',
  'https://computersource.com.bd/product/search?search=fan',
  'https://ghorerbazar.com/search?q=fan',
  'https://ghorerbazar.com/?s=fan&post_type=product',
  'https://ghorerbazar.com/wp-json/wc/store/v1/products?search=fan&per_page=20',
  'https://ghorerbazar.com/wp-json/wp/v2/product?search=fan&per_page=20',
  'https://waltonplaza.com.bd/search?q=fan',
  'https://rflbestbuy.com/search?q=fan',
  'https://regalfurniturebd.com/search?q=fan',
  'https://hatil.com/search?q=fan',
  'https://www.otobi.com/search?q=fan',
  'https://healthrevolutionbd.com/search?q=fan',
];

(async () => {
  for (const url of targets) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0',
          accept: 'application/json,text/html,*/*',
        },
      });
      const text = await res.text();
      const ct = res.headers.get('content-type') || '';
      const price = (text.match(/"price"|"regular_price"|"sale_price"|data-price-amount|৳\s*[0-9,]+|Tk\.?\s*[0-9,]+/gi) || []).length;
      const prod = (text.match(/\/product\/|\/products\/|catalog\/product|product-item-link|id="product-price-|"variants"|"products"|"handle"/gi) || []).length;
      console.log(res.status, ct, 'len', text.length, 'price', price, 'prod', prod, url);
    } catch (err) {
      console.log('ERR', (err && err.message) ? err.message : String(err), url);
    }
  }
})();
