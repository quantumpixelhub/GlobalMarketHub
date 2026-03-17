# 3. Frontend Architecture

**GlobalMarketHub** - Frontend Tech Stack & Component Structure  
**Version**: 1.0  
**Last Updated**: March 2026

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.x (Latest) | React framework, SSR, Static generation |
| **React** | 18.x | Component library & UI |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 3.x | Utility-first CSS framework |

### State Management & Data Fetching
| Library | Version | Purpose |
|---------|---------|---------|
| **Redux Toolkit** | 1.9.x | Global state (Cart, Auth, Filters) |
| **React Query** | 5.x | Server state, caching, sync |
| **Zustand** | 4.x | Lightweight UI state (Modals, Tabs) |

### UI & Styling
| Library | Version | Purpose |
|---------|---------|---------|
| **Shadcn/ui** | Latest | Pre-built accessible components |
| **Framer Motion** | 10.x | Animations & page transitions |
| **React Icons** | 4.x | Icon library (Feather, Heroicons) |

### Utilities & Tools
| Library | Version | Purpose |
|---------|---------|---------|
| **Axios** | 1.x | HTTP client for API calls |
| **React Hook Form** | 7.x | Form validation & management |
| **Zod** | 3.x | Runtime schema validation |
| **Date-fns** | 2.x | Date manipulation |
| **Lodash-es** | Latest | Utility functions |
| **SWR** | 2.x | Data fetching alternative to React Query |

### Testing
| Library | Version | Purpose |
|---------|---------|---------|
| **Jest** | 29.x | Unit testing framework |
| **React Testing Library** | Latest | Component testing |
| **Cypress** E2E | Latest | End-to-end testing |
| **Vitest** | Latest | Lightning-fast unit testing |

### SEO & Performance
| Library | Version | Purpose |
|---------|---------|---------|
| **next-seo** | Latest | SEO optimization |
| **next-image** | Built-in | Image optimization |
| **Sentry** | Latest | Error tracking |

---

## Project Structure

