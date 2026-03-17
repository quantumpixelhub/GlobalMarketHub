# 5. Database Design

**GlobalMarketHub** - Database Schema & Structure  
**Version**: 1.0  
**Last Updated**: March 2026

---

## Database Selection: PostgreSQL

### Why PostgreSQL?
- ✅ Excellent for relational data (Users, Products, Orders)
- ✅ Full-text search capabilities
- ✅ JSONB for flexible product variants
- ✅ Strong consistency guarantees
- ✅ Excellent for e-commerce workloads
- ✅ Open-source with large community

---

## Database Schema

### 1. USERS Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender ENUM('male', 'female', 'other'),
  date_of_birth DATE,
  avatar_url TEXT,
  
  -- Account Status
  is_verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(6),
  verification_code_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  
  -- Role & Preferences
  role ENUM('customer', 'seller', 'admin', 'moderator') DEFAULT 'customer',
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sms_notifications": true,
    "promotional": true,
    "order_updates": true,
    "price_alerts": true
  }',
  preferred_language ENUM('en', 'bn') DEFAULT 'en',
  preferred_currency VARCHAR(3) DEFAULT 'BDT',
  
  -- Tracking
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  INDEX idx_users_phone (phone),
  INDEX idx_users_email (email),
  INDEX idx_users_created_at (created_at DESC),
  INDEX idx_users_role (role)
);
```

### 2. USER_ADDRESSES Table

```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Address Components
  division VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  area VARCHAR(100) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  apartment_number VARCHAR(50),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Address Type
  address_type ENUM('home', 'office', 'other') DEFAULT 'home',
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_addresses_user_id (user_id),
  INDEX idx_user_addresses_is_default (user_id, is_default)
);
```

### 3. CATEGORIES Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon_url TEXT,
  parent_category_id UUID REFERENCES categories(id),
  
  -- Sorting
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_parent (parent_category_id),
  INDEX idx_categories_active (is_active)
);

-- Example categories:
-- Organic Food > Grains, Spices, Oil, Honey...
-- Skincare > Face Care, Body Care, Sun Protection...
-- Cosmetics > Makeup, Nail, Hair...
```

### 4. SELLERS Table

```sql
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Ratings & Stats
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  verification_documents JSONB,
  
  -- Performance Metrics
  response_time_hours DECIMAL(5, 2),
  return_policy_days INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sellers_user_id (user_id),
  INDEX idx_sellers_verified (is_verified),
  INDEX idx_sellers_active (is_active)
);
```

### 5. PRODUCTS Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  
  -- Category & Classification
  category_id UUID NOT NULL REFERENCES categories(id),
  sub_category_id UUID REFERENCES categories(id),
  brand VARCHAR(100),
  
  -- Seller & Source
  seller_id UUID NOT NULL REFERENCES sellers(id),
  external_platform ENUM('daraz', 'pickaboo', 'sajgoj', 'internal'),
  external_product_id VARCHAR(255),
  
  -- Pricing
  price DECIMAL(12, 2) NOT NULL,
  original_price DECIMAL(12, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  cost_price DECIMAL(12, 2),
  
  -- Images
  primary_image_url TEXT,
  image_urls JSONB, -- Array of image URLs
  
  -- Stock
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Ratings & Reviews
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Certifications
  certifications JSONB DEFAULT '[]', -- ["organic", "cruelty-free", "vegan"]
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_sku (sku),
  INDEX idx_products_price (price),
  INDEX idx_products_rating (average_rating DESC),
  INDEX idx_products_active (is_active),
  INDEX idx_products_external (external_platform, external_product_id)
);
```

### 6. PRODUCT_VARIANTS Table

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant Attributes
  attributes JSONB NOT NULL, -- {"size": "50ml", "color": "blue"}
  variant_sku VARCHAR(100) NOT NULL,
  
  -- Pricing (can override product price)
  price DECIMAL(12, 2),
  original_price DECIMAL(12, 2),
  
  -- Media
  image_urls JSONB,
  
  -- Stock
  stock_quantity INTEGER DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE (product_id, variant_sku),
  INDEX idx_variants_product (product_id),
  INDEX idx_variants_sku (variant_sku)
);
```

