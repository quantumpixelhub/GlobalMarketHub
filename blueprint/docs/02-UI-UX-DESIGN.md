# 2. UI/UX Design & Component Breakdown

**GlobalMarketHub** - User Interface & Experience Design  
**Version**: 1.0  
**Last Updated**: March 2026

---

## Design Principles

1. **Mobile-First**: Design optimized for smartphones (70% of traffic)
2. **Simplicity**: Minimal friction, clear CTAs, intuitive navigation
3. **Trust**: Show seller info, ratings, certifications prominently
4. **Speed**: Lazy loading, skeleton screens, optimized images
5. **Accessibility**: WCAG 2.1 AA compliant, high contrast, keyboard navigation
6. **Localization**: Support Bengali & English, local payment methods
7. **Consistency**: Unified design system across all pages

---

## Design System

### Color Palette

| Color | HEX | Usage |
|-------|-----|-------|
| Primary Green | #10B981 | CTAs, links, highlights |
| Dark Gray | #1F2937 | Text, headings |
| Light Gray | #F3F4F6 | Backgrounds, borders |
| Success Green | #059669 | Confirmed orders, badges |
| Warning Orange | #F59E0B | Alerts, attention |
| Error Red | #EF4444 | Errors, cancellations |
| Blue | #3B82F6 | Information, secondary CTAs |

### Typography

```
Headlines:
- H1: 32px, Bold (700), Line Height 1.2
- H2: 24px, Bold (700), Line Height 1.3
- H3: 20px, Semi-bold (600), Line Height 1.4

Body:
- Body Large: 16px, Regular (400), Line Height 1.5
- Body Normal: 14px, Regular (400), Line Height 1.6
- Body Small: 12px, Regular (400), Line Height 1.5

Other:
- Button Text: 14px, Semi-bold (600)
- Caption: 12px, Regular (400)
```

### Spacing Scale

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Component Library

- Buttons (Primary, Secondary, Ghost)
- Input fields (Text, Email, Password, Tel)
- Checkboxes, Radio buttons
- Dropdown/Select
- Cards
- Badges
- Rating stars
- Price display
- Product image carousel
- Navigation bar
- Search bar
- Filter sidebar
- Modal/Dialog
- Toast notifications
- Skeleton loaders
- Breadcrumbs

---

## Page Wireframes & User Flows

### 1. Onboarding & Authentication Flows

#### 1.1 Splash/Welcome Screen
```
┌─────────────────────────────────────────┐
│            GlobalMarketHub               │
│              [Logo Centered]             │
│                                         │
│                                         │
│                                         │
│         [Sign Up] [Sign In]            │
│         [Continue as Guest]            │
└─────────────────────────────────────────┘
```

**Components**:
- Logo (centered, 120px)
- App title & tagline
- Primary CTA: "Sign Up"
- Secondary CTA: "Sign In"
- Tertiary: "Continue as Guest"
- Language selector (top-right)

#### 1.2 Sign Up Flow
```
STEP 1: Choose Registration Method
┌─────────────────────────────────────────┐
│  Create Account                      ×   │
│                                         │
│  [Google] [Facebook] [Phone/Email]    │
│                                         │
│  Already have an account? Sign in      │
└─────────────────────────────────────────┘

STEP 2: Phone Registration
┌─────────────────────────────────────────┐
│  Enter Phone Number                   │
│  +880 [___________]                    │
│                                         │
│  [Send OTP]                           │
└─────────────────────────────────────────┘

STEP 3: OTP Verification
┌─────────────────────────────────────────┐
│  Verify OTP                            │
│  Enter 6-digit code sent to your phone │
│  [_] [_] [_] [_] [_] [_]              │
│                                         │
│  [Verify] [Didn't get code?]           │
└─────────────────────────────────────────┘

STEP 4: Enter Details
┌─────────────────────────────────────────┐
│  Complete Your Profile                 │
│  Full Name: [_________________]        │
│  Email: [_________________]            │
│  Password: [_________________]         │
│  [Show Password]                       │
│                                         │
│  [Next]                                │
└─────────────────────────────────────────┘

STEP 5: Address (Optional)
┌─────────────────────────────────────────┐
│  Shipping Address                      │
│  Division: [Dhaka ▼]                   │
│  District: [Dhaka ▼]                   │
│  Area/Zone: [Mohakhali ▼]              │
│  Address: [_________________]          │
│                                         │
│  [Skip] [Save & Continue]              │
└─────────────────────────────────────────┘

STEP 6: Welcome
┌─────────────────────────────────────────┐
│  ✓ Welcome to GlobalMarketHub!        │
│  Your account is ready to use          │
│                                         │
│  [Start Shopping]                      │
└─────────────────────────────────────────┘
```

