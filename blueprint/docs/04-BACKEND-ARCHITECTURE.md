# 4. Backend Architecture

**GlobalMarketHub** - Vercel Serverless Backend & API Design  
**Version**: 2.0 (Updated)  
**Last Updated**: March 2026

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|----------|
| **Next.js** | 14.x | Full-stack framework (API Routes) |
| **Node.js** | 18.x LTS | Runtime (Vercel edge runtime) |
| **TypeScript** | 5.x | Type safety |

### Database & Caching
| Technology | Version | Purpose |
|-----------|---------|---------|
| **PostgreSQL** | 15.x | Primary relational database (via Supabase) |
| **Supabase** | Latest | Managed PostgreSQL, Auth, Real-time |
| **Prisma** | 5.x | ORM with migrations |

### Search & Indexing
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Meilisearch** | 1.x | Full-text search, filtering (optional) |
| **Supabase Full-Text Search** | Built-in | Native PostgreSQL full-text search |

### Authentication & Security
| Technology | Version | Purpose |
|-----------|---------|---------|
| **JWT (jsonwebtoken)** | 9.x | Token-based auth |
| **Bcrypt** | 5.x | Password hashing |
| **Passport** | 0.6.x | OAuth, social login |

### External Integrations
| Service | Purpose | Integration |
|---------|---------|-------------|
| **Daraz API** | Product aggregation | REST API / Affiliate |
| **Pickaboo API** | Product aggregation | REST API / Affiliate |
| **Sajgoj API** | Product aggregation | REST API / Affiliate |
| **UddoktaPay** | Payment gateway (Primary) | REST API |
| **Stripe** | International card payments | REST API / SDK |
| **bKash** | Mobile wallet (optional) | REST API |
| **Nagad/Rocket/iPay** | Mobile wallets (optional) | REST API |
| **EmailJS** | Email service | REST API / SDK |
| **Supabase Auth** | Authentication | Built-in |

### DevOps & Monitoring
| Technology | Purpose |
|-----------|---------|
| **Vercel** | Deployment & CI/CD (automatic from Git) |
| **GitHub Actions** | Optional additional CI/CD |
| **Supabase Logs** | Database & Error logging |
| **Vercel Analytics** | Built-in monitoring |
| **Console logs** | Development logging |

### Testing
| Technology | Purpose |
|-----------|---------|
| **Jest** | Unit testing |
| **Supertest** | API integration testing |
| **Artillery** | Load testing |

---

## Project Structure

