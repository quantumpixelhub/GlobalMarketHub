# 🔧 Critical Security & SEO Implementation Guide

## Quick Fix #1: JWT Secret Protection

**File:** `src/lib/auth.ts`

```typescript
// BEFORE (❌ Vulnerable)
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars'
);

// AFTER (✅ Secure)
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  })()
);

// Validate on app startup
export function validateSecrets() {
  const requiredSecrets = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = requiredSecrets.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

---

## Quick Fix #2: Rate Limiting

**Install first:**
```bash
npm install express-rate-limit
```

**File:** `src/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// In-memory store (use Redis for production)
const loginAttempts = new Map();

export function createRateLimiter(
  windowMs: number,
  maxRequests: number,
  skipSuccessfulRequests = false
) {
  return async (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}-${request.nextUrl.pathname}`;
    
    const now = Date.now();
    const attempts = loginAttempts.get(key) || [];
    
    // Remove old attempts outside window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later' },
        { status: 429 }
      );
    }
    
    recentAttempts.push(now);
    loginAttempts.set(key, recentAttempts);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      const allKeys = Array.from(loginAttempts.keys());
      allKeys.forEach(k => {
        const times = loginAttempts.get(k) || [];
        const recent = times.filter(t => now - t < windowMs);
        if (recent.length === 0) loginAttempts.delete(k);
        else loginAttempts.set(k, recent);
      });
    }
  };
}

// Usage in routes
export const loginRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 min
export const apiRateLimiter = createRateLimiter(60 * 1000, 30); // 30 requests per minute
```

**Apply to routes:**
```typescript
// src/app/api/auth/login/route.ts
import { loginRateLimiter } from '@/middleware/rateLimit';

export async function POST(request: NextRequest) {
  // Check rate limit first
  const limitResponse = await loginRateLimiter(request);
  if (limitResponse) return limitResponse;
  
  // ... rest of login logic
}
```

---

## Quick Fix #3: CSRF Protection

**Install:**
```bash
npm install csurf cookie-parser
```

**File:** `src/middleware/csrf.ts`

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

export async function generateCSRFToken(request: NextRequest) {
  const cookieStore = cookies();
  const token = require('crypto').randomBytes(32).toString('hex');
  
  const response = new NextResponse(JSON.stringify({ token }));
  response.cookies.set('XSRF-TOKEN', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600,
  });
  
  return response;
}

export async function verifyCSRFToken(request: NextRequest) {
  const token = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('XSRF-TOKEN')?.value;
  
  if (!token || token !== cookieToken) {
    return false;
  }
  
  return true;
}
```

**Usage:**
```typescript
// src/app/api/auth/register/route.ts
import { verifyCSRFToken } from '@/middleware/csrf';

export async function POST(request: NextRequest) {
  // Verify CSRF token
  if (!await verifyCSRFToken(request)) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    );
  }
  
  // ... rest of logic
}
```

---

## Quick Fix #4: Security Headers

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' www.googletagmanager.com www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## Quick Fix #5: Input Validation with Zod

**File:** `src/lib/schemas.ts`

```typescript
import { z } from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(/^\+?880\d{9,10}$/, 'Invalid Bangladesh phone number'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character (@, $, !, %, *, ?, &)'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: registerSchema.shape.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Use in API:**
```typescript
// src/app/api/auth/register/route.ts
import { registerSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Safe to use now
    const { email, phone, password, firstName, lastName } = validatedData;
    
    // ... rest of logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

---

## SEO Fix #1: Create Sitemap

**File:** `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalmerkethub.com';
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic category routes
  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
    where: { parentId: null }, // Only top-level categories
  });

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/products/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic product routes (limit to 50k per sitemap file)
  const products = await prisma.product.findMany({
    select: { id: true, updatedAt: true },
    take: 50000,
    orderBy: { updatedAt: 'desc' },
  });

  const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
    url: `${baseUrl}/products/${prod.id}`,
    lastModified: prod.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
```

---

## SEO Fix #2: Create robots.txt

**File:** `public/robots.txt`

```txt
# Global rules
User-agent: *
Allow: /
Allow: /products
Allow: /search
Allow: /categories

# Disallow
Disallow: /api/
Disallow: /admin/
Disallow: /payment/
Disallow: /_next/
Disallow: /private/
Disallow: /checkout
Disallow: /order/*/print
Disallow: /admin
Disallow: /api

# Crawl delay
Crawl-delay: 1

# Bot-specific rules
User-agent: AhrefsBot
User-agent: SemrushBot
User-agent: DotBot
Disallow: /

# Sitemap
Sitemap: https://globalmerkethub.com/sitemap.xml
Sitemap: https://globalmerkethub.com/sitemap-images.xml

# Allow specific good bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1
```

---

## SEO Fix #3: Structured Data

**File:** `src/components/StructuredData.tsx`

```typescript
export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'GlobalMarketHub',
          url: 'https://globalmerkethub.com',
          logo: 'https://globalmerkethub.com/logo.png',
          description: 'Bangladesh e-commerce marketplace aggregating products from top retailers',
          foundingDate: '2024',
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            telephone: '+880-2-XXXX-XXXX',
            email: 'support@globalmerkethub.com'
          },
          sameAs: [
            'https://facebook.com/globalmerkethub',
            'https://twitter.com/globalmerkethub',
            'https://instagram.com/globalmerkethub'
          ]
        })
      }}
    />
  );
}

export function ProductSchema({ product }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.title,
          description: product.description,
          image: product.mainImage,
          sku: product.sku,
          brand: {
            '@type': 'Brand',
            name: product.brand
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'BDT',
            lowPrice: Math.min(...product.vendors.map(v => v.price)),
            highPrice: Math.max(...product.vendors.map(v => v.price)),
            offerCount: product.vendors.length,
            offers: product.vendors.map(v => ({
              '@type': 'Offer',
              url: `https://globalmerkethub.com/products/${product.id}?vendor=${v.id}`,
              priceCurrency: 'BDT',
              price: v.price,
              seller: {
                '@type': 'Organization',
                name: v.vendorName
              },
              availability: v.stock > 0 ? 'InStock' : 'OutOfStock'
            }))
          },
          aggregateRating: product.averageRating ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            ratingCount: product.reviewCount
          } : undefined
        })
      }}
    />
  );
}

export function BreadcrumbSchema({ items }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `https://globalmerkethub.com${item.url}`
          }))
        })
      }}
    />
  );
}
```

---

## Performance Fix #1: Cache Headers

**File:** `next.config.js`

```javascript
async headers() {
  return [
    // Cache static assets for 1 year
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Cache images for 30 days
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=2592000',
        },
      ],
    },
    // Cache API responses for 5 minutes
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300',
        },
      ],
    },
  ];
}
```

---

## Implementation Timeline

**Week 1:**
- [ ] Deploy JWT secret fix
- [ ] Set up rate limiting
- [ ] Add CSRF protection
- [ ] Implement security headers

**Week 2:**
- [ ] Create sitemap.xml
- [ ] Create robots.txt
- [ ] Add structured data
- [ ] Optimize meta tags

**Week 3:**
- [ ] Implement cache headers
- [ ] Set up monitoring
- [ ] Database query optimization
- [ ] Deploy and test

**Ongoing:**
- [ ] Security monitoring
- [ ] Performance tracking
- [ ] Monthly audits
- [ ] User feedback integration
