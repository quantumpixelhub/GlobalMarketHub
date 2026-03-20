const fs=require('fs');
const html=fs.readFileSync('data/shajgoj_face_direct2.html','utf8');
const m=html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
if(!m){console.log('NO_NEXT'); process.exit(0);} 
const data=JSON.parse(m[1]);
const pp=data?.props?.pageProps||{};
console.log('pageProps keys',Object.keys(pp));
function walk(node,path='root'){
 if(!node||typeof node!=='object') return;
 if(Array.isArray(node)){
   if(node.length && typeof node[0]==='object'){
     const keys=Object.keys(node[0]);
     if(keys.some(k=>/name|title|slug|price|sale/i.test(k))){
       console.log('ARRAY',path,'len',node.length,'keys',keys.slice(0,12).join(','));
     }
   }
   for(let i=0;i<Math.min(node.length,5);i++) walk(node[i],path+'['+i+']');
   return;
 }
 for(const [k,v] of Object.entries(node)) walk(v,path+'.'+k);
}
walk(pp);