```
GlobalMarketHub/
├── .github/                      # GitHub workflows, actions
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       └── deploy.yml           # CD pipeline
│
├── public/                       # Static files
│   ├── favicon.ico
│   ├── images/
│   │   ├── logo.svg
│   │   ├── banners/
│   │   └── icons/
│   └── fonts/
│
├── src/
│   ├── app/                      # Next.js App Router (13+)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── not-found.tsx        # 404 page
│   │   ├── error.tsx            # Error boundary
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (marketplace)/        # Marketplace route group
│   │   │   ├── search/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── [id]/page.tsx    # Product detail (dynamic)
│   │   │   │   └── layout.tsx
│   │   │   ├── compare/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (cart-checkout)/
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── [step]/page.tsx  # Multi-step checkout
│   │   │   └── layout.tsx
│   │   ├── (account)/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── orders/
│   │   │   ├── [orderId]/page.tsx
│   │   │   ├── addresses/
│   │   │   ├── wishlist/
│   │   │   └── layout.tsx
│   │   ├── api/                 # API routes (Backend in Next.js)
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── refresh/route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts           # GET /api/products
│   │   │   │   ├── [id]/route.ts      # GET /api/products/:id
│   │   │   │   └── compare/route.ts
│   │   │   ├── search/
│   │   │   │   └── route.ts
│   │   │   ├── cart/
│   │   │   │   └── route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts           # POST /api/orders
│   │   │   │   └── [id]/route.ts      # GET /api/orders/:id
│   │   │   ├── payments/
│   │   │   │   └── route.ts
│   │   │   ├── reviews/
│   │   │   │   └── route.ts
│   │   │   └── users/
│   │   │       └── profile/route.ts
│   │   └── sitemap.ts           # Dynamic sitemap
│   │
│   ├── components/               # Reusable components
│   │   ├── common/              # Shared across pages
│   │   │   ├── Header.tsx       # Navigation header
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx   # Mobile nav, drawer
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Cart.tsx         # Shopping cart icon
│   │   │   ├── UserMenu.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── auth/                # Auth-related
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── OTPInput.tsx
│   │   │   ├── SocialLoginButtons.tsx
│   │   │   └── PasswordInput.tsx
│   │   ├── products/            # Product components
│   │   │   ├── ProductCard.tsx      # Reusable card
│   │   │   ├── ProductGrid.tsx      # Grid wrapper
│   │   │   ├── ProductDetail.tsx    # Full product view
│   │   │   ├── ProductGallery.tsx   # Image carousel
│   │   │   ├── ProductSpecs.tsx     # Specs section
│   │   │   ├── SellerInfo.tsx       # Seller card
│   │   │   ├── PriceDisplay.tsx
│   │   │   ├── VariantSelector.tsx  # Size, color, etc.
│   │   │   ├── QuantityInput.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   └── ReviewSection.tsx
│   │   ├── search/              # Search & filters
│   │   │   ├── SearchResults.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── FilterChip.tsx       # Active filter display
│   │   │   ├── PriceRangeSlider.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── RatingFilter.tsx
│   │   │   └── SortSelector.tsx
│   │   ├── compare/             # Comparison
│   │   │   ├── ComparisonTable.tsx
│   │   │   ├── ComparisonCards.tsx  # Mobile view
│   │   │   ├── AddToCompare.tsx     # Button
│   │   │   └── PriceComparison.tsx
│   │   ├── cart/                # Shopping cart
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   ├── CartEmpty.tsx
│   │   │   └── CartActionButtons.tsx
│   │   ├── checkout/            # Checkout flow
│   │   │   ├── CheckoutHeader.tsx   # Progress indicator
│   │   │   ├── ShippingForm.tsx
│   │   │   ├── AddressSelector.tsx
│   │   │   ├── ShippingOptions.tsx
│   │   │   ├── PaymentMethod.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   ├── OrderConfirmation.tsx
│   │   │   └── CouponInput.tsx
│   │   ├── account/             # User account pages
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── AddressBook.tsx
│   │   │   ├── WishlistGrid.tsx
│   │   │   ├── NotificationSettings.tsx
│   │   │   └── AccountTabs.tsx
│   │   ├── home/                # Homepage components
│   │   │   ├── HeroBanner.tsx       # Carousel
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── FlashSale.tsx
│   │   │   ├── RecommendedProducts.tsx
│   │   │   └── PromoBanner.tsx
│   │   ├── ui/                  # Base UI components (Shadcn)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Form.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Slider.tsx
│   │   │   └── Skeleton.tsx
│   │   └── shared/              # Shared utilities
│   │       ├── Loading.tsx      # Page loader
│   │       ├── ErrorFallback.tsx
│   │       ├── NotFound.tsx
│   │       └── NoData.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Auth context
│   │   ├── useCart.ts           # Cart state
│   │   ├── useProducts.ts       # Product fetching
│   │   ├── useSearch.ts         # Search logic
│   │   ├── useFilters.ts        # Filter management
│   │   ├── usePagination.ts     # Pagination logic
│   │   ├── useLocalStorage.ts   # Persist state
│   │   ├── useMediaQuery.ts     # Responsive hooks
│   │   ├── useDebounce.ts       # Debounce
│   │   ├── useFetch.ts          # Data fetch wrapper
│   │   ├── useAsync.ts          # Async handler
│   │   └── useNotification.ts   # Toast notifications
│   │
│   ├── store/                   # Redux & state management
│   │   ├── slices/
│   │   │   ├── authSlice.ts     # Auth state
│   │   │   ├── cartSlice.ts     # Cart state
│   │   │   ├── productSlice.ts  # Products
│   │   │   ├── filterSlice.ts   # Search filters
│   │   │   ├── uiSlice.ts       # UI state (modals, etc.)
│   │   │   └── userSlice.ts     # User profile
│   │   ├── index.ts             # Store configuration
│   │   └── middleware/
│   │       └── persistMiddleware.ts  # localStorage sync
│   │
│   ├── lib/                     # Utility functions
│   │   ├── api.ts               # Axios instance & config
│   │   ├── constants.ts         # App constants
│   │   ├── types.ts             # TypeScript types
│   │   ├── utils.ts             # Helper functions
│   │   ├── validation.ts        # Zod schemas
│   │   ├── formatters.ts        # Number, date formatting
│   │   ├── cn.ts                # classname utility
│   │   ├── analytics.ts         # Event tracking
│   │   ├── errors.ts            # Error handling
│   │   └── cookies.ts           # Cookie management
│   │
│   ├── services/                # API service layer
│   │   ├── auth.service.ts      # Auth API calls
│   │   ├── products.service.ts  # Product API
│   │   ├── cart.service.ts      # Cart API
│   │   ├── orders.service.ts    # Orders API
│   │   ├── payments.service.ts  # Payment API
│   │   ├── reviews.service.ts   # Reviews API
│   │   ├── users.service.ts     # User profile API
│   │   └── search.service.ts    # Search API
│   │
│   ├── context/                 # React Context (complementary to Redux)
│   │   ├── AuthContext.tsx      # Auth state provider
│   │   ├── CartContext.tsx      # Cart context (optional)
│   │   ├── ThemeContext.tsx     # Light/dark theme
│   │   └── LocaleContext.tsx    # Language selection
│   │
│   ├── middleware.ts            # Next.js middleware (auth, redirect)
│   │
│   ├── styles/
│   │   ├── globals.css          # Global styles
│   │   ├── tailwind.css         # Tailwind imports
│   │   ├── animations.css       # Custom animations
│   │   └── responsive.css       # Responsive utilities
│   │
│   └── config/
│       ├── app.config.ts        # App configuration
│       ├── api.config.ts        # API endpoints
│       └── routes.config.ts     # Route definitions
│
├── tests/                        # Test files
│   ├── unit/                    # Unit tests
│   │   ├── formatters.test.ts
│   │   ├── validation.test.ts
│   │   └── utils.test.ts
│   ├── components/              # Component tests
│   │   ├── ProductCard.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   └── CheckoutForm.test.tsx
│   ├── integration/             # Integration tests
│   │   ├── auth.integration.test.ts
│   │   ├── checkout.integration.test.ts
│   │   └── products.integration.test.ts
│   └── e2e/                     # Cypress E2E tests
│       ├── auth.cy.ts
│       ├── checkout.cy.ts
│       ├── search.cy.ts
│       └── account.cy.ts
│
├── .env.example                 # Environment variables template
├── .env.local                   # Local env (git-ignored)
├── .env.production              # Production env
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
├── jest.config.js               # Jest config
├── postcss.config.js            # PostCSS config
├── package.json
├── package-lock.json
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── README.md
└── ARCHITECTURE.md
```

