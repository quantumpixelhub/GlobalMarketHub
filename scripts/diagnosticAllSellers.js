const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SELLERS = [
  'daraz', 'evaly', 'ajkerdeal', 'priyoshop', 'othoba', 'bagdoom', 'clickbd', 'bdstall', 'unikart',
  'meena-click', 'bikroy', 'chaldal', 'shwapno', 'rokomari', 'boighar', 'pickaboo', 'startech',
  'ryans', 'techland-bd', 'gadget-and-gear', 'aarong', 'yellow', 'sailor', 'cats-eye', 'ecstasy',
  'easy', 'milan', 'top-ten', 'shajgoj', 'beauty-booth-bd', 'bbb', 'livewire', 'take-and-talks-bd',
  'alibaba', 'aliexpress', 'amazon', 'bestelectronics', 'bdhardwarestore', 'totaltools-bd',
  'ingco-bd', 'waltonplaza', 'computersource', 'hatil', 'otobi', 'regalfurniture', 'rflbestbuy',
  'ghorerbazar', 'healthrevolutionbd'
];

const QUERY = process.env.SEARCH_QUERY || 'phone';
const MAX_RESULTS = 200;

async function main() {
  console.log(`\n=== Diagnostic: All Sellers with Query "${QUERY}" ===\n`);
  
  const results = {};
  
  for (const seller of SELLERS) {
    const count = await prisma.externalProduct.count({
      where: {
        platform: seller,
        title: { contains: QUERY, mode: 'insensitive' }
      }
    });
    
    results[seller] = count;
  }
  
  // Sort by count descending
  const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
  
  console.log('Seller Performance for Query "' + QUERY + '":\n');
  console.log('Rank | Seller                  | Count');
  console.log('-----|-------------------------|-------');
  
  sorted.forEach((entry, idx) => {
    const [seller, count] = entry;
    const status = count > 0 ? '✓' : '✗';
    console.log(`${(idx + 1).toString().padEnd(4)} | ${seller.padEnd(23)} | ${count.toString().padStart(5)} ${status}`);
  });
  
  const totalProducts = sorted.reduce((sum, [_, count]) => sum + count, 0);
  const workingSellers = sorted.filter(([_, count]) => count > 0).length;
  
  console.log('\n-----|-------------------------|-------');
  console.log(`Total unique products across all sellers: ${totalProducts}`);
  console.log(`Working sellers: ${workingSellers}/${SELLERS.length}`);
  console.log(`Broken sellers: ${SELLERS.length - workingSellers}/${SELLERS.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
