import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GlobalMarketHub - Bangladesh E-commerce Marketplace',
  description: 'Shop organically sourced products, skincare & cosmetics from Daraz, Pickaboo, and Sajgoj',
  keywords: ['e-commerce', 'Bangladesh', 'organic', 'skincare', 'cosmetics'],
  authors: [{ name: 'GlobalMarketHub Team' }],
  viewport: { width: 'device-width', initialScale: 1 },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'GlobalMarketHub',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
