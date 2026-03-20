const fs=require('fs');
const h=fs.readFileSync('data/catseye_search_direct.html','utf8');
const idx=h.indexOf('product-item-link');
console.log('idx',idx);
if(idx>0){
  console.log(h.slice(Math.max(0,idx-900), idx+1900));
}