---

## Component Hierarchy

### Page Structure Example: Product Details Page

```
Page: /products/[id]
|
├── Layout (with Header, Footer, Sidebar)
│
└── ProductDetail
    ├── Breadcrumb
    ├── ProductGallery (carousel)
    │   ├── MainImage
    │   └── ThumbnailScroll
    │
    ├── ProductInfo
    │   ├── ProductTitle & Rating
    │   ├── PriceDisplay
    │   ├── StockStatus
    │   │
    │   ├── VariantSelector
    │   │   ├── SizeSelector
    │   │   ├── ColorSelector
    │   │   └── QuantityInput
    │   │
    │   ├── ActionButtons
    │   │   ├── AddToCartBtn
    │   │   ├── BuyNowBtn
    │   │   └── WishlistBtn
    │   │
    │   ├── SellerInfo Card
    │   │
    │   └── ProductTabs
    │       ├── Specifications
    │       ├── Description
    │       ├── Reviews
    │       └── Q&A
    │
    ├── ReviewsSection
    │   ├── RatingDistribution
    │   ├── ReviewList
    │   │   ├── ReviewCard (✖)
    │   │   ├── ReviewCard
    │   │   └── ReviewCard
    │   └── WriteReviewForm
    │
    ├── ComparisonSection
    │   └── ComparisonButton
    │
    └── RelatedProducts
        └── ProductCarousel
            ├── ProductCard
            ├── ProductCard
            └── ... more cards
```

