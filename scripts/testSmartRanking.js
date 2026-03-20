const { liveMarketplaceSearch } = require('../src/lib/liveMarketplaceSearch');

async function test() {
  console.log('Testing Smart Ranking System...\n');
  
  const queries = ['phone', 'fan', 'honey'];
  
  for (const q of queries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${q}"`);
    console.log('='.repeat(60));
    
    try {
      const result = await liveMarketplaceSearch(q, 5);
      
      console.log(`\nDomestic Results (${result.domestic.length} total):`);
      result.domestic.slice(0, 5).forEach((o, i) => {
        const discount = o.originalPrice > 0 
          ? Math.round(((o.originalPrice - o.currentPrice) / o.originalPrice) * 100)
          : 0;
        console.log(`  ${i+1}. [${o.platform.toUpperCase()}] ${o.title.substring(0, 50)}`);
        console.log(`     Price: ${o.currentPrice} (was ${o.originalPrice}) | Discount: ${discount}%`);
      });
      
      console.log(`\nInternational Results (${result.international.length} total):`);
      result.international.slice(0, 5).forEach((o, i) => {
        const discount = o.originalPrice > 0 
          ? Math.round(((o.originalPrice - o.currentPrice) / o.originalPrice) * 100)
          : 0;
        console.log(`  ${i+1}. [${o.platform.toUpperCase()}] ${o.title.substring(0, 50)}`);
        console.log(`     Price: ${o.currentPrice} (was ${o.originalPrice}) | Discount: ${discount}%`);
      });
      
      if (result.coverage) {
        console.log(`\nCoverage: ${result.coverage}`);
      }
      
      if (result.errors.length > 0) {
        console.log(`\nErrors: ${result.errors.join('; ')}`);
      }
    } catch (error) {
      console.error(`Error testing "${q}":`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
}

test();