**Key Components**:
- Social login buttons
- Phone number input with +880 prefix
- OTP input (6-digit with auto-focus)
- Password strength indicator
- Address selector (Division → District → Area)
- Progress indicator (Step 1 of 5)

---

### 2. Homepage

```
┌─────────────────────────────────────────────────┐
│ ≡ Menu  [Search Bar........] [❤] [Cart] [👤]  │ Header
├─────────────────────────────────────────────────┤
│                                                 │
│  [Banner Carousel with Promotions]             │
│  ◄ [Image 1] ► [●○○]                          │
│                                                 │
├─────────────────────────────────────────────────┤
│ Featured Categories                             │
│ [Organic Food] [Skincare] [Cosmetics]          │
│ [New Arrivals]                                  │
├─────────────────────────────────────────────────┤
│ Flash Sale                                      │
│ Ends in: 02:45:30                              │
│                                                 │
│ [Product Card] [Product Card] [Product Card]   │
│                                                 │
├─────────────────────────────────────────────────┤
│ Recommended For You                             │
│ [Product Card] [Product Card] [Product Card]   │
│ [Product Card] [Product Card] [Product Card]   │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Load More]                                     │
│                                                 │
│ Footer: About | Terms | Privacy | Contact      │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Header (Logo, Search, Cart icon, User menu)
- Navigation bar (Categories)
- Hero banner carousel with auto-play
- Featured categories grid
- Flash sale countdown timer
- Product cards grid (2-column mobile, 3-column tablet, 4-column desktop)
- Load more pagination
- Footer with links

**Product Card Component**:
```
┌──────────────────┐
│  [Image]         │ (Aspect ratio 1:1)
│  [Sale Badge]    │ (If on sale)
│  ★4.5 (120)      │
│  Product Title   │
│  (2 lines max)   │
├──────────────────┤
│ BDT 1,500        │ (Current price)
│ ~BDT 2,000       │ (Original price - struck)
├──────────────────┤
│ Daraz | ★★★★★   │ (Seller info)
│                  │
│ [❤] [Add to Cart]│
└──────────────────┘
```

---

### 3. Search Results Page

```
┌─────────────────────────────────────────────────┐
│ ◄ [Search: "Face Serum"...] [×]  [Search]     │ Header
├─────────────────────────────────────────────────┤
│ Filters ← → Sort By: [Relevance ▼]              │
│                                                 │
│ [❖ Filters] [Showing: 234 products]            │
│                                                 │
├─────────────────────────────────────────────────┤
│ FILTERS (Sidebar on Desktop)                    │
│ ╔═════════════════════════════════════════════╗│
│ ║ Category                                  ╲╱║
│ ║ ☑ Skincare (234)                            ║
│ ║ ☐ Face care (150)                           ║
│ ║ ☐ Body Care (84)                            ║
│ ║                                              ║
│ ║ Price Range                                ╲╱║
│ ║ BDT [100] — [10,000]                        ║
│ ║ [████████████═════]                         ║
│ ║                                              ║
│ ║ Rating                                     ╲╱║
│ ║ ☐ 5★ (25)                                   ║
│ ║ ☐ 4★ & up (120)                             ║
│ ║ ☐ 3★ & up (200)                             ║
│ ║                                              ║
│ ║ Brand                                      ╲╱║
│ ║ ☐ Daraz Essential (50)                      ║
│ ║ ☐ Namastey (45)                             ║
│ ║ ☐ More brands...                            ║
│ ║                                              ║
│ ║ Certifications                             ╲╱║
│ ║ ☑ Organic Certified (120)                   ║
│ ║ ☐ Cruelty-free (85)                         ║
│ ║                                              ║
│ ║ [Apply Filters] [Clear All]                 ║
│ ╚═════════════════════════════════════════════╝│
│                                                 │
├─────────────────────────────────────────────────┤
│ PRODUCT RESULTS                                 │
│                                                 │
│ [Product Card] [Product Card] [Product Card]   │
│ [Product Card] [Product Card] [Product Card]   │
│ [Product Card] [Product Card] [Product Card]   │
│                                                 │
│                                                 │
│ Showing 1-20 of 234    [Load More] [Next ►]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Search header with back button, query, clear, search button
- Filter sidebar (collapsible on mobile)
- Sort dropdown (Relevance, Price Low-High, Price High-Low, Newest, Most Popular, Top Rated)
- Price range slider with input fields
- Checkbox filters (Category, Rating, Brand, Certifications)
- Product grid with lazy loading
- Active filters chips (with X to remove)
- Pagination (Load More / Next Page)

