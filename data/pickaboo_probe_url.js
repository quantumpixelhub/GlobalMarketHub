(async () => {
  const url = process.argv[2];
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!m) { console.log('NO_NEXT_DATA'); return; }
  const data = JSON.parse(m[1]);
  const pp = data?.props?.pageProps || {};
  console.log('keys', Object.keys(pp));
  for (const k of Object.keys(pp)) {
    const v = pp[k];
    if (Array.isArray(v)) console.log(k, 'array', v.length);
  }
})();
