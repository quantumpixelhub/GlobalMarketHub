const fs=require('fs');
const h=fs.readFileSync('data/yellow_direct2.html','utf8');
const re=/<div class="product-item">[\s\S]{0,7000}?<a class="card-title[^"]*" href="([^"]+)">([\s\S]{1,160}?)<\/a>[\s\S]{0,1600}?<span class="price-item price-item--regular">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>[\s\S]{0,700}?(?:<span class="price-item price-item--sale">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>)?/gi;
let c=0;
let m;
while((m=re.exec(h))!==null && c<10){
  c+=1;
  const title=(m[2]||'').replace(/\s+/g,' ').trim();
  const regular=m[3];
  const sale=m[4]||m[3];
  const url=m[1].startsWith('http')?m[1]:'https://www.yellowclothing.net'+m[1];
  console.log(title+' | reg='+regular+' | sale='+sale+' | '+url);
}
console.log('count',c);
