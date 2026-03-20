(async()=>{
  const res = await fetch('https://www.yellowclothing.net/search?q=shirt',{
    headers: {
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept-language':'en-US,en;q=0.9'
    }
  });
  const h = await res.text();
  const re = /<div class="product-item">[\s\S]{0,7000}?<a class="card-title[^"]*" href="([^"]+)">([\s\S]{1,160}?)<\/a>[\s\S]{0,1600}?<span class="price-item price-item--regular">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>[\s\S]{0,700}?(?:<span class="price-item price-item--sale">Tk\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>)?/gi;
  let total=0;
  let shirt=0;
  let m;
  while((m=re.exec(h))!==null){
    total += 1;
    const t = String(m[2]||'').replace(/<[^>]*>/g,'').trim().toLowerCase();
    if(t.includes('shirt')) shirt += 1;
  }
  console.log('status',res.status,'len',h.length,'total',total,'shirt',shirt);
})();
