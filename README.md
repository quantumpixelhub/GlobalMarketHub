# GlobalMarketHub - Project Setup

This is the full-stack implementation of GlobalMarketHub, a Bangladesh-focused e-commerce marketplace aggregating products from Daraz, Pickaboo, and Sajgoj.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, TypeScript
- **Backend**: Vercel API Routes (Serverless)
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Email**: EmailJS
- **Payments**: UddoktaPay (Primary), Stripe, bKash, Nagad, Rocket, iPay
- **Hosting**: Vercel (Full-Stack)

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- Git
- Supabase account
- Vercel account

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd GlobalMarketHub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. **Set up database**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes (Backend)
│   │   ├── auth/
│   │   ├── products/
│   │   ├── payments/
│   │   ├── orders/
│   │   ├── cart/
│   │   ├── reviews/
│   │   ├── users/
│   │   └── admin/
│   ├── (shop)/                 # Frontend pages - Shop
│   ├── (dashboard)/            # Frontend pages - User Dashboard
│   ├── admin/                  # Admin pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                 # React components
│   ├── ui/                     # Base components
│   ├── product/
│   ├── cart/
│   ├── auth/
│   └── admin/
├── hooks/                      # Custom React hooks
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── prisma.ts              # Prisma client
│   ├── payment-gateways/      # Payment integrations
│   └── db/
├── store/                      # Redux store
│   └── slices/
├── styles/                     # Additional styles
└── types/                      # TypeScript types

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Database seeding

.github/
└── workflows/
    └── ci-cd.yml              # GitHub Actions

Configuration Files:
- package.json
- tsconfig.json
- next.config.js
- vercel.json
- tailwind.config.js
- postcss.config.js
- .env.example
- .env.local
- .gitignore
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables. Key ones:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
JWT_SECRET="..."

# Payment Gateways
UDDOKTAPAY_API_KEY="..."
STRIPE_SECRET_KEY="..."

# Email
EMAILJS_SERVICE_ID="..."
EMAILJS_PUBLIC_KEY="..."

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 💾 Database Setup

### Connect to Supabase

1. Create a project on [Supabase](https://supabase.com)
2. Get your connection string from Settings > Database
3. Add to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://user:password@db.supabaseapi.com:5432/postgres"
   ```

### Push Schema

```bash
npx prisma db push
```

### View Database

```bash
npx prisma studio
```

## 🏗️ Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add environment variables
   - Deploy

3. **Verify deployment**
   - Check [your-project].vercel.app

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Lint check
npm run lint

# Type check
npm run type-check
```

## 📝 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linter issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check

# Database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to database
npx prisma db seed      # Seed database
npx prisma studio      # Open Prisma Studio
```

## 🔑 Key Features

### Authentication
- JWT-based authentication
- Refresh token strategy
- Phone number verification (OTP)

### Products
- Full-text search
- Product comparison
- Price history tracking
- Review system

### Payment
- Admin-configurable payment gateways
- UddoktaPay (Primary)
- Stripe (Card payments)
- Multiple mobile wallets
- Cash on delivery (MVP default)

### User Features
- Shopping cart
- Wishlist
- Order tracking
- Review & ratings
- Address management

### Admin Features
- Product management
- Payment gateway configuration
- Order management
- User management
- Analytics dashboard

## 📖 API Documentation

API endpoints are documented in the blueprint files. See `docs/04-BACKEND-ARCHITECTURE.md` for complete API reference.

### Example: Fetch Products

```bash
curl http://localhost:3000/api/products?page=1&limit=20
```

### Example: Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cartId": "...", "shippingAddressId": "..."}'
```

## 🐛 Troubleshooting

### Prisma Connection Issues
```bash
# Reset database
npx prisma db push --force-reset

# Regenerate client
npx prisma generate
```

### Port Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Blueprint Documentation](./blueprint/)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For questions or issues, please refer to the blueprint documentation or create an issue in the repository.

---

**Happy Coding!** 🚀