### 7. PRODUCT_SPECIFICATIONS Table

```sql
CREATE TABLE product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  spec_key VARCHAR(100) NOT NULL,
  spec_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_specs_product (product_id)
);

-- Examples:
-- (product_id, "Volume", "50ml")
-- (product_id, "Ingredients", "Vitamin C...")
-- (product_id, "Shelf Life", "24 months")
```

### 8. CART Table

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status ENUM('active', 'abandoned', 'checked_out') DEFAULT 'active',
  
  -- Coupon
  coupon_code VARCHAR(50),
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  abandoned_at TIMESTAMP,
  
  UNIQUE (user_id, status), -- One active cart per user
  INDEX idx_carts_user (user_id),
  INDEX idx_carts_status (status, abandoned_at)
);
```

### 9. CART_ITEMS Table

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_add DECIMAL(12, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cart_id) REFERENCES carts(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE (cart_id, product_id, variant_id),
  INDEX idx_cart_items_cart (cart_id),
  INDEX idx_cart_items_product (product_id)
);
```

### 10. COUPONS Table

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(12, 2),
  
  minimum_order_amount DECIMAL(12, 2) DEFAULT 0,
  maximum_usage INTEGER,
  usage_count INTEGER DEFAULT 0,
  
  applicable_categories JSONB, -- null = all categories
  
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_active (is_active, valid_until)
);
```

### 11. ORDERS Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE, -- GMH-2026-033419
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Shipping
  shipping_address_id UUID NOT NULL REFERENCES user_addresses(id),
  shipping_method ENUM('standard', 'express', 'scheduled') DEFAULT 'standard',
  shipping_cost DECIMAL(12, 2) NOT NULL,
  tracking_number VARCHAR(100),
  
  -- Payment
  payment_method ENUM('cod', 'bkash', 'card', 'nagad') NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_details JSONB,
  
  -- Pricing
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  -- Coupon
  coupon_code VARCHAR(50),
  
  -- Status
  order_status ENUM(
    'pending',      -- Awaiting confirmation
    'confirmed',    -- Confirmed by seller
    'processing',   -- Being packed
    'shipped',      -- Out for delivery
    'delivered',    -- Delivered
    'cancelled',    -- Cancelled by user/system
    'returned',     -- Returned by customer
    'failed'        -- Payment failed
  ) DEFAULT 'pending',
  
  -- Dates
  expected_delivery_date DATE,
  delivered_at TIMESTAMP,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_created (created_at DESC),
  INDEX idx_orders_tracking (tracking_number)
);
```

### 12. ORDER_ITEMS Table

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  
  product_title VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  
  -- Fulfillment
  item_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
);
```

### 13. PAYMENTS Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  payment_method ENUM('cod', 'bkash', 'card', 'nagad') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  
  -- Payment Gateway Details
  gateway_payment_id VARCHAR(255), -- From bKash, Stripe, etc.
  transaction_id VARCHAR(255),
  
  -- Status
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  
  -- Metadata
  payment_data JSONB, -- Full response from payment gateway
  failed_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_transaction (transaction_id)
);
```

### 14. REVIEWS Table

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  order_item_id UUID REFERENCES order_items(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Media
  image_urls JSONB, -- Array of review images
  
  -- Helpful Votes
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  -- Seller Response
  seller_response TEXT,
  seller_response_at TIMESTAMP,
  responded_by_user_id UUID REFERENCES users(id),
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false, -- Manual approval
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (product_id, user_id, order_item_id), -- One review per purchase
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_rating (rating),
  INDEX idx_reviews_approved (is_approved, created_at DESC)
);
```

### 15. WISHLIST Table

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Price Tracking
  price_when_added DECIMAL(12, 2),
  lowest_price_seen DECIMAL(12, 2),
  price_drop_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (user_id, product_id),
  INDEX idx_wishlists_user (user_id),
  INDEX idx_wishlists_product (product_id)
);
```

