import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================================================
  // 1. CREATE CATEGORIES
  // ============================================================================
  console.log("📁 Creating categories...");

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Electronics",
        slug: "electronics",
        description: "Laptops, phones, tablets, and accessories",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      },
    }),
    prisma.category.create({
      data: {
        name: "Clothing",
        slug: "clothing",
        description: "T-shirts, pants, dress, jackets, and more",
        image: "https://images.unsplash.com/photo-1489195846599-be01fe66ad8f?w=500",
      },
    }),
    prisma.category.create({
      data: {
        name: "Home & Kitchen",
        slug: "home-kitchen",
        description: "Furniture, cookware, bedding, and decor",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500",
      },
    }),
    prisma.category.create({
      data: {
        name: "Sports & Outdoors",
        slug: "sports-outdoors",
        description: "Sports equipment, camping gear, and fitness",
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500",
      },
    }),
    prisma.category.create({
      data: {
        name: "Books & Media",
        slug: "books-media",
        description: "Books, eBooks, music, and movies",
        image: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500",
      },
    }),
    prisma.category.create({
      data: {
        name: "Health & Beauty",
        slug: "health-beauty",
        description: "Skincare, cosmetics, supplements, and wellness",
        image: "https://images.unsplash.com/photo-1556228578-c6d4938c1da8?w=500",
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories\n`);

  // ============================================================================
  // 2. CREATE SELLERS
  // ============================================================================
  console.log("🏪 Creating sellers...");

  const sellers = await Promise.all([
    prisma.seller.create({
      data: {
        storeName: "TechWorld BD",
        email: "contact@techworld.bd",
        phone: "+8809622123456",
        description: "Leading electronics seller in Bangladesh",
        logo: "https://via.placeholder.com/200?text=TechWorld+BD",
        banner: "https://via.placeholder.com/1200x300?text=TechWorld+BD",
        location: "Dhaka",
        address: "123 Tech Street, Gulshan, Dhaka",
        isVerified: true,
        rating: new Decimal("4.5"),
        reviewCount: 1250,
      },
    }),
    prisma.seller.create({
      data: {
        storeName: "FashionHub",
        email: "hello@fashionhub.bd",
        phone: "+8809622654321",
        description: "Premium clothing and fashion accessories",
        logo: "https://via.placeholder.com/200?text=FashionHub",
        banner: "https://via.placeholder.com/1200x300?text=FashionHub",
        location: "Dhaka",
        address: "456 Fashion Ave, Motijheel, Dhaka",
        isVerified: true,
        rating: new Decimal("4.8"),
        reviewCount: 890,
      },
    }),
    prisma.seller.create({
      data: {
        storeName: "Home Essentials",
        email: "sales@homeessentials.bd",
        phone: "+8809623987654",
        description: "Quality home and kitchen products",
        logo: "https://via.placeholder.com/200?text=Home+Essentials",
        banner: "https://via.placeholder.com/1200x300?text=Home+Essentials",
        location: "Chittagong",
        address: "789 Home Plaza, Kawran Bazar, Dhaka",
        isVerified: true,
        rating: new Decimal("4.6"),
        reviewCount: 650,
      },
    }),
    prisma.seller.create({
      data: {
        storeName: "Sports Central",
        email: "info@sportscentral.bd",
        phone: "+8809624567890",
        description: "Complete sports equipment and fitness gear",
        logo: "https://via.placeholder.com/200?text=Sports+Central",
        banner: "https://via.placeholder.com/1200x300?text=Sports+Central",
        location: "Dhaka",
        address: "321 Sports Complex, Banani, Dhaka",
        isVerified: true,
        rating: new Decimal("4.4"),
        reviewCount: 520,
      },
    }),
  ]);

  console.log(`✓ Created ${sellers.length} sellers\n`);

  // ============================================================================
  // 3. CREATE SAMPLE PRODUCTS
  // ============================================================================
  console.log("📦 Creating products...");

  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        title: "MacBook Pro 14-inch M3",
        slug: "macbook-pro-14-m3",
        sku: "MB-PRO-14-M3-001",
        description: "Powerful laptop for professionals with M3 chip, 16GB RAM, 512GB SSD",
        originalPrice: new Decimal("350000"),
        currentPrice: new Decimal("315000"),
        mainImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"],
        stock: 15,
        lowStockThreshold: 5,
        categoryId: categories[0].id,
        sellerId: sellers[0].id,
        rating: new Decimal("4.8"),
        reviewCount: 245,
        specifications: {
          processor: "Apple M3",
          ram: "16GB",
          storage: "512GB SSD",
          display: "14-inch",
          weight: "1.6kg",
        },
        certifications: ["official", "warranty"],
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        title: "Samsung Galaxy S24 Ultra",
        slug: "samsung-galaxy-s24-ultra",
        sku: "SGS-24-ULTRA-001",
        description: "Latest flagship smartphone with 200MP camera",
        originalPrice: new Decimal("150000"),
        currentPrice: new Decimal("125000"),
        mainImage: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500",
        images: ["https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500"],
        stock: 45,
        lowStockThreshold: 10,
        categoryId: categories[0].id,
        sellerId: sellers[0].id,
        rating: new Decimal("4.7"),
        reviewCount: 512,
        specifications: {
          storage: "256GB",
          ram: "12GB",
          camera: "200MP",
          display: "6.8-inch AMOLED",
          processor: "Snapdragon 8 Gen 3",
        },
        certifications: ["official"],
        isActive: true,
        isFeatured: true,
      },
    }),
    // Clothing
    prisma.product.create({
      data: {
        title: "Premium Cotton T-Shirt Pack",
        slug: "premium-cotton-tshirt-pack",
        sku: "TSH-COTT-PACK-001",
        description: "Set of 5 comfortable cotton t-shirts perfect for daily wear",
        originalPrice: new Decimal("2500"),
        currentPrice: new Decimal("1999"),
        mainImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"],
        stock: 120,
        lowStockThreshold: 30,
        categoryId: categories[1].id,
        sellerId: sellers[1].id,
        rating: new Decimal("4.5"),
        reviewCount: 380,
        specifications: {
          material: "100% Cotton",
          sizes: "S, M, L, XL, XXL",
          quantity: "5 pieces",
          color: "Multi-color assorted",
        },
        certifications: ["organic", "eco-friendly"],
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        title: "Denim Jeans - Blue Classic",
        slug: "denim-jeans-blue-classic",
        sku: "JEANS-BLUE-001",
        description: "Classic blue denim jeans with perfect fit and comfort",
        originalPrice: new Decimal("3500"),
        currentPrice: new Decimal("2800"),
        mainImage: "https://images.unsplash.com/photo-1542272604-787c62e4d0d8?w=500",
        images: ["https://images.unsplash.com/photo-1542272604-787c62e4d0d8?w=500"],
        stock: 85,
        lowStockThreshold: 20,
        categoryId: categories[1].id,
        sellerId: sellers[1].id,
        rating: new Decimal("4.6"),
        reviewCount: 290,
        specifications: {
          material: "99% Cotton, 1% Spandex",
          sizes: "28 to 42",
          color: "Deep Blue",
          style: "Classic Straight",
        },
        certifications: [],
        isActive: true,
        isFeatured: false,
      },
    }),
    // Home & Kitchen
    prisma.product.create({
      data: {
        title: "Stainless Steel Kitchen Knife Set",
        slug: "stainless-kitchen-knife-set",
        sku: "KNIFE-SET-001",
        description: "Professional 7-piece kitchen knife set with wooden block",
        originalPrice: new Decimal("4500"),
        currentPrice: new Decimal("3200"),
        mainImage: "https://images.unsplash.com/photo-1588273889974-48eaf60a26be?w=500",
        images: ["https://images.unsplash.com/photo-1588273889974-48eaf60a26be?w=500"],
        stock: 32,
        lowStockThreshold: 8,
        categoryId: categories[2].id,
        sellerId: sellers[2].id,
        rating: new Decimal("4.7"),
        reviewCount: 145,
        specifications: {
          material: "Stainless Steel",
          pieces: "7-piece set",
          blades: "German-grade steel",
          includes: "Wooden block",
        },
        certifications: ["food-safe"],
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        title: "Comfort Cotton Bedsheet Set",
        slug: "comfort-cotton-bedsheet-set",
        sku: "BED-SHEET-001",
        description: "Luxury 400-thread count cotton bedsheet set (Queen size)",
        originalPrice: new Decimal("6000"),
        currentPrice: new Decimal("4499"),
        mainImage: "https://images.unsplash.com/photo-1584622281867-8759c6673ce6?w=500",
        images: ["https://images.unsplash.com/photo-1584622281867-8759c6673ce6?w=500"],
        stock: 58,
        lowStockThreshold: 15,
        categoryId: categories[2].id,
        sellerId: sellers[2].id,
        rating: new Decimal("4.9"),
        reviewCount: 567,
        specifications: {
          material: "100% Pure Cotton",
          size: "Queen (90x100 inches)",
          threadCount: "400 TC",
          includes: "2 pillowcases",
        },
        certifications: ["certified-cotton"],
        isActive: true,
        isFeatured: true,
      },
    }),
    // Sports & Outdoors
    prisma.product.create({
      data: {
        title: "Professional Yoga Mat with Strap",
        slug: "professional-yoga-mat-strap",
        sku: "YOGA-MAT-001",
        description: "Non-slip premium yoga mat 6mm thickness with carrying strap",
        originalPrice: new Decimal("2800"),
        currentPrice: new Decimal("1999"),
        mainImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500",
        images: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500"],
        stock: 95,
        lowStockThreshold: 25,
        categoryId: categories[3].id,
        sellerId: sellers[3].id,
        rating: new Decimal("4.6"),
        reviewCount: 234,
        specifications: {
          material: "TPE (Non-toxic)",
          thickness: "6mm",
          length: "183cm",
          width: "61cm",
          includes: "Carrying strap",
        },
        certifications: ["eco-friendly"],
        isActive: true,
        isFeatured: false,
      },
    }),
    prisma.product.create({
      data: {
        title: "Professional Dumbbell Set 10kg",
        slug: "professional-dumbbell-set-10kg",
        sku: "DUMB-10KG-001",
        description: "Adjustable dumbbell set perfect for home gym",
        originalPrice: new Decimal("8500"),
        currentPrice: new Decimal("6999"),
        mainImage: "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500",
        images: ["https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500"],
        stock: 22,
        lowStockThreshold: 5,
        categoryId: categories[3].id,
        sellerId: sellers[3].id,
        rating: new Decimal("4.8"),
        reviewCount: 189,
        specifications: {
          totalWeight: "10kg set (2x5kg)",
          material: "Cast Iron",
          gripping: "Rubber coated",
          includes: "Dumbbell stand",
        },
        certifications: [],
        isActive: true,
        isFeatured: true,
      },
    }),
  ]);

  console.log(`✓ Created ${products.length} products\n`);

  // ============================================================================
  // 4. CREATE TEST USERS
  // ============================================================================
  console.log("👥 Creating users...");

  const adminPassword = await bcryptjs.hash("Admin@123", 10);
  const customerPassword = await bcryptjs.hash("Customer@123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@globalhub.com",
        phone: "+8801700000000",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        emailVerified: new Date(),
        phoneVerified: new Date(),
        isActive: true,
        language: "en",
        currency: "BDT",
      },
    }),
    prisma.user.create({
      data: {
        email: "customer@globalhub.com",
        phone: "+8801800000001",
        password: customerPassword,
        firstName: "John",
        lastName: "Doe",
        role: "CUSTOMER",
        emailVerified: new Date(),
        phoneVerified: new Date(),
        isActive: true,
        language: "en",
        currency: "BDT",
      },
    }),
    prisma.user.create({
      data: {
        email: "seller@globalhub.com",
        phone: "+8801800000002",
        password: customerPassword,
        firstName: "Seller",
        lastName: "Account",
        role: "SELLER",
        emailVerified: new Date(),
        phoneVerified: new Date(),
        isActive: true,
        language: "en",
        currency: "BDT",
      },
    }),
  ]);

  console.log(`✓ Created ${users.length} test users`);
  console.log(`  - Admin: admin@globalhub.com / Admin@123`);
  console.log(`  - Customer: customer@globalhub.com / Customer@123\n`);

  // ============================================================================
  // 5. CREATE USER ADDRESSES
  // ============================================================================
  console.log("📍 Creating user addresses...");

  await Promise.all([
    prisma.userAddress.create({
      data: {
        userId: users[1].id,
        label: "Home",
        firstName: "John",
        lastName: "Doe",
        phone: "+8801800000001",
        email: "john.doe@example.com",
        division: "Dhaka",
        district: "Dhaka",
        upazila: "Gulshan",
        address: "123 Main Street, Apartment 4B",
        postCode: "1212",
        isDefault: true,
      },
    }),
    prisma.userAddress.create({
      data: {
        userId: users[1].id,
        label: "Office",
        firstName: "John",
        lastName: "Doe",
        phone: "+8801800000001",
        email: "john.doe.office@example.com",
        division: "Dhaka",
        district: "Dhaka",
        upazila: "Motijheel",
        address: "456 Business Park, Suite 100",
        postCode: "1000",
        isDefault: false,
      },
    }),
  ]);

  console.log(`✓ Created user addresses\n`);

  // ============================================================================
  // 6. CREATE PAYMENT GATEWAY CONFIGURATIONS
  // ============================================================================
  console.log("💳 Creating payment gateway configurations...");

  await Promise.all([
    prisma.paymentGatewayConfig.create({
      data: {
        gatewayName: "uddoktapay",
        displayName: "UddoktaPay",
        isEnabled: true,
        isPrimary: true,
        priority: 1,
        apiKey: "UDDOKTAPAY_API_KEY_HERE",
        apiSecret: "UDDOKTAPAY_SECRET_HERE",
        merchantId: "UDDOKTAPAY_MERCHANT_ID",
        webhookUrl: "https://yourapp.com/api/webhooks/uddoktapay",
        transactionFee: new Decimal("1.5"),
        fixedFee: new Decimal("0"),
        minAmount: new Decimal("10"),
        maxAmount: new Decimal("5000000"),
        description: "Bangladesh payment gateway - UddoktaPay",
        logoUrl: "https://uddoktapay.com/logo.png",
        supportUrl: "https://uddoktapay.com/support",
      },
    }),
    prisma.paymentGatewayConfig.create({
      data: {
        gatewayName: "stripe",
        displayName: "Stripe",
        isEnabled: true,
        isPrimary: false,
        priority: 2,
        apiKey: "STRIPE_API_KEY_HERE",
        apiSecret: "STRIPE_SECRET_HERE",
        merchantId: "STRIPE_MERCHANT_ID",
        webhookUrl: "https://yourapp.com/api/webhooks/stripe",
        transactionFee: new Decimal("2.9"),
        fixedFee: new Decimal("30"),
        minAmount: new Decimal("50"),
        maxAmount: new Decimal("9999999"),
        description: "International card payments via Stripe",
        logoUrl: "https://stripe.com/logo.png",
        supportUrl: "https://stripe.com/support",
      },
    }),
    prisma.paymentGatewayConfig.create({
      data: {
        gatewayName: "bkash",
        displayName: "bKash",
        isEnabled: true,
        isPrimary: false,
        priority: 3,
        apiKey: "BKASH_API_KEY_HERE",
        apiSecret: "BKASH_SECRET_HERE",
        merchantId: "BKASH_MERCHANT_ID",
        webhookUrl: "https://yourapp.com/api/webhooks/bkash",
        transactionFee: new Decimal("1.85"),
        fixedFee: new Decimal("0"),
        minAmount: new Decimal("10"),
        maxAmount: new Decimal("500000"),
        description: "Mobile wallet - bKash",
        logoUrl: "https://bkash.com/logo.png",
        supportUrl: "https://bkash.com/support",
      },
    }),
    prisma.paymentGatewayConfig.create({
      data: {
        gatewayName: "nagad",
        displayName: "Nagad",
        isEnabled: true,
        isPrimary: false,
        priority: 4,
        apiKey: "NAGAD_API_KEY_HERE",
        apiSecret: "NAGAD_SECRET_HERE",
        merchantId: "NAGAD_MERCHANT_ID",
        webhookUrl: "https://yourapp.com/api/webhooks/nagad",
        transactionFee: new Decimal("1.5"),
        fixedFee: new Decimal("0"),
        minAmount: new Decimal("10"),
        maxAmount: new Decimal("500000"),
        description: "Mobile wallet - Nagad",
        logoUrl: "https://nagad.com/logo.png",
        supportUrl: "https://nagad.com/support",
      },
    }),
    prisma.paymentGatewayConfig.create({
      data: {
        gatewayName: "rocket",
        displayName: "Rocket",
        isEnabled: true,
        isPrimary: false,
        priority: 5,
        apiKey: "ROCKET_API_KEY_HERE",
        apiSecret: "ROCKET_SECRET_HERE",
        merchantId: "ROCKET_MERCHANT_ID",
        webhookUrl: "https://yourapp.com/api/webhooks/rocket",
        transactionFee: new Decimal("1.5"),
        fixedFee: new Decimal("0"),
        minAmount: new Decimal("10"),
        maxAmount: new Decimal("500000"),
        description: "Mobile wallet - Rocket",
        logoUrl: "https://rocket.com/logo.png",
        supportUrl: "https://rocket.com/support",
      },
    }),
  ]);

  console.log(`✓ Created payment gateway configurations (5 gateways)`);
  console.log(`  - UddoktaPay (Primary)`);
  console.log(`  - Stripe (International cards)`);
  console.log(`  - bKash, Nagad, Rocket (Mobile wallets)\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✨ Database seeding completed successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📊 Data Summary:");
  console.log(`  • ${categories.length} Categories`);
  console.log(`  • ${sellers.length} Sellers`);
  console.log(`  • ${products.length} Products`);
  console.log(`  • ${users.length} Users`);
  console.log(`  • 2 User Addresses`);
  console.log(`  • 5 Payment Gateways\n`);

  console.log("🔑 Test Credentials:");
  console.log(`  Admin: admin@globalhub.com / Admin@123`);
  console.log(`  Customer: customer@globalhub.com / Customer@123\n`);

  console.log("🚀 Next Steps:");
  console.log(`  1. Update payment gateway API keys in database`);
  console.log(`  2. Run: npm run dev`);
  console.log(`  3. Visit: http://localhost:3000\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
