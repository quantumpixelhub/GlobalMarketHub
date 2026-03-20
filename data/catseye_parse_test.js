const fs=require('fs');
const h=fs.readFileSync('data/catseye_search_direct.html','utf8');
const re=/<li class="item product product-item">[\s\S]{0,6000}?<a class="product-item-link" href="(https?:\/\/catseye\.com\.bd\/catalog\/product\/view\/id\/\d+\/s\/[^"\s]+)"[^>]*>\s*([\s\S]{1,180}?)\s*<\/a>[\s\S]{0,1600}?id="product-price-\d+"\s+data-price-amount="([0-9.]+)"[\s\S]{0,600}?(?:id="old-price-\d+"\s+data-price-amount="([0-9.]+)")?/gi;
let c=0,m;
while((m=re.exec(h))!==null && c<8){
  c++;
  const title=(m[2]||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  console.log(title,'| price',m[3],'| old',m[4]||m[3],'|',m[1]);
}
console.log('count',c);