```
src/
├── app/
│   ├── api/                           # Vercel API Routes (Backend)
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── verify-otp/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── logout/route.ts
│   │   │
│   │   ├── products/
│   │   │   ├── route.ts              # GET /api/products
│   │   │   ├── compare/route.ts      # POST /api/products/compare
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET /api/products/[id]
│   │   │       └── price-history/route.ts
│   │   │
│   │   ├── search/
│   │   │   ├── route.ts              # GET /api/search?q=...
│   │   │   └── suggestions/route.ts
│   │   │
│   │   ├── cart/
│   │   │   ├── route.ts              # GET/POST /api/cart
│   │   │   └── [itemId]/route.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── route.ts              # GET/POST /api/orders
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── tracking/route.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── uddoktapay/route.ts   # UddoktaPay payment
│   │   │   ├── stripe/route.ts       # Stripe payment
│   │   │   ├── methods/route.ts      # Admin: List payment methods
│   │   │   └── webhook/route.ts      # Payment webhooks
│   │   │
│   │   ├── reviews/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   ├── users/
│   │   │   ├── profile/route.ts
│   │   │   ├── addresses/route.ts
│   │   │   ├── wishlist/route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   └── admin/
│   │       ├── payments/config/route.ts  # Admin payment config
│   │       ├── dashboard/route.ts
│   │       └── users/route.ts
│   │
│   ├── (pages)/                       # Frontend pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── search/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── dashboard/
│   │   └── admin/
│   │
│   └── middleware.ts                  # Auth middleware
│   │
│   ├── services/                # Business logic
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── search.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── review.service.ts
│   │   ├── user.service.ts
│   │   ├── comparison.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   └── external-platform.service.ts  # Daraz, Pickaboo integration
│   │
│   ├── repositories/             # Database abstraction layer
│   │   ├── user.repository.ts
│   │   ├── product.repository.ts
│   │   ├── order.repository.ts
│   │   ├── review.repository.ts
│   │   ├── cart.repository.ts
│   │   └── payment.repository.ts
│   │
│   ├── routes/                  # API route definitions
│   │   ├── auth.routes.ts       # POST /api/auth/login, etc.
│   │   ├── products.routes.ts   # GET /api/products, etc.
│   │   ├── search.routes.ts     # GET /api/search
│   │   ├── cart.routes.ts       # POST/GET /api/cart
│   │   ├── orders.routes.ts     # POST/GET /api/orders
│   │   ├── payments.routes.ts   # POST /api/payments
│   │   ├── reviews.routes.ts    # POST/GET /api/reviews
│   │   ├── users.routes.ts      # GET/PUT /api/users
│   │   ├── comparison.routes.ts # POST /api/compare
│   │   └── admin.routes.ts      # Admin endpoints
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── rate-limit.middleware.ts
│   │   ├── validation.middleware.ts  # Request validation
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── cors.middleware.ts    # CORS configuration
│   │   ├── logging.middleware.ts # Request logging
│   │   └── sanitize.middleware.ts  # Input sanitization
│   │
│   ├── validators/              # Request validation schemas
│   │   ├── auth.validator.ts
│   │   ├── product.validator.ts
│   │   ├── order.validator.ts
│   │   ├── review.validator.ts
│   │   └── user.validator.ts
│   │
│   ├── models/                  # Prisma schema (database models)
│   │   └── schema.prisma        # Define in prisma/schema.prisma
│   │
│   ├── lib/                     # Utilities & helpers
│   │   ├── database.ts          # DB connection
│   │   ├── redis.ts             # Redis client
│   │   ├── logger.ts            # Logging setup
│   │   ├── jwt.ts               # JWT utilities
│   │   ├── errors.ts            # Custom error classes
│   │   ├── response.ts          # Response formatting
│   │   ├── constants.ts         # App constants
│   │   ├── validators.ts        # Zod schemas
│   │   ├── formatters.ts        # Data formatters
│   │   ├── cache.ts             # Cache utilities
│   │   ├── pagination.ts        # Pagination helpers
│   │   └── external-apis.ts     # External API clients
│   │
│   ├── jobs/                    # Background jobs
│   │   ├── sync-external-products.job.ts  # Periodically sync Daraz, etc.
│   │   ├── price-update.job.ts   # Update product prices
│   │   ├── notification.job.ts   # Send notifications
│   │   ├── abandoned-cart.job.ts # Email abandoned carts
│   │   └── price-tracking.job.ts # Track price history
│   │
│   ├── integrations/            # Third-party API integrations
│   │   ├── daraz.integration.ts
│   │   ├── pickaboo.integration.ts
│   │   ├── sajgoj.integration.ts
│   │   ├── bkash.integration.ts  # bKash payment
│   │   ├── stripe.integration.ts # Stripe payment
│   │   ├── email.integration.ts  # SendGrid
│   │   └── sms.integration.ts    # Twilio
│   │
│   ├── config/                  # Configuration
│   │   ├── database.config.ts    # DB connection strings
│   │   ├── cache.config.ts       # Redis config
│   │   ├── auth.config.ts        # JWT secrets, OAuth
│   │   ├── external.config.ts    # External APIs
│   │   ├── payment.config.ts     # Payment gateways
│   │   ├── email.config.ts       # Email service
│   │   └── app.config.ts         # General config
│   │
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   ├── models.ts            # Database model types
│   │   ├── api.ts               # API request/response types
│   │   └── enums.ts             # Enum definitions
│   │
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
│
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Database migrations
│       ├── 001_init.sql
│       ├── 002_products.sql
│       └── ...
│
├── tests/
│   ├── unit/
│   │   ├── services.test.ts
│   │   └── validators.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── products.test.ts
│   │   ├── checkout.test.ts
│   │   └── payments.test.ts
│   └── e2e/
│       ├── full-purchase.test.ts
│       └── ...
│
├── scripts/
│   ├── seed.ts                  # Database seeding
│   ├── migrate.ts               # Run migrations
│   └── sync-products.ts         # Manual product sync
│
├── .env.example
├── .env.local
├── .env.production
├── .dockerignore
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml           # Docker setup
├── Dockerfile
├── tsconfig.json
├── jest.config.js
├── package.json
├── package-lock.json
├── README.md
└── ARCHITECTURE.md
```

---