---

### 4. Product Details Page

```
┌─────────────────────────────────────────────────┐
│ ◄ Home/Search  [❉ ▼]  [❤] [Cart]              │ Header
├─────────────────────────────────────────────────┤
│                                                 │
│  [Image Gallery]                               │
│  ◄ [Large Image] ►                            │
│  [Th1][Th2][Th3][Th4][Th5][>]                │
│                                                 │
├─────────────────────────────────────────────────┤
│  Product Title (2 lines)                       │
│  ★4.5 (250 reviews) | 2K+ Sold                 │
│  Daraz Organics | ★★★★★                        │
│                                                 │
│  [Price Section]                               │
│  Price: BDT 1,500 (~$14 USD)                   │
│  Original: BDT 2,000 (Save: 25%)               │
│  Stock: 45 units available                     │
│  Delivery: 1-2 days (Standard)                │
│                                                 │
│  [Variants Selection]                          │
│  Size: [50ml ▼] [100ml ▼]                      │
│  Color: [Blue ☑] [Pink] [Green]               │
│  Quantity: [-] 1 [+] (Max: 10)                │
│                                                 │
│  [💛 Wishlist] [🔔 Notify when in stock]      │
│                                                 │
├─────────────────────────────────────────────────┤
│  [⬛ Add to Cart] [⬛ Buy Now]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  Key Benefits                                  │
│  • Organic Certified (BSTI)                    │
│  • Cruelty-free & Vegan                        │
│  • No harmful chemicals                        │
│  • Dermatologist tested                        │
│                                                 │
├─────────────────────────────────────────────────┤
│  Specifications                                │
│  Brand: Daraz Organics                         │
│  Type: Face Serum                              │
│  Volume: 50ml                                  │
│  Ingredients: Vitamin C, Hyaluronic Acid...   │
│  Shelf Life: 24 months                         │
│                                                 │
├─────────────────────────────────────────────────┤
│  Description                                   │
│  [Expandable full description]                 │
│  Lorem ipsum dolor sit amet, consectetur...    │
│  [Show More ▼]                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  Seller Information                            │
│  ┌──────────────────────────────────────────┐ │
│  │ Daraz Organics        ★★★★★ 4.8 (1.2K) │ │
│  │ Verified Seller | 98% positive feedback  │ │
│  │ Joined 2 years ago                       │ │
│  │ Returns: 30 days                         │ │
│  │ [Contact Seller] [View Store]            │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  Comparison Tools                              │
│  [Compare Similar Products]                    │
│  [Track Price History]                         │
│                                                 │
├─────────────────────────────────────────────────┤
│  Reviews & Ratings                             │
│  ★★★★★ 4.5                                   │
│  (250 reviews)                                 │
│                                                 │
│  [★★★★★ (50)] [★★★★ (100)] [★★★ (75)] ...  │
│                                                 │
│  [Filter: All Reviews ▼] [Sort: Helpful ▼]  │
│                                                 │
│  Review 1:                                     │
│  ★★★★★ "Amazing product!" - Aisha             │
│  "Works great on sensitive skin..."            │
│  👍 123 👎 2                                   │
│  Seller Response: "Thank you for your review!"│
│                                                 │
│  Review 2:                                     │
│  ★★★★ "Good but a bit pricey" - Karim        │
│  👍 45 👎 5                                    │
│                                                 │
│  [Load More Reviews]                           │
│                                                 │
├─────────────────────────────────────────────────┤
│  You May Also Like                             │
│  [Product Card] [Product Card] [Product Card]  │
│                                                 │
│  Footer: About | Terms | Privacy | Contact    │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Image gallery (main image + thumbnails, zoom on desktop)
- Product score section (rating, sold count, seller info)
- Price section (current, original, discount %, stock status)
- Variant selector (dropdowns/buttons for Size, Color)
- Quantity selector (minus/plus buttons)
- Wishlist & notification buttons
- Add to Cart & Buy Now buttons (sticky on mobile)
- Key benefits bullets
- Specifications accordion
- Full description (expandable)
- Seller information card
- Comparison & price tracking links
- Review section (rating distribution, individual reviews, helpful votes)
- Recommended products carousel

---

### 5. Product Comparison Page

```
┌─────────────────────────────────────────────────┐
│ ◄ Search  Compare (4 of 5 Max)  [×]            │ Header
│ [+ Add Product]                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Comparison: Face Serums                         │
│                                                 │
│ [Share Comparison] [Save Comparison]            │
│                                                 │
├─────────────────────────────────────────────────┤
│ Spec         │ Product 1 │ Product 2 │ Product 3│
├──────────────┼───────────┼───────────┼──────────┤
│ Image        │ [Image]   │ [Image]   │ [Image]  │
├──────────────┼───────────┼───────────┼──────────┤
│ Price        │ BDT 1500  │ BDT 2000  │ BDT 1200 │
│              │ (25% off) │ (10% off) │ (35% off)│
├──────────────┼───────────┼───────────┼──────────┤
│ Rating       │ ★★★★★ 4.5│ ★★★★★ 4.2│ ★★★★ 4.0│
│ Reviews      │ (250)     │ (180)     │ (120)    │
├──────────────┼───────────┼───────────┼──────────┤
│ Stock        │ In Stock  │ In Stock  │ Low (3)  │
├──────────────┼───────────┼───────────┼──────────┤
│ Brand        │ Daraz Or. │ Namastey  │ Local    │
├──────────────┼───────────┼───────────┼──────────┤
│ Type         │ Face Serum│ Face Serum│ Serum    │
├──────────────┼───────────┼───────────┼──────────┤
│ Volume       │ 50ml      │ 30ml      │ 50ml     │
├──────────────┼───────────┼───────────┼──────────┤
│ Ingredients  │ [Show]    │ [Show]    │ [Show]   │
├──────────────┼───────────┼───────────┼──────────┤
│ Shelf Life   │ 24 months │ 18 months │ 24 months│
├──────────────┼───────────┼───────────┼──────────┤
│ Certifications│ Organic  │ Cruelty-fr│ None    │
├──────────────┼───────────┼───────────┼──────────┤
│ Action       │ [View]    │ [View]    │ [View]   │
│              │ [Add Cart]│ [Add Cart]│ [Add Cart]│
│              │ [×]       │ [×]       │ [×]      │
└─────────────────────────────────────────────────┘

