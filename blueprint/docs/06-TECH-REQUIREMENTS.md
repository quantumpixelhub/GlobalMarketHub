# 6. Tech Requirements & Infrastructure

**GlobalMarketHub** - Infrastructure, Deployment & Scaling  
**Version**: 1.0  
**Last Updated**: March 2026

---

## Infrastructure Architecture

### Production Architecture Overview (Optimized)

```
┌───────────────────────────────────────────────────────────┐
│            Vercel (Frontend + API Routes)                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Next.js 14 (SSR + Serverless Functions)            │  │
│  │  - Pages (React components)                         │  │
│  │  - API Routes (/api/*) = Backend                    │  │
│  │  - Automatic HTTPS, CDN, Auto-scaling              │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────────┘
                     │
         ┌───────────┴────────────┬──────────────┐
         │                        │              │
    ┌────▼────────┐        ┌──────▼──────┐  ┌──▼──────────┐
    │   Supabase  │        │  EmailJS    │  │  UddoktaPay │
    │ PostgreSQL  │        │   (Email)   │  │ (Payments)  │
    │   (Auth)    │        │             │  │             │
    │  (Real-time)│        └─────────────┘  ├─ Stripe     │
    │             │                         │ (Cards)     │
    │ Free tier:  │                         │             │
    │ 500MB       │                         └─────────────┘
    └─────────────┘
```

---

## Frontend Infrastructure

### Hosting: Vercel

**Why Vercel?**
- ✅ Optimized for Next.js (same creators)
- ✅ Automatic deployments from Git
- ✅ Global CDN for images & assets
- ✅ Server-side rendering (SSR) & Static generation
- ✅ Built-in analytics & monitoring
- ✅ Edge functions for middleware
- ✅ Generous free tier, affordable scaling

### Vercel Setup

```yaml
# vercel.json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID": "@ga_id"
  },
  "regions": ["dhk1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 256,
      "maxDuration": 30
    }
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci"
}
```

### Environment Variables (Frontend)

```
NEXT_PUBLIC_API_URL=https://api.globalmarkethub.com/api
NEXT_PUBLIC_SITE_URL=https://globalmarkethub.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=xxxxxx
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

---

## Backend Infrastructure (Vercel API Routes)

### Why Vercel for Backend?

- ✅ **Full-Stack**: Frontend + Backend in same Next.js project
- ✅ **Serverless**: Auto-scaling, pay-per-use, always free tier
- ✅ **Zero DevOps**: No Docker, no servers to manage
- ✅ **Compatible**: Works perfectly with Supabase
- ✅ **Fast Cold Starts**: ~100-500ms
- ✅ **Built-in CI/CD**: Deploy on git push
- ✅ **Environment Variables**: Automatic, secure management

### API Routes Structure

```typescript
// src/app/api/products/route.ts (Serverless function)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### vercel.json Configuration

```json
{
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXT_PUBLIC_API_URL": "@api_url",
    "JWT_SECRET": "@jwt_secret",
    "UDDOKTAPAY_API_KEY": "@uddoktapay_api_key",
    "STRIPE_SECRET_KEY": "@stripe_secret_key",
    "EMAILJS_SERVICE_ID": "@emailjs_service_id"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 256,
      "maxDuration": 30
    }
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci"
}
```

### Environment Variables (Full Stack)

```bash
# Database (Supabase)
DATABASE_URL=postgresql://user:password@db.supabaseapi.com:5432/postgres

# NextAuth / JWT
NEXTAUTH_SECRET=your-secret-key-min-32-chars
JWT_SECRET=another-secret-key-min-32-chars
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=2592000

# Payment Gateways - UddoktaPay (Primary)
UDDOKTAPAY_API_KEY=your_uddoktapay_api_key
UDDOKTAPAY_API_URL=https://api.uddoktapay.com
UDDOKTAPAY_MERCHANT_ID=your_merchant_id

# Payment Gateways - Stripe (Cards)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx

# Payment Gateways - Mobile Wallets (Optional - Admin Configurable)
BKASH_API_KEY=xxx
NAGAD_API_KEY=xxx
ROCKET_API_KEY=xxx
IPAY_API_KEY=xxx

# Email Service (EmailJS)
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_FROM_EMAIL=noreply@globalmarkethub.com
EMAILJS_PUBLIC_KEY=public_key_xxxxx
EMAILJS_PRIVATE_KEY=private_key_xxxxx

# External APIs
DARAZ_API_KEY=xxx
DARAZ_API_URL=https://api.daraz.com.bd
PICKABOO_API_KEY=xxx
SAJGOJ_API_KEY=xxx

# Frontend URLs
NEXT_PUBLIC_API_URL=https://yoursite.vercel.app/api
NEXT_PUBLIC_SITE_URL=https://yoursite.vercel.app

# Logging & Debug
NODE_ENV=production
LOG_LEVEL=info
```