## API Endpoints (RESTful)

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.globalmarkethub.com/api
```

### Authentication Endpoints

```
POST   /auth/register            Register new user
       Request: { phone, email?, password, fullName, address? }
       Response: { token, refreshToken, user }

POST   /auth/verify-otp          Verify OTP
       Request: { phone, otp }
       Response: { verified: boolean }

POST   /auth/login               Login user
       Request: { phone, password }
       Response: { token, refreshToken, user }

POST   /auth/refresh             Refresh access token
       Request: { refreshToken }
       Response: { token }

POST   /auth/logout              Logout
       Headers: { Authorization: Bearer <token> }
       Response: { success: boolean }

POST   /auth/forgot-password      Request password reset
       Request: { email }
       Response: { message: "OTP sent" }

POST   /auth/reset-password       Reset password
       Request: { email, otp, newPassword }
       Response: { success: boolean }

GET    /auth/me                  Get current user
       Headers: { Authorization: Bearer <token> }
       Response: { user }

GET    /auth/social/google        Google OAuth callback
GET    /auth/social/facebook      Facebook OAuth callback
```

### Product Endpoints

```
GET    /products                 Get all products (paginated)
       Query: { page=1, limit=20, category, sort, filters }
       Response: { products, total, page, limit }
       Cache: 5 minutes (ISR)

GET    /products/:id             Get product details
       Response: { id, title, price, images, variants, reviews, seller }
       Cache: 10 minutes

GET    /products/by-ids          Get multiple products by IDs
       Query: { ids=1,2,3 }
       Response: { products: [] }

POST   /products/compare         Compare products
       Request: { productIds: ["id1", "id2", "id3"] }
       Response: { comparison: {...} }
       Cache: 15 minutes

GET    /products/:id/reviews    Get product reviews
       Query: { page=1, limit=10, sortBy }
       Response: { reviews, total, average_rating }

GET    /products/:id/price-history  Get price history
       Query: { days=30 }
       Response: { priceHistory: [] }

POST   /products/external-sync   Sync products from external platforms (Admin)
       Request: { platform: "daraz" | "pickaboo" }
       Response: { synced: 1250 }
```

### Search Endpoints

```
GET    /search                   Full-text search products
       Query: { q, page=1, limit=20, filters }
       Response: { results, total, facets }
       Cache: 2 minutes

GET    /search/suggestions       Search suggestions/autocomplete
       Query: { q }
       Response: { suggestions: [] }
       Cache: 5 minutes
       Rate limit: 10 req/second per IP

GET    /search/trending          Trending searches
       Response: { trending: [] }
       Cache: 1 hour
```

### Cart Endpoints

```
GET    /cart                     Get user's cart
       Headers: { Authorization: Bearer <token> }
       Response: { items, totalPrice, itemCount }
       Cache: Real-time (Redis)

POST   /cart/items               Add item to cart
       Request: { productId, quantity, variant }
       Response: { cart }

PUT    /cart/items/:itemId       Update cart item quantity
       Request: { quantity }
       Response: { cart }

DELETE /cart/items/:itemId       Remove item from cart
       Response: { cart }

DELETE /cart                     Clear entire cart
       Response: { success }

POST   /cart/validate            Validate cart before checkout
       Request: { items }
       Response: { valid, errors }

POST   /cart/coupon              Apply coupon code
       Request: { code }
       Response: { discount, totalAfterDiscount }

DELETE /cart/coupon              Remove coupon
       Response: { cart }
```

### Order Endpoints

```
POST   /orders                   Create new order
       Request: {
         items: [{ productId, quantity }],
         shippingAddress: {...},
         paymentMethod: "cod" | "bkash" | "card",
         couponCode?: "XXX"
       }
       Response: { orderId, status, totalAmount }

GET    /orders                   Get user's orders
       Query: { page=1, status, sortBy }
       Response: { orders, total }

GET    /orders/:id               Get order details
       Response: { order with full details }

PUT    /orders/:id/cancel        Cancel order
       Request: { reason }
       Response: { cancelled: true }
       Conditions: Only if order is not yet shipped

POST   /orders/:id/return        Initiate return
       Request: { reason }
       Response: { returnId, status }

GET    /orders/:id/tracking      Get real-time tracking
       Response: { status, location, estimatedDelivery }

POST   /orders/:id/invoice       Download invoice
       Response: PDF Binary