[See More Specs] [Price History Chart]

[Download PDF Comparison]
```

**Key Components**:
- Comparison header with add product button
- Share/Save comparison buttons
- Specification table (responsive)
- Price comparison highlighting (lowest in green)
- Rating comparison
- Stock status indicators
- Add to cart buttons for each product
- Remove product buttons
- Downloadable PDF report
- Price history chart (optional)

---

### 6. Shopping Cart Page

```
┌─────────────────────────────────────────────────┐
│ ◄ Home  Shopping Cart  [Info]                  │ Header
├─────────────────────────────────────────────────┤
│                                                 │
│ Your Cart (3 Items)                             │
│ Saved for later: 1 item                         │
│                                                 │
├─────────────────────────────────────────────────┤
│ CART ITEMS                                      │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Face Serum (50ml)                   ││
│ │         ★4.5 | Daraz Organics              ││
│ │         Price: BDT 1,500 each               ││
│ │         [-] 2 [+] (Max: 10)  [Remove]      ││
│ │         Total: BDT 3,000                    ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Organic Honey (500g)               ││
│ │         ★4.8 | Village Farm                ││
│ │         Price: BDT 800 each                 ││
│ │         [-] 1 [+]  [Remove]                ││
│ │         Total: BDT 800                      ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Face Wash (200ml)                  ││
│ │         ★4.3 | Purity Labs                 ││
│ │         Price: BDT 400 each                 ││
│ │         [-] 1 [+]  [Remove]                ││
│ │         Total: BDT 400                      ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Select All] [Remove Selected] [Checkout]     │
│                                                 │
├─────────────────────────────────────────────────┤
│ SAVED FOR LATER                                 │
│                                                 │
│ [Image] Lip Gloss (12ml) - BDT 350             │
│ [Move to Cart] [Remove]                        │
│                                                 │
├─────────────────────────────────────────────────┤
│ RECOMMENDED (Based on Cart)                     │
│                                                 │
│ [Product Card] [Product Card]                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ ORDER SUMMARY                                   │
│ ┌──────────────────────────────────────────────┐│
│ │ Subtotal (3 items)        BDT 4,200         ││
│ │ Discount (PROMO10)        -BDT 420 (10%)   ││
│ │ Shipping                  BDT 120           ││
│ │ ─────────────────────────────────────────   ││
│ │ Total                     BDT 3,900         ││
│ │                                              ││
│ │ Coupon Code: [___________] [Apply]          ││
│ │                                              ││
│ │ [Continue Shopping]  [CHECKOUT]             ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ May We Help You?                               │
│ This cart has been saved. We'll keep it for    │
│ 7 days                                         │
│                                                 │
│ Footer: About | Terms | Privacy | Contact      │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Cart header with item count
- Cart items list with images, descriptions, prices
- Quantity adj buttons (minus/plus)
- Remove item buttons
- Total price per item
- Save for later option
- Recommended products carousel
- Coupon code input & apply button
- Order summary (Subtotal, Discount, Shipping, Tax, Total)
- Checkout button (sticky on mobile)
- Continue shopping link
- Empty cart message (when applicable)