### 16. PRICE_HISTORY Table

```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  original_price DECIMAL(12, 2),
  
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_price_history_product (product_id, recorded_at DESC)
);
```

### 17. NOTIFICATIONS Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type ENUM(
    'order_status',
    'price_drop',
    'back_in_stock',
    'review_response',
    'promotional',
    'system'
  ) NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Data
  related_product_id UUID REFERENCES products(id),
  related_order_id UUID REFERENCES orders(id),
  
  -- Delivery
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (user_id, is_read),
  INDEX idx_notifications_created (created_at DESC)
);
```

### 18. PRODUCT_COMPARISON Table

```sql
CREATE TABLE product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  
  product_ids JSONB NOT NULL, -- ["id1", "id2", "id3"]
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  INDEX idx_comparisons_user (user_id),
  INDEX idx_comparisons_session (session_id)
);
```

### 19. EXTERNAL_PRODUCTS Table (for syncing)

```sql
CREATE TABLE external_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platform ENUM('daraz', 'pickaboo', 'sajgoj') NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  
  -- Mapped product
  product_id UUID REFERENCES products(id),
  
  -- Last sync
  last_synced_at TIMESTAMP,
  sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (platform, external_id),
  INDEX idx_external_products_product (product_id),
  INDEX idx_external_products_platform (platform)
);
```

### 20. AUDIT_LOG Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  
  changes JSONB, -- Before/after values
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created (created_at DESC)
);
```

---

## Relationships Diagram

```
users
├── has_many user_addresses
├── has_many carts
├── has_many orders
├── has_many reviews
├── has_many wishlists
├── has_many notifications
└── has_one sellers (if role=seller)

sellers
├── belongs_to users
├── has_many products
└── has_many order_items

categories
├── has_many products
└── has_many sub_categories (self-join)

products
├── belongs_to categories
├── belongs_to sellers
├── has_many product_variants
├── has_many product_specifications
├── has_many reviews
├── has_many cart_items
├── has_many order_items
├── has_many wishlists
└── has_many price_history

orders
├── belongs_to users
├── has_many order_items
├── has_many payments
└── belongs_to user_addresses (shipping)

reviews
├── belongs_to products
├── belongs_to users
└── belongs_to order_items
```

---

## Indexing Strategy

### High-Priority Indexes (Query Performance)

```sql
-- User lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Product searches
CREATE INDEX idx_products_category (category_id);
CREATE INDEX idx_products_price (price);
CREATE INDEX idx_products_rating (average_rating DESC);

-- Order tracking
CREATE INDEX idx_orders_user (user_id);
CREATE INDEX idx_orders_status (order_status);

-- Cart operations
CREATE INDEX idx_cart_items_cart (cart_id);

-- Review queries
CREATE INDEX idx_reviews_product (product_id);
```

### Full-Text Search Index (for Meilisearch sync)

```sql
-- Products vector for full-text search
CREATE INDEX idx_products_title_description 
ON products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### Composite Indexes (for complex queries)

```sql
-- Get user's orders by status
CREATE INDEX idx_orders_user_status ON orders(user_id, order_status);

-- Get active coupons
CREATE INDEX idx_coupons_active_dates ON coupons(is_active, valid_from, valid_until);

-- Get product variants
CREATE INDEX idx_variants_product_sku ON product_variants(product_id, variant_sku);
```

---

## Data Integrity Constraints

```sql
-- Check constraints
ALTER TABLE products ADD CONSTRAINT price_positive CHECK (price > 0);
ALTER TABLE reviews ADD CONSTRAINT rating_valid CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE cart_items ADD CONSTRAINT quantity_positive CHECK (quantity > 0);
ALTER TABLE orders ADD CONSTRAINT total_positive CHECK (total_amount >= 0);