```

### Payment Endpoints

```
POST   /payments/initialize      Initialize payment
       Request: { orderId, paymentMethod, amount }
       Response: { paymentId, redirectUrl } (for card/bkash)

POST   /payments/verify          Verify payment completion
       Request: { paymentId, transactionId }
       Response: { verified, orderId }

GET    /payments/:id             Get payment details
       Response: { paymentDetails }

POST   /payments/refund          Process refund
       Request: { paymentId, amount }
       Response: { refundId }

GET    /payments/methods         Get available payment methods
       Response: { methods: ["cod", "bkash", "card"] }
```

### Review Endpoints

```
POST   /reviews                  Create product review
       Request: {
         productId,
         rating: 1-5,
         title,
         comment,
         images?: ["url1", "url2"]
       }
       Response: { reviewId, review }

GET    /reviews                  Get reviews (paginated)
       Query: { productId, page, limit, sortBy }
       Response: { reviews, total }

PUT    /reviews/:id              Update review
       Request: { rating, text }
       Response: { review }

DELETE /reviews/:id              Delete review
       Response: { success }

POST   /reviews/:id/helpful      Mark review as helpful
       Request: { helpful: true | false }
       Response: { count }
```

### User Endpoints

```
GET    /users/profile            Get user profile
       Headers: { Authorization: Bearer <token> }
       Response: { user }

PUT    /users/profile            Update user profile
       Request: { name, email, phone, gender, dob }
       Response: { user }

POST   /users/addresses          Add address
       Request: { division, district, area, address, isDefault }
       Response: { address }

GET    /users/addresses          Get all addresses
       Response: { addresses: [] }

PUT    /users/addresses/:id      Update address
       Response: { address }

DELETE /users/addresses/:id      Delete address
       Response: { success }

GET    /users/wishlist           Get wishlist
       Response: { products: [] }

POST   /users/wishlist           Add to wishlist
       Request: { productId }
       Response: { wishlist }

DELETE /users/wishlist/:productId Remove from wishlist
       Response: { wishlist }

GET    /users/notifications      Get notifications
       Query: { unread=true, page=1 }
       Response: { notifications, unread_count }

PUT    /users/notifications/:id  Mark as read
       Response: { notification }

PUT    /users/preferences        Update notification preferences
       Request: { emailNotifications, smsNotifications, ... }
       Response: { preferences }

POST   /users/change-password     Change password
       Request: { currentPassword, newPassword }
       Response: { success }
```

### Admin Endpoints

```
GET    /admin/dashboard          Admin dashboard stats
       Response: { 
         totalOrders,
         totalRevenue,
         totalUsers,
         topProducts,
         recentOrders
       }

GET    /admin/users              List all users
       Query: { page, limit, search, status }
       Response: { users, total }

PUT    /admin/users/:id          Update user status
       Request: { status }
       Response: { user }

POST   /admin/products           Manually add/verify product
       Request: { product data }
       Response: { product }

PUT    /admin/products/:id       Update product
       Response: { product }

GET    /admin/reviews            Moderate reviews
       Query: { pending=true }
       Response: { reviews }

PUT    /admin/reviews/:id        Approve/reject review
       Request: { approved: boolean, reason? }
       Response: { review }

GET    /admin/analytics          Analytics & reports
       Query: { startDate, endDate, metric }
       Response: { data: [] }
```

---

## External Platform Integration

### Daraz Integration

```typescript
// src/integrations/daraz.integration.ts

interface DarazProduct {
  sellerId: string;
  sku: string;
  name: string;
  price: number;
  salePrice: number;
  images: string[];
  categoryId: string;
  rating: number;
  reviewCount: number;
}

export class DarazIntegration {
  // Fetch products from Daraz API
  async fetchProducts(query: string): Promise<DarazProduct[]> {
    // Call Daraz API
    // Map to GlobalMarketHub product format
  }

  // Get product details
  async getProductDetails(skuId: string): Promise<DarazProduct> {}

  // Sync prices periodically
  async syncPrices(): Promise<void> {}

  // Track price history
  async trackPrice(skuId: string, price: number): Promise<void> {}
}
```

### bKash Payment Integration

```typescript
// src/integrations/bkash.integration.ts

export class BKashIntegration {
  async createPayment(amount: number, orderId: string) {
    // Initialize bKash payment
    // Return payment URL
  }

  async verifyPayment(transactionId: string) {
    // Verify payment with bKash
  }