---

## Database Infrastructure

### PostgreSQL (Primary Database)

**Cloud Provider: Supabase or AWS RDS**

```
Specs (Production):
- Instance: db.r6i.xlarge (AWS) or equivalent
- Storage: 100 GB (expandable)
- Backup: Daily automated + weekly manual
- Replication: Read replicas for reporting
- Multi-AZ: Yes (for high availability)
```

### Backup Strategy

```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL > /backups/gmh-$(date +\%Y\%m\%d).sql

# Upload to S3
aws s3 cp /backups/gmh-*.sql s3://gmh-backups/postgresql/

# Retention: 30 days for daily, 1 year for monthly
```

---

## Caching Infrastructure

### Redis (Session & Cache)

**Cloud Provider: Redis Cloud or AWS ElastiCache**

```
Specs:
- Instance: 2GB RAM (Dev), 10GB RAM (Prod)
- Type: Redis 7.x
- Replication: Master-Slave
- AOF Persistence: Enabled
- Eviction Policy: allkeys-lru
```

### Cache Configuration

```typescript
// src/lib/redis.ts

import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: process.env.NODE_ENV === 'test' ? 1 : 0,
  retryStrategy: (options) => {
    if (options.error?.code === 'ECONNREFUSED') {
      return new Error('End of retry');
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

redisClient.on('error', (err) => console.log('Redis error:', err));
redisClient.on('connect', () => console.log('Redis connected'));

export default redisClient;
```

---

## Search Infrastructure

### Meilisearch (Full-Text Search)

**Cloud: Meilisearch Cloud or Self-hosted on Railway**

```
Specs:
- Instance: Standard (for MVP)
- Indexes: products, reviews
- Ranking Rules: Custom
```

### Meilisearch Setup

```typescript
// src/lib/meilisearch.ts

import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const productsIndex = client.index('products');

// Sync products to Meilisearch
export async function syncProductsToSearch(products: any[]) {
  await productsIndex.updateDocuments(
    products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      rating: p.averageRating,
      category: p.category,
      seller: p.seller.storeName,
      certifications: p.certifications,
    }))
  );
}

// Configure ranking & filtering
await productsIndex.updateSettings({
  rankingRules: [
    'sort',
    'exactness',
    'words',
    'typo',
    'proximity',
    'attribute',
    'exactness',
  ],
  filterableAttributes: [
    'category',
    'price',
    'rating',
    'seller',
    'certifications',
  ],
  sortableAttributes: ['price', 'rating', 'createdAt'],
});
```

---

## Email & SMS Services

### SendGrid (Email)

```typescript
// src/integrations/email.integration.ts

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to: string, templateId: string, data: any) => {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      templateId,
      dynamicTemplateData: data,
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Usage
await sendEmail('user@example.com', 'd-orderconfirmation', {
  orderId: '123',
  totalAmount: 1500,
  items: [...]
});
```

### Twilio (SMS)

```typescript
// src/integrations/sms.integration.ts

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to: string, message: string) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+880${to.slice(-10)}`,
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// Usage
await sendSMS('01712345678', 'Your order #123 is confirmed!');
```

---

## Payment Gateway Integration

### bKash Integration

```typescript
// src/integrations/bkash.integration.ts

import axios from 'axios';

export class BKashPayment {
  private baseUrl = process.env.BKASH_API_URL;
  private appKey = process.env.BKASH_APP_KEY;
  private appSecret = process.env.BKASH_APP_SECRET;

  async createPayment(amount: number, orderId: string, phone: string) {
    const response = await axios.post(`${this.baseUrl}/payment/create`, {
      mode: '0011',
      payerReference: phone,
      callbackURL: `${process.env.API_URL}/api/payments/bkash/callback`,
      amount: amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderId,
    }, {
      headers: this.getAuthHeaders(),
    });

    return response.data;
  }

  async verifyPayment(paymentId: string) {
    const response = await axios.post(`${this.baseUrl}/payment/query`, {
      paymentID: paymentId,
    }, {
      headers: this.getAuthHeaders(),
    });

    return response.data;
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'username': process.env.BKASH_USERNAME,
      'password': process.env.BKASH_PASSWORD,
      'app_key': this.appKey,
      'app_secret': this.appSecret,
    };
  }
}
```

### Stripe Integration (Card Payments)

```typescript
// src/integrations/stripe.integration.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount: number, orderId: string) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'bdt',
    metadata: { orderId },
    description: `Order ${orderId}`,
  });
};

