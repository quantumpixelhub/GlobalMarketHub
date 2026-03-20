const fs = require('fs');
const html = fs.readFileSync('data/pickaboo-cat_direct2.html','utf8');
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if(!m){ console.log('NO_NEXT_DATA'); process.exit(0); }
const data = JSON.parse(m[1]);
function findProducts(node){
  if(!node || typeof node !== 'object') return null;
  if(Array.isArray(node)){
    for(const v of node){ const r=findProducts(v); if(r) return r; }
    return null;
  }
  for(const [k,v] of Object.entries(node)){
    if(Array.isArray(v) && v.length && typeof v[0]==='object' && ('product_name' in v[0] || 'slug' in v[0])){
      return {key:k, arr:v};
    }
  }
  for(const v of Object.values(node)){
    const r=findProducts(v); if(r) return r;
  }
  return null;
}
const found = findProducts(data);
if(!found){ console.log('NO_PRODUCTS'); process.exit(0); }
console.log('KEY', found.key, 'LEN', found.arr.length);
console.log('FIRST_KEYS', Object.keys(found.arr[0]).join(','));
console.log('FIRST', JSON.stringify(found.arr[0]).slice(0,500));
