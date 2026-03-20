const fs=require('fs');
const h=fs.readFileSync('data/yellow_direct2.html','utf8');
const idx=h.indexOf('/products/');
console.log('first idx',idx);
if(idx>0){
 const s=Math.max(0,idx-600);
 const e=Math.min(h.length,idx+1400);
 console.log(h.slice(s,e));
}
const r=/<a[^>]+href="([^\"]*\/products\/[^\"]+)"[^>]*>[\s\S]{0,400}?<span[^>]*class="price-item price-item--sale price-item--last"[^>]*>\s*([^<]+)\s*<\/span>[\s\S]{0,200}?<span[^>]*class="price-item price-item--regular"[^>]*>\s*([^<]+)\s*<\/span>/i;
const m=h.match(r);
if(m){ console.log('sample',m[1],m[2],m[3]); } else { console.log('no sample regex'); }
