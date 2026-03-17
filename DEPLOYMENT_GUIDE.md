# Deployment Guide: GlobalMarketHub

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository pushed
- Environment variables configured

### Step 1: Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Step 2: Set Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add all variables from `.env.local`:

```
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Payment Gateways
UDDOKTAPAY_API_KEY=your_uddoktapay_key
UDDOKTAPAY_API_SECRET=your_uddoktapay_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLIC_KEY=your_stripe_public

# Email Service
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
```

### Step 3: Setup CI/CD

1. Push to GitHub
2. Vercel automatically detects Next.js
3. Builds and deploys on every push to main/master

## Manual Deployment Steps

### 1. Build Locally
```bash
npm run build
npm run start
```

### 2. Test Production Build
```bash
# Build
npm run build

# Start production server
npm run start

# Visit http://localhost:3000
```

### 3. Deploy to Cloud Provider

#### Option A: Vercel (Recommended)
- Zero-config
- Automatic HTTPS
- Global CDN
- Serverless functions

```bash
vercel --prod
```

#### Option B: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

#### Option C: Render
1. Connect GitHub repo
2. Create Web Service
3. Add environment variables
4. Deploy

#### Option D: Docker (Self-hosted)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Setup

### 1. Supabase Database
```bash
# Connection string already configured
# Verify connection:
prisma db push
```

### 2. Payment Gateways

#### UddoktaPay (Primary - Bangladesh)
```bash
# Get API credentials from: https://uddoktapay.com/developer
UDDOKTAPAY_API_KEY=your_key
UDDOKTAPAY_API_SECRET=your_secret
```

#### Stripe (International)
```bash
# Get keys from: https://dashboard.stripe.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Email Service (EmailJS)
```bash
# Free 200 emails/month: https://www.emailjs.com
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=public_key_xxxxx
```

## Production Checklist

- [ ] Environment variables set
- [ ] Database migrated and seeded
- [ ] HTTPS enabled
- [ ] API keys configured
- [ ] Email service connected
- [ ] Payment gateways tested
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Analytics enabled (Google Analytics)
- [ ] Security headers configured

## Monitoring

### Vercel Analytics
- Built-in Core Web Vitals
- Real User Monitoring (RUM)
- Deployment analytics

### Database Monitoring
```bash
# Check Supabase dashboard for:
# - Query performance
# - Connection limits
# - Backup status
```

### Error Tracking
```bash
# Optional: Setup Sentry for error tracking
npm install @sentry/nextjs
```

## Scaling Tips

- [ ] Enable image optimization
- [ ] Setup database connection pooling
- [ ] Configure caching headers
- [ ] Use CDN for static assets
- [ ] Implement rate limiting
- [ ] Setup automated backups
- [ ] Monitor database performance

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
prisma db execute
```

### Vercel Deployment Issues
```bash
# Check build logs
vercel logs

# Rebuild
vercel --force
```

## Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Database](https://www.prisma.io/docs/)
- [Supabase PostgreSQL](https://supabase.com/docs)

## Support

For issues, contact:
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
- Email: support@globalmarkethub.com
