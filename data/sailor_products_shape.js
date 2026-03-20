const fs=require('fs');
const html=fs.readFileSync('data/sailor_direct3.html','utf8');
const m=html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
const data=JSON.parse(m[1]);
const p=data?.props?.pageProps?.products;
if(!p){ console.log('no products'); process.exit(0);} 
console.log('productsType', Array.isArray(p)?'array':typeof p, 'keys', typeof p==='object' ? Object.keys(p).slice(0,20) : '');
const arr=Array.isArray(p)?p:(Array.isArray(p.data)?p.data:[]);
console.log('arrLen',arr.length);
if(arr.length){
  console.log('itemKeys',Object.keys(arr[0]).slice(0,30));
  console.log('sample',JSON.stringify(arr[0]).slice(0,1200));
}
