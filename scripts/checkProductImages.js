const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUrl(url) {
  try {
    const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (head.ok) return { ok: true, status: head.status };

    const get = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { ok: get.ok, status: get.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  console.log('Checking all product image URLs...');

  const products = await prisma.product.findMany({
    select: { id: true, title: true, mainImage: true, images: true },
    orderBy: { createdAt: 'asc' },
  });

  const urlMap = new Map();
  for (const product of products) {
    const urls = [product.mainImage, ...(product.images || [])].filter(Boolean);
    for (const url of urls) {
      if (!urlMap.has(url)) {
        urlMap.set(url, []);
      }
      urlMap.get(url).push({ id: product.id, title: product.title });
    }
  }

  const uniqueUrls = Array.from(urlMap.keys());
  console.log(`Products: ${products.length}`);
  console.log(`Unique image URLs: ${uniqueUrls.length}`);

  const broken = [];
  let checked = 0;

  for (const url of uniqueUrls) {
    const result = await checkUrl(url);
    checked += 1;

    if (!result.ok) {
      broken.push({ url, status: result.status, usedBy: urlMap.get(url).slice(0, 3) });
    }

    if (checked % 25 === 0 || checked === uniqueUrls.length) {
      console.log(`Checked ${checked}/${uniqueUrls.length}`);
    }
  }

  const healthy = uniqueUrls.length - broken.length;
  console.log('\nImage health summary:');
  console.log(`Healthy URLs: ${healthy}`);
  console.log(`Broken URLs: ${broken.length}`);

  if (broken.length) {
    console.log('\nBroken image samples:');
    for (const item of broken.slice(0, 20)) {
      console.log(`- [${item.status}] ${item.url}`);
      for (const usage of item.usedBy) {
        console.log(`    used by: ${usage.title} (${usage.id})`);
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