---

### 7. Checkout Flow

#### Step 1: Shipping Address

```
┌─────────────────────────────────────────────────┐
│ ◄ Cart  Checkout (Step 1 of 3)                 │ Header
├─────────────────────────────────────────────────┤
│ Progress: [●────○────○]  Shipping → Payment   │
│                                                 │
│ SHIPPING ADDRESS                                │
│                                                 │
│ Saved Addresses:                                │
│ ┌─────────────────────────────────────────────┐│
│ │ ☑ Home (Default)                           ││
│ │ Dhaka, Mohakhali, 1212                      ││
│ │ [Edit] [Delete] [Use This]                  ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ ○ Office                                    ││
│ │ Dhaka, Gulshan, 1213                        ││
│ │ [Edit] [Delete] [Use This]                  ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ─────────────────────────────────────────────  │
│ OR, Enter New Address:                          │
│                                                 │
│ Full Name: [___________________]              │
│ Phone: [+880 _______________]                 │
│ Division: [Dhaka ▼]                            │
│ District: [Dhaka ▼]                            │
│ Area/Zone: [Mohakhali ▼]                       │
│ Address: [___________________]                │
│ Apartment/House #: [___________________]      │
│ Postal Code: [___________________]            │
│                                                 │
│ [☐ Set as default address]                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ SHIPPING OPTIONS                                │
│                                                 │
│ ☑ Standard (1-2 days) - BDT 120               │
│ ○ Express (Same day in Dhaka) - BDT 300       │
│ ○ Scheduled (Pick date) - BDT 180             │
│                                                 │
│ Estimated Delivery: Tomorrow by 6 PM           │
│                                                 │
│ [Back] [Continue to Payment]                   │
│                                                 │
│ Order Summary:                                  │
│ BDT 4,200 + BDT 120 shipping = BDT 4,320      │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Progress indicator (step 1-2-3)
- Saved addresses list (with edit/delete/use buttons)
- New address form (with autocomplete for Division/District/Area)
- Shipping method selector (Standard, Express, Scheduled)
- Estimated delivery date
- Back & Continue buttons

#### Step 2: Payment Method Selection

```
┌─────────────────────────────────────────────────┐
│ ◄ Cart  Checkout (Step 2 of 3)                 │ Header
├─────────────────────────────────────────────────┤
│ Progress: [●───●────○]  Payment Method        │
│                                                 │
│ SELECT PAYMENT METHOD                           │
│                                                 │
│ ☑ Cash on Delivery (COD)                       │
│ Pay when you receive your order                │
│                                                 │
│ ○ bKash                                         │
│ Send payment from your bKash app                │
│ [How it works?]                                │
│                                                 │
│ ○ Nagad                                        │
│ Send payment from your Nagad app                │
│                                                 │
│ ○ Credit/Debit Card                            │
│ [Visa/Mastercard]                              │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ If selected Saved Cards:                        │
│ ┌─────────────────────────────────────────────┐│
│ │ ☑ **** **** **** 4242 (Expires 12/25)      ││
│ │ [Edit] [Delete] [Use This]                  ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [+ Add New Card]                               │
│                                                 │
├─────────────────────────────────────────────────┤
│ PROMO CODE / COUPON                             │
│ [_______________] [Apply]                      │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Back] [Continue to Confirmation]              │
│                                                 │
│ Order Summary:                                  │
│ Subtotal: BDT 4,200                           │
│ Shipping: BDT 120                             │
│ Discount: -BDT 420                            │
│ │ Total: BDT 3,900                            │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Payment method selection (Radio buttons)
- COD option (default)
- bKash/Nagad options
- Card payment option
- Saved cards list
- Add new card link
- Coupon code input
- Back & Continue buttons

