const fs = require('fs');

const sites = {
  pickaboo: 'https://www.pickaboo.com/search?q=power+bank',
  gng: 'https://gadgetandgear.com/search?type=product&q=charger',
  shajgoj: 'https://shop.shajgoj.com/search?type=product&q=lipstick',
  othoba: 'https://othoba.com/search?text=charger',
  priyoshop: 'https://priyoshop.com/search?keyword=charger',
};

(async () => {
  for (const [key, url] of Object.entries(sites)) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'accept-language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(20000),
      });

      const text = await res.text();
      const hasPrice = /(৳\s*[0-9]|Tk\s*[0-9]|\$\s*[0-9]|price\s*[:]?\s*[0-9])/i.test(text);
      const hasHref = /href=\"https?:\/\//i.test(text);
      const hasQuery = /(power\s*bank|charger|lipstick)/i.test(text);

      console.log(key, `status=${res.status}`, `len=${text.length}`, `price=${hasPrice}`, `href=${hasHref}`, `query=${hasQuery}`);
      fs.writeFileSync(`data/${key}_direct_probe.html`, text);
    } catch (error) {
      console.log(key, 'ERR', error?.name || String(error));
    }
  }
})();