---

## State Management Architecture

### Redux Store Structure

```
store/
├── auth
│   ├── user: { id, name, email, phone, verified }
│   ├── isAuthenticated: boolean
│   ├── tokens: { accessToken, refreshToken }
│   └── loading: boolean
│
├── cart
│   ├── items: Array<CartItem>
│   ├── totalPrice: number
│   ├── itemCount: number
│   └── lastUpdated: timestamp
│
├── products
│   ├── items: Array<Product>
│   ├── total: number
│   ├── currentPage: number
│   ├── pageSize: number
│   └── loading: boolean
│
├── filters
│   ├── searchQuery: string
│   ├── category: string[]
│   ├── priceRange: { min, max }
│   ├── rating: number
│   ├── sortBy: string
│   └── brands: string[]
│
├── ui
│   ├── isModalOpen: boolean
│   ├── activeTab: string
│   ├── isMobileMenuOpen: boolean
│   ├── notifications: Array<Toast>
│   ├── theme: 'light' | 'dark'
│   └── locale: 'en' | 'bn'
│
└── user
    ├── profile: { name, email, phone, addresses }
    ├── addresses: Array<Address>
    ├── orders: Array<Order>
    └── wishlist: Array<string> (product IDs)
```

### Data Flow

```
User Action (e.g., click "Add to Cart")
    ↓
React Component dispatches Redux action
    ↓
Redux Reducer updates state
    ↓
Component subscribes to state changes
    ↓
Component re-renders with new data (Selector)
    ↓
API call (via async thunk or service)
    ↓
Backend response
    ↓
Update Redux state
    ↓
Component updates
```

---

## API Integration Layer

### Service Layer Example (products.service.ts)

```typescript
import axios from '@/lib/api';
import { Product, FilterParams } from '@/lib/types';

export const productService = {
  // Fetch products with filters
  async getProducts(filters: FilterParams) {
    const { data } = await axios.get('/api/products', {
      params: filters,
    });
    return data;
  },

  // Get single product
  async getProduct(id: string) {
    const { data } = await axios.get(`/api/products/${id}`);
    return data;
  },

  // Search products
  async searchProducts(query: string, page = 1) {
    const { data } = await axios.get('/api/search', {
      params: { q: query, page },
    });
    return data;
  },

  // Compare products
  async compareProducts(productIds: string[]) {
    const { data } = await axios.post('/api/products/compare', {
      productIds,
    });
    return data;
  },
};
```

### Hook Layer Example (useProducts.ts)

```typescript
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services';

export const useProducts = (filters: FilterParams) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Component Layer Example

```typescript
'use client';

import { useProducts } from '@/hooks';