#### Step 3: Order Confirmation

```
┌─────────────────────────────────────────────────┐
│ ◄ Cart  Order Confirmation                     │ Header
├─────────────────────────────────────────────────┤
│ Progress: [●───●───●]  Confirmation           │
│                                                 │
│ REVIEW YOUR ORDER                               │
│                                                 │
│ Shipping Address:                               │
│ Aisha Khan, +880 1712345678                    │
│ Dhaka, Mohakhali, 1212                         │
│                                                 │
│ Payment Method: Cash on Delivery (COD)         │
│                                                 │
│ ITEMS IN ORDER:                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Face Serum (50ml) x 2                ││
│ │         BDT 1,500 × 2 = BDT 3,000           ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Organic Honey (500g) x 1             ││
│ │         BDT 800 × 1 = BDT 800               ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ [Image] Face Wash (200ml) x 1                ││
│ │         BDT 400 × 1 = BDT 400               ││
│ └─────────────────────────────────────────────┘│
│                                                 │
├─────────────────────────────────────────────────┤
│ PRICE BREAKDOWN:                                │
│ Subtotal (3 items): BDT 4,200                  │
│ Discount (PROMO10): -BDT 420                   │
│ Shipping Charge: BDT 120                       │
│ ─────────────────────────────────              │
│ TOTAL AMOUNT: BDT 3,900                        │
│                                                 │
├─────────────────────────────────────────────────┤
│ DELIVERY INFORMATION:                           │
│ Estimated Delivery: Tomorrow (March 18)         │
│ Track your order after confirmation             │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Edit Shipping] [Edit Payment] [Edit Items]   │
│                                                 │
│ [Back] [❌ PLACE ORDER]                       │
│                                                 │
│ Terms & Conditions accepted                     │
│ Read our [Return Policy]                        │
│ By clicking place order, you agree to our       │
│ Terms of Service and Privacy Policy             │
│                                                 │
│ Footer: About | Terms | Privacy | Contact      │
└─────────────────────────────────────────────────┘
```

#### Step 4: Order Success

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ✓ ORDER PLACED SUCCESSFULLY!        │
│                                                 │
│ Order ID: #GMH-2026-033419                     │
│                                                 │
│ We've sent a confirmation to:                   │
│ aisha.khan@email.com                           │
│ +880 1712345678                                │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ What's Next?                                    │
│ 1. Your order will be confirmed within 2 hours  │
│ 2. We'll notify you when it ships              │
│ 3. Delivery expected by tomorrow                │
│                                                 │
│ Estimated Total: BDT 3,900                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ [View Order Details] [Continue Shopping]       │
│                                                 │
│ Need Help? [Contact Support]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Checkout Key Components**:
- Multi-step progress indicator
- Address form with auto-complete
- Shipping method selector
- Payment method selector
- Order summary (persistent through steps)
- Edit buttons for each section
- Security badges (SSL, payment secure)
- Terms & conditions checkbox
- Back/Next navigation

---

### 8. User Account Dashboard