-- Unique constraints
ALTER TABLE users ADD CONSTRAINT unique_phone UNIQUE (phone);
ALTER TABLE products ADD CONSTRAINT unique_sku UNIQUE (sku);
ALTER TABLE coupons ADD CONSTRAINT unique_code UNIQUE (code);

-- Foreign key constraints with cascading
ALTER TABLE cart_items 
  ADD CONSTRAINT fk_cart_items_cart 
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;
```

---

## Prisma Schema (ORM Definition)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  phone           String   @unique
  email           String?  @unique
  passwordHash    String
  fullName        String
  gender          Gender?
  dateOfBirth     DateTime?
  avatarUrl       String?
  
  isVerified      Boolean  @default(false)
  isActive        Boolean  @default(true)
  isBanned        Boolean  @default(false)
  
  role            UserRole @default(customer)
  notificationPreferences Json  @default("{\"email_notifications\": true}")
  preferredLanguage String  @default("en")
  preferredCurrency String  @default("BDT")
  
  lastLoginAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  
  // Relations
  addresses       UserAddress[]
  carts           Cart[]
  orders          Order[]
  reviews         Review[]
  wishlists       Wishlist[]
  notifications   Notification[]
  
  @@index([phone])
  @@index([email])
  @@index([createdAt(sort: Desc)])
}

model Product {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title           String
  description     String?
  sku             String   @unique
  
  categoryId      String   @db.Uuid
  category        Category @relation(fields: [categoryId], references: [id])
  
  sellerId        String   @db.Uuid
  seller          Seller   @relation(fields: [sellerId], references: [id])
  
  price           Decimal  @db.Decimal(12, 2)
  originalPrice   Decimal? @db.Decimal(12, 2)
  
  stock           Int      @default(0)
  averageRating   Decimal  @default(0) @db.Decimal(3, 2)
  totalReviews    Int      @default(0)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  variants        ProductVariant[]
  reviews         Review[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  wishlists       Wishlist[]
  
  @@index([categoryId])
  @@index([sellerId])
  @@index([price])
  @@index([averageRating(sort: Desc)])
}

model Order {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderNumber     String   @unique
  
  userId          String   @db.Uuid
  user            User     @relation(fields: [userId], references: [id])
  
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus  @default(pending)
  orderStatus     OrderStatus    @default(pending)
  
  subtotal        Decimal  @db.Decimal(12, 2)
  tax             Decimal  @db.Decimal(12, 2)
  discount        Decimal  @db.Decimal(12, 2)
  totalAmount     Decimal  @db.Decimal(12, 2)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  items           OrderItem[]
  payments        Payment[]
  
  @@index([userId])
  @@index([orderStatus])
  @@index([createdAt(sort: Desc)])
}

// ... more models ...

enum UserRole {
  customer
  seller
  admin
  moderator
}

enum OrderStatus {
  pending
  confirmed
  processing
  shipped
  delivered
  cancelled
  returned
  failed
}

enum PaymentMethod {
  cod
  bkash
  card
  nagad
}

enum PaymentStatus {
  pending
  processing
  completed
  failed
  refunded
}
```

---

## Migration Strategy

### Development
```bash
npx prisma migrate dev --name add_product_table
```

### Production
```bash
npx prisma migrate deploy
```

### Key Migrations
1. Initial schema (users, categories, products)
2. Add sellers and sellers table
3. Add orders and payments
4. Add reviews and ratings
5. Add price tracking
6. Add external products sync

---

## Performance Optimization Tips

1. **Analyze Query Plans**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'xyz';
   ```

2. **Monitor Slow Queries**
   - Enable query logging for slow queries > 1s
   - Analyze and add indexes as needed

3. **Connection Pooling**
   - Use PgBouncer or Prisma Client connection pooling
   - Set appropriate pool size (10-20 connections)

4. **Backup Strategy**
   - Daily automated backups to S3
   - Weekly manual backups
   - Point-in-time recovery enabled

---

**Database Version**: 1.0  
**PostgreSQL Version**: 15.x  
**Last Updated**: March 2026