export const ProductGrid = ({ filters }) => {
  const { data, isLoading, error } = useProducts(filters);

  if (isLoading) return <ProductGridSkeleton />;
  if (error) return <ErrorFallback />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data.products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

---

## Authentication Flow

```
┌─────────────────┐
│  User Opens App │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Check localStorage/cookies  │
│ for auth tokens             │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
   Yes         No
    │          │
    ▼          ▼
┌────────┐  ┌──────────────┐
│Validate│  │ Redirect to  │
│ Token  │  │ Login Page   │
└────┬───┘  └──────────────┘
     │
  ┌──┴──┐
  │     │
  ▼     ▼
Valid  Expired
 │      │
 ▼      ▼
Keep   Refresh Token
Auth   Request
 │      │
 ▼      ▼
─────────┐
        │
        ▼
   User Authenticated
   Proceed to App
```

---

## Performance Optimization Strategies

### 1. Code Splitting
```typescript
// Lazy load heavy components
const ProductGallery = dynamic(() => import('@/components/ProductGallery'), {
  loading: () => <ImageSkeleton />,
});
```

### 2. Image Optimization
```typescript
// Use Next.js Image component
<Image
  src="/product.jpg"
  alt="Product"
  width={440}
  height={440}
  priority={false}
  placeholder="blur"
  blurDataURL="data:..."
/>
```

### 3. Route Prefetching
```typescript
// Prefetch in background
import Link from 'next/link';

<Link href="/checkout" prefetch={true}>
  Checkout
</Link>
```

### 4. Caching Strategies
- **Static**: Homepage, category pages (ISR)
- **Dynamic**: Search results, user account (On-demand)
- **Stale-While-Revalidate**: Products list

---

## Security Implementation

### Authentication
- JWT with access & refresh tokens
- HTTPOnly cookies for tokens
- CSRF protection on forms

### Input Validation
```typescript
import { z } from 'zod';

const productFilterSchema = z.object({
  searchQuery: z.string().max(200),
  minPrice: z.number().positive(),
  maxPrice: z.number().positive(),
  category: z.array(z.string()),
});
```

### API Security
- Rate limiting headers handled by backend
- Sensitive endpoints require authentication header
- Data sanitization on all inputs

---

## Development Workflow

### Setting Up Development Environment

```bash
# Clone repo
git clone <repo>

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
# App available at http://localhost:3000
```

### Environment Variables (.env.local)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=...

STRIPE_PUBLIC_KEY=...
BKASH_SANDBOX_URL=...
```

### Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build

# Production run
npm run start

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test
npm run test:e2e
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Latest versions
- Minimum: iOS 12+, Android 5.0+

---

## Monitoring & Analytics

### Setup Tracking

```typescript
// Google Analytics
import gtag from 'ga';

export function logEvent(name: string, params?: Record<string, any>) {
  gtag.event(name, params);
}

// Usage
logEvent('add_to_cart', {
  product_id: '123',
  value: 1500,
});
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error);
```

---

## Testing Strategy

### Unit Tests (40%)
```typescript
// Test utility functions, formatters
describe('formatPrice', () => {
  it('formats currency correctly', () => {
    expect(formatPrice(1500)).toBe('BDT 1,500');
  });
});
```

### Component Tests (30%)
```typescript
// Test component rendering, user interactions
describe('AddToCartButton', () => {
  it('dispatches add to cart action on click', async () => {
    render(<AddToCartButton productId="123" />);
    userEvent.click(screen.getByRole('button'));
    expect(mockDispatch).toHaveBeenCalled();
  });
});
```

### Integration Tests (20%)
```typescript
// Test feature flows
describe('Checkout Flow', () => {
  it('completes checkout successfully', async () => {
    // Test full checkout process
  });
});
```

### E2E Tests (10%)
```typescript
// Cypress tests for critical user journeys
describe('Purchase Flow', () => {
  it('user can search, add to cart, and checkout', () => {
    cy.visit('/');
    cy.get('[data-testid="search"]').type('serum');
    // ... more steps
  });
});
```

---

## Accessibility Checklist

- ✅ WCAG 2.1 Level AA compliance
- ✅ Semantic HTML structure
- ✅ ARIA labels for interactive elements
- ✅ Focus indicators on all interactive elements
- ✅ Color contrast ratio 4.5:1
- ✅ Keyboard navigation support
- ✅ Alt text for all images
- ✅ Form labels associated with inputs
- ✅ Screen reader testing

---

**Frontend Version**: 1.0  
**Last Updated**: March 2026  
**Maintained By**: Frontend Team