  async refund(transactionId: string, amount: number) {
    // Refund payment
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
// Access Token (expires in 1 hour)
{
  sub: "user_id",
  email: "user@example.com",
  phone: "01712345678",
  role: "customer",
  iat: 1647123456,
  exp: 1647127056
}

// Refresh Token (expires in 30 days)
{
  sub: "user_id",
  type: "refresh",
  iat: 1647123456,
  exp: 1649715456
}
```

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  CUSTOMER = "customer",
  SELLER = "seller",
  ADMIN = "admin",
  MODERATOR = "moderator"
}

// Middleware example
export const authorize = (roles: UserRole[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    next();
  };
};

// Usage
router.delete('/products/:id', authorize([UserRole.ADMIN]), deleteProduct);
```

---

## Caching Strategy

### Redis Cache Keys

```
users:{userId}               User profile (TTL: 1 hour)
products:{productId}         Product details (TTL: 10 min)
products:list:{page}         Product list (TTL: 5 min)
search:{query}:{page}        Search results (TTL: 2 min)
cart:{userId}                Shopping cart (TTL: 30 days)
orders:{userId}              Order list (TTL: 5 min)
```

### Cache Invalidation

```typescript
// Invalidate on product update
async updateProduct(id: string, data: any) {
  await prisma.product.update({ where: { id }, data });
  await redis.del(`products:${id}`);
  await redis.del('products:list:*'); // Invalidate all pages
}
```

---

## Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", public errors?: any) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}
```

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    errors: [
      { field: "email", message: "Invalid email format" }
    ]
  }
}
```

---

## Rate Limiting

```typescript
// src/middleware/rate-limit.middleware.ts

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
  skip: (req) => req.user?.role === "admin", // Skip for admins
});

// Apply to routes
app.use("/api/", rateLimitMiddleware);

// Stricter limits for sensitive endpoints
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
});

router.post("/auth/login", strictRateLimit, loginController);
```

---

## Email & SMS Templates

### Email Templates (SendGrid)

```
1. Welcome Email (after signup)
2. Order Confirmation (after order placement)
3. Shipping Notification (order shipped)
4. Delivery Confirmation (order delivered)
5. OTP Email (for password reset)
6. Price Drop Alert (product price decreased)
7. Back in Stock Alert (product available)
8. Order Review Request (30 days after delivery)
```

### SMS Templates (Twilio)

```
1. OTP Verification: "Your GlobalMarketHub OTP is {otp}. Valid for 10 minutes"
2. Order Confirmation: "Order #{orderId} confirmed. Track: {trackingLink}"
3. Shipped: "Your order is on the way! Track: {trackingLink}"
4. Delivery: "Order delivered! Rate & review: {reviewLink}"
5. Urgent: "Your {product} is back in stock! {productLink}"
```

---

## Database Indexes

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Product queries
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_price ON products(price);

-- Order queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Search optimization
CREATE INDEX idx_products_ts_vector ON products USING GIN (ts_vector);
```

---

## Monitoring & Logging

### Logging Setup (Winston)

```typescript
// src/lib/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

### Metrics (Prometheus)

```typescript
// Track API endpoints
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
});

// Track database queries
const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['operation', 'table'],
});
```

---

## Performance Optimization

### Database Query Optimization
- Eager load relationships with Prisma
- Use pagination for large result sets
- Index frequently queried columns
- Use LIMIT with offset pagination
- Batch queries where possible

### API Response Optimization
- Gzip compression for responses
- Return only required fields
- Cache expensive computations
- Implement pagination (default 20 items)
- Use async/await to prevent blocking

### Job Queue (BullMQ for Redis)

```typescript
// src/jobs/sync-external-products.job.ts

export const syncProductsQueue = new Queue('sync-products', {
  connection: redis,
});

export const startSyncProductsJob = async () => {
  await syncProductsQueue.add(
    'sync',
    {},
    {
      repeat: {
        pattern: '0 */6 * * *', // Every 6 hours
      },
    }
  );
};

syncProductsQueue.process(async (job) => {
  // Sync Daraz, Pickaboo, Sajgoj products
});
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis cache initialized
- [ ] External API integrations tested
- [ ] Email/SMS services configured
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Sentry error tracking set up
- [ ] Backup strategy in place
- [ ] Monitoring & alerting configured
- [ ] Load testing passed
- [ ] Security audit completed

---

**Backend Version**: 1.0  
**Last Updated**: March 2026