export const confirmPaymentIntent = async (paymentIntentId: string) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

```typescript
// src/lib/sentry.ts

import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

export default Sentry;

// Usage in Express
app.use(Sentry.Handlers.errorHandler());

// Capture exceptions
try {
  // code
} catch (error) {
  Sentry.captureException(error);
}
```

### Logging (Winston)

```typescript
// src/lib/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'globalmarkethub-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

### Prometheus Metrics

```typescript
// src/lib/metrics.ts

import prometheus from 'prom-client';

export const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500],
});

export const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['operation', 'table'],
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/gmh_test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      run: |
        npm i -g vercel
        vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      run: |
        npm i -g @railway/cli
        railway deploy --token ${{ secrets.RAILWAY_TOKEN }}
```

---

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Frontend Page Load | < 2s (4G) | Lighthouse, WebPageTest |
| Backend API Response | < 500ms (p95) | Prometheus, Grafana |
| Database Query | < 100ms (p95) | PostgreSQL logs, New Relic |
| Image Load | < 2s (CDN) | Lighthouse |
| Search Response | < 200ms | Meilisearch metrics |
| Cache Hit Rate | > 70% | Redis metrics |
| Uptime | 99.9% | Uptime monitoring |

---

## Security Checklist

- [ ] HTTPS/TLS enabled (SSL certificate)
- [ ] Environment variables secured (never in code)
- [ ] Database encrypted at rest
- [ ] Backup encryption enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (ORM/prepared statements)
- [ ] XSS protection headers (CSP, X-Frame-Options)
- [ ] CSRF tokens enabled
- [ ] Password hashing with bcrypt
- [ ] JWT token rotation implemented
- [ ] Sensitive data not logged
- [ ] API rate limiting per IP/user
- [ ] DDoS protection (via Cloudflare)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

---

## Scaling Strategy

### Phase 1 (MVP - 1000s users)
- Single Vercel deployment (auto-scales)
- Single Railway/Render backend instance
- PostgreSQL 5GB storage
- Redis 2GB

### Phase 2 (Scaling - 10,000s users)
- Auto-scaling on Vercel (multiple instances)
- Multi-instance backend with load balancer
- PostgreSQL read replicas
- Redis cluster
- CDN for image optimization

### Phase 3 (Enterprise - 100,000s users)
- Global CDN (Cloudflare / Akamai)
- Kubernetes for backend
- PostgreSQL sharding
- Multi-region deployment
- Advanced caching strategies

---

## Cost Estimation (Monthly - MVP Phase)

### Optimized Stack - $0-20/month

| Service | Cost | Purpose | Details |
|---------|------|---------|---------|
| Vercel | **$0** | Frontend + Backend (API Routes) | Free tier |
| Supabase | **$0** | PostgreSQL Database | Free tier (500MB) |
| EmailJS | **$0** | Email Service | Free tier (200 emails/month) |
| UddoktaPay | **$0** | Payment Gateway | No setup fee |
| Stripe | **$0** | Card Payments (optional) | No setup fee, pay per transaction |
| Domain | **$10-15** | Domain registrar | .com or .com.bd |
| **Total** | **$0-20/month** | | |

### Cost Scaling Plan

**Phase 1: MVP (Weeks 1-4, <500 users)**
- Cost: $0-10/month (domain only)
- All services: Free tier

**Phase 2: Growth (Weeks 5-8, 1000-5000 users)**
- Supabase: Still free (under 500MB)
- EmailJS: Still free (under 200 emails)
- Cost: $10-15/month

**Phase 3: Launch & Beyond (Weeks 9-12, 5000+ users)**
- Supabase: Upgrade to $10/month if approaching 500MB
- EmailJS: Upgrade to $4/month if exceeding 200 emails
- Cost: $15-25/month

**Post-MVP Scaling (Month 6+, 50000+ users)**
- Supabase: $25/month (Pro tier, 8GB storage, higher limits)
- Vercel: $20-50/month (if hitting function execution limits)
- EmailJS: Switch to SendGrid $19/month for reliability
- Cost: $60-95/month

### Cost vs. Original Blueprint

| Metric | Original | New Stack | Savings |
|--------|----------|-----------|---------|
| **Month 1** | $100-150 | $10-15 | **90%** ✅ |
| **Month 3** | $150-250 | $15-25 | **85%** ✅ |
| **Month 6** | $250-350 | $25-40 | **85%** ✅ |
| **Year 1 Total** | $1500-2000 | $200-350 | **82%** ✅ |

---

**Infrastructure Version**: 2.0 (Updated - Vercel Serverless)  
**Last Updated**: March 2026
