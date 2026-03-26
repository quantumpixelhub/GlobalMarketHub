import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { CustomerSupportChatbot } from '@/components/support/CustomerSupportChatbot';
import { ScrollToTopButton } from '@/components/shared/ScrollToTopButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GlobalMarketHub - Bangladesh E-commerce Marketplace',
  description: 'Shop organically sourced products, skincare & cosmetics from Daraz, Pickaboo, and Sajgoj',
  keywords: ['e-commerce', 'Bangladesh', 'organic', 'skincare', 'cosmetics'],
  authors: [{ name: 'GlobalMarketHub Team' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  viewport: { width: 'device-width', initialScale: 1 },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'GlobalMarketHub',
  },
};

import { EmojiCategoryBrowser } from '@/components/shared/EmojiCategoryBrowser';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ToastProvider>
          <div className="flex flex-1 min-h-0">
            {/* Sidebar: always visible, flush left, off-white */}
            <aside className="hidden md:flex flex-col w-20 min-w-[78px] max-w-[120px] bg-[#fcfcfc] border-r border-gray-100 py-6 px-2 z-20">
              <EmojiCategoryBrowser />
            </aside>
            {/* Main content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <ScrollToTopButton />
          <CustomerSupportChatbot />
        </ToastProvider>
      </body>
    </html>
  );
}