```
┌─────────────────────────────────────────────────┐
│ ◄ Home  [User Name ▼]  [Logout]               │ Header
├─────────────────────────────────────────────────┤
│ [Profile] [Orders] [Addresses] [Wishlist]     │ Tabs
│ [Notifications] [Settings]                     │
│                                                 │
├─────────────────────────────────────────────────┤
│ PROFILE TAB                                     │
│                                                 │
│ Profile Picture:                                │
│ [Profile Image] [Upload New]                   │
│                                                 │
│ Full Name: Aisha Khan                          │
│ Email: aisha.khan@email.com                    │
│ Phone: +880 1712345678                         │
│ Gender: Female [Edit]                          │
│ Date of Birth: Jan 15, 1995 [Edit]             │
│                                                 │
│ [Edit Profile] [Change Password]               │
│                                                 │
├─────────────────────────────────────────────────┤
│ ORDERS TAB                                      │
│                                                 │
│ Recent Orders:                                  │
│                                                 │
│ [Order #GMH-2026-033419]                       │
│ Status: [Delivered ✓] (Delivered on 17 Mar)   │
│ Items: 3 items | Total: BDT 3,900             │
│ [View Details] [Track] [Review] [Buy Again]   │
│                                                 │
│ [Order #GMH-2026-032891]                       │
│ Status: [In Transit] (Out for delivery today)  │
│ Items: 2 items | Total: BDT 2,150             │
│ [View Details] [Track] [Cancel]                │
│                                                 │
│ [Order #GMH-2026-031456]                       │
│ Status: [Confirmed] (Will ship within 24h)    │
│ Items: 1 item | Total: BDT 1,500              │
│ [View Details] [Cancel]                        │
│                                                 │
│ [View All Orders]                              │
│                                                 │
├─────────────────────────────────────────────────┤
│ ADDRESSES TAB                                   │
│                                                 │
│ Saved Addresses:                                │
│                                                 │
│ ☑ Home                                          │
│ Aisha Khan, +880 1712345678                    │
│ Dhaka, Mohakhali, 1212                         │
│ [Edit] [Delete] [Set as Default]               │
│                                                 │
│ ○ Office                                        │
│ Aisha Khan, +880 1712345678                    │
│ Dhaka, Gulshan, 1213                           │
│ [Edit] [Delete] [Use This]                     │
│                                                 │
│ [+ Add New Address]                            │
│                                                 │
├─────────────────────────────────────────────────┤
│ WISHLIST TAB                                    │
│                                                 │
│ [Product Card] [Product Card] [Product Card]   │
│ [Product Card] [Product Card]                  │
│                                                 │
│ [Price Drop Alerts: 2 items]                   │
│                                                 │
│ Footer: About | Terms | Privacy | Contact      │
└─────────────────────────────────────────────────┘
```

**Key Components**:
- Profile photo upload
- Edit profile form
- Change password form
- Orders list with status, filters, sorting
- Order details modal
- Addresses list with edit/delete
- Add address form
- Wishlist grid with product cards
- Price drop alerts
- Notification preferences
- Account settings (Language, Theme, Privacy)

---

## Responsive Design Breakpoints

```
Mobile:    < 640px  (Vertical layout, single column)
Tablet:    640px-1024px  (Grid 2 columns)
Desktop:   > 1024px (Grid 3-4 columns, sidebar)
```

## Interactive States

### Button States
- **Default**: Full color, normal text
- **Hover**: Darker shade, slight elevation
- **Active**: Selected indicator
- **Disabled**: Gray, no cursor interaction
- **Loading**: Spinner inside button, disabled state

### Input Field States
- **Default**: Border, placeholder text
- **Focus**: Blue border, label above
- **Filled**: Data displayed
- **Error**: Red border, error message below
- **Success**: Green border, checkmark

### Product Card States
- **Default**: Show basic info
- **Hover**: Show action buttons, slightly zoomed
- **Loading**: Skeleton screen
- **Added to cart**: Check mark indicator

---

## Animation & Transitions

- Page transitions: 300ms fade
- Button hover: 200ms color change
- Dropdown open: 150ms slide down
- Modal appearance: 200ms fade + scale
- Loading spinner: Continuous rotation
- Scroll to top: Smooth 500ms animation

---

## Accessibility Features

- Color contrast ratio: 4.5:1 minimum
- Focus indicators visible on all interactive elements
- Keyboard navigation for all features
- Screen reader text for icons
- Alt text for all images
- ARIA labels for form fields
- Semantic HTML structure
- Skip navigation links

---

## Mobile-First Priority Features

1. Fast home page load (skeleton screens)
2. Prominent search bar
3. One-tap product add to cart
4. Simple checkout flow
5. Clear payment options
6. Real-time order tracking
7. Easy account access

---

**Design System Version**: 1.0  
**Last Updated**: March 2026
