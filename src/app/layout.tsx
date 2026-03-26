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


import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
const EmojiCategoryBrowser = dynamic(() => import('@/components/shared/EmojiCategoryBrowser').then(m => m.EmojiCategoryBrowser), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only show sidebar on non-homepage routes
  const isHome = typeof window !== 'undefined' ? window.location.pathname === '/' : false;
  // SSR-safe: fallback to hiding sidebar on homepage only if window is defined
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ToastProvider>
          <div className="flex flex-1 min-h-0">
            {/* Sidebar: only on non-homepage routes */}
            {!isHome && (
              <aside className="hidden md:flex flex-col w-20 min-w-[78px] max-w-[120px] bg-[#fcfcfc] border-r border-gray-100 py-6 px-2 z-20">
                <EmojiCategoryBrowser />
              </aside>
            )}
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
