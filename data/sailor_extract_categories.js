const fs=require('fs');
const h=fs.readFileSync('data/sailor_direct3.html','utf8');
const urls=[...h.matchAll(/https?:\/\/sailor\.clothing\/category\/[^"'\s<>]+/gi)].map(m=>m[0]);
const rel=[...h.matchAll(/\"\/category\/[^\"\s<>]+\"/gi)].map(m=>m[0].slice(1,-1));
const all=[...new Set([...urls,...rel.map(v=>'https://sailor.clothing'+v)])];
console.log('count',all.length);
console.log(all.slice(0,20).join('\n'));
