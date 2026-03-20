(async () => {
  const fs = require('fs');
  const response = await fetch('https://beautybooth.com.bd/', {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'text/html,*/*',
    },
  });

  const html = await response.text();
  fs.writeFileSync('data/beautybooth_home.html', html);
  console.log('status', response.status, 'len', html.length);

  const absoluteApis = [...html.matchAll(/https?:\/\/[^"'\s<>]+\/api\/[^"'\s<>]*/g)].map((m) => m[0]);
  const relativeApis = [...html.matchAll(/"(\/api\/[^"\s<>]+)"/g)].map((m) => m[1]);
  const unique = [...new Set([...absoluteApis, ...relativeApis])];

  console.log('apiRefs', unique.length);
  console.log(unique.slice(0, 80));
})();
