/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.daraz.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'img.drz.lazcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.pickaboo.com',
      },
      {
        protocol: 'https',
        hostname: '**.sajgoj.com',
      },
      {
        protocol: 'https',
        hostname: '**.shajgoj.com',
      },
      {
        protocol: 'https',
        hostname: 'www.yellowclothing.net',
      },
      {
        protocol: 'https',
        hostname: 'objectstorage.ap-singapore-1.oraclecloud.com',
      },
      {
        protocol: 'https',
        hostname: 'catseye.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'www.catseye.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'i.chaldn.com',
      },
      {
        protocol: 'https',
        hostname: 'rokbucket.rokomari.io',
      },
      {
        protocol: 'https',
        hostname: 'ae-pic-a1.aliexpress-media.com',
      },
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 's.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'www.startech.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'easyfashion.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'computersource.com.bd',
      },
      {
        protocol: 'https',
        hostname: 'ghorerbazar.com',
      },
      {
        protocol: 'https',
        hostname: 'back-office.ghorerbazarbd.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-API-Version',
            value: '1.0',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
