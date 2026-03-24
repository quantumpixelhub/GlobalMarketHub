'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import Link from 'next/link';
import { Zap, Shield, Truck, HeadphonesIcon, ChevronRight, ChevronLeft, TrendingUp, Sparkles, Flame, Megaphone, Ticket } from 'lucide-react';
import { addToGuestCart } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

interface Product {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  mainImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    storeName: string;
  };
}

interface ActiveCoupon {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  expires: string;
  status: 'Active' | 'Inactive' | 'Expired';
}

interface ActiveCampaign {
  id: string;
  name: string;
  description: string;
  badge: string;
  discountText: string;
  startsAt: string;
  endsAt: string;
  status: 'Active' | 'Inactive' | 'Scheduled' | 'Ended';
}

const formatBdt = (value: number) => `BDT ${value.toLocaleString()}`;

const computeMoq = (stock: number) => {
  if (stock >= 500) return 10;
  if (stock >= 200) return 5;
  if (stock >= 80) return 2;
  return 1;
};

export default function HomePage() {
  const BANNER_CARD_STEP = 236;
  const FEATURED_INITIAL_COUNT = 16;
  const FEATURED_LOAD_STEP = 16;
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [visibleFeaturedCount, setVisibleFeaturedCount] = useState(FEATURED_INITIAL_COUNT);
  const [isLoadingMoreFeatured, setIsLoadingMoreFeatured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState<'topSell' | 'topRanking' | 'topReviews' | 'random'>('topSell');
  const [randomBannerProducts, setRandomBannerProducts] = useState<Product[]>([]);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<ActiveCoupon | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);
  const [bannerPage, setBannerPage] = useState(0);
  const [bannerPages, setBannerPages] = useState(1);
  const bannerTrackRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=120');
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    setVisibleFeaturedCount(FEATURED_INITIAL_COUNT);
  }, [featuredProducts]);

  useEffect(() => {
    const fetchMarketing = async () => {
      try {
        const res = await fetch('/api/marketing/active');
        if (!res.ok) return;

        const data = await res.json();
        setActiveCoupon(data.coupon || null);
        setActiveCampaigns(data.campaigns || []);
      } catch (error) {
        console.error('Error fetching marketing data:', error);
      }
    };

    fetchMarketing();
  }, []);

  useEffect(() => {
    setRandomBannerProducts([...featuredProducts].sort(() => Math.random() - 0.5).slice(0, 12));
  }, [featuredProducts]);

  const topDeals = featuredProducts.slice(0, 6);
  const topSell = [...featuredProducts]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 12);
  const topRanking = [...featuredProducts]
    .sort((a, b) => (Number(b.rating) - Number(a.rating)) || (b.reviewCount - a.reviewCount))
    .slice(0, 12);
  const topRankingShowcase = topRanking.slice(0, 6);
  const topReviews = [...featuredProducts]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 12);
  const bannerProductsMap = {
    topSell,
    topRanking,
    topReviews,
    random: randomBannerProducts,
  };

  const bannerProducts = bannerProductsMap[activeBanner] || [];

  const bannerTitleMap = {
    topSell: 'Top Sell Products',
    topRanking: 'Top Ranking Products',
    topReviews: 'Top Reviews Products',
    random: 'Random Products',
  };

  const bannerSubtitleMap = {
    topSell: 'High-demand picks selling fastest this week',
    topRanking: 'Best rated products with strong performance',
    topReviews: 'Most reviewed products trusted by buyers',
    random: 'A rotating mix of products across categories',
  };

  const newArrivals = featuredProducts.slice(6, 12);
  const visibleFeaturedProducts = featuredProducts.slice(0, visibleFeaturedCount);
  const hasMoreFeaturedProducts = visibleFeaturedCount < featuredProducts.length;

  const handleLoadMoreFeatured = () => {
    if (isLoadingMoreFeatured || !hasMoreFeaturedProducts) return;
    setIsLoadingMoreFeatured(true);

    window.setTimeout(() => {
      setVisibleFeaturedCount((prev) => prev + FEATURED_LOAD_STEP);
      setIsLoadingMoreFeatured(false);
    }, 350);
  };

  const getBannerPageStep = (container: HTMLDivElement) => {
    const cardsPerPage = Math.max(1, Math.floor(container.clientWidth / BANNER_CARD_STEP));
    return cardsPerPage * BANNER_CARD_STEP;
  };

  const updateBannerPagination = () => {
    const container = bannerTrackRef.current;
    if (!container) return;

    const cardsPerPage = Math.max(1, Math.floor(container.clientWidth / BANNER_CARD_STEP));
    const totalPages = Math.max(1, Math.ceil(bannerProducts.length / cardsPerPage));
    const pageStep = getBannerPageStep(container);
    const currentPage = Math.min(totalPages - 1, Math.round(container.scrollLeft / pageStep));

    setBannerPages(totalPages);
    setBannerPage(currentPage);
  };

  const goToBannerPage = (pageIndex: number) => {
    const container = bannerTrackRef.current;
    if (!container) return;

    const pageStep = getBannerPageStep(container);
    container.scrollTo({
      left: Math.max(0, pageIndex) * pageStep,
      behavior: 'smooth',
    });
  };

  const scrollBanner = (direction: 'left' | 'right') => {
    const container = bannerTrackRef.current;
    if (!container) return;

    const step = getBannerPageStep(container);
    const delta = direction === 'left' ? -step : step;
    container.scrollBy({ left: delta, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = bannerTrackRef.current;
    if (!container) return;

    container.scrollTo({ left: 0, behavior: 'smooth' });
    setBannerPage(0);
    updateBannerPagination();
  }, [activeBanner]);

  useEffect(() => {
    const container = bannerTrackRef.current;
    if (!container) return;

    const onScroll = () => updateBannerPagination();
    const onResize = () => updateBannerPagination();

    updateBannerPagination();
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [bannerProducts.length]);

  useEffect(() => {
    const container = bannerTrackRef.current;
    if (!container || isBannerPaused || bannerProducts.length === 0) return;

    const interval = window.setInterval(() => {
      const step = getBannerPageStep(container);
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const nextLeft = container.scrollLeft + step;

      if (nextLeft >= maxScrollLeft - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 2800);

    return () => window.clearInterval(interval);
  }, [bannerProducts, isBannerPaused]);

  const handleAddToCart = async (productId: string) => {
    const product = featuredProducts.find((p) => p.id === productId);
    if (!product) return;

    const token = localStorage.getItem('token');
    if (!token) {
      addToGuestCart({
        id: product.id,
        title: product.title,
        mainImage: product.mainImage,
        currentPrice: product.currentPrice,
      });
      showToast('Added to cart as guest. Login for easier checkout next time.', 'success');
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          priceSnapshot: featuredProducts.find(p => p.id === productId)?.currentPrice,
        }),
      });

      if (res.ok) {
        showToast('Added to cart.', 'success');
        window.dispatchEvent(new Event('cart-updated'));
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: product.currentPrice,
        });
        showToast('Session expired. Added to guest cart instead.', 'info');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to add to cart.', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      addToGuestCart({
        id: product.id,
        title: product.title,
        mainImage: product.mainImage,
        currentPrice: product.currentPrice,
      });
      showToast('Network issue. Added to guest cart instead.', 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      {/* Scrollable Marketplace Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 w-full">
        <section className="bg-gradient-to-r from-rose-50 via-white to-cyan-50 rounded-2xl p-4 md:p-5 text-gray-900 border border-rose-100 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-rose-700 mb-1">Featured Marketplace Stream</p>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{bannerTitleMap[activeBanner]}</h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">{bannerSubtitleMap[activeBanner]}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveBanner('topSell')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${activeBanner === 'topSell' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
              >
                Top Sell
              </button>
              <button
                type="button"
                onClick={() => setActiveBanner('topRanking')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${activeBanner === 'topRanking' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
              >
                Top Ranking
              </button>
              <button
                type="button"
                onClick={() => setActiveBanner('topReviews')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${activeBanner === 'topReviews' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
              >
                Top Reviews
              </button>
              <button
                type="button"
                onClick={() => setActiveBanner('random')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${activeBanner === 'random' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
              >
                Random
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Autoplay is on. Hover to pause.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollBanner('left')}
                className="w-8 h-8 rounded-full border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 transition flex items-center justify-center"
                aria-label="Scroll banner left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollBanner('right')}
                className="w-8 h-8 rounded-full border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 transition flex items-center justify-center"
                aria-label="Scroll banner right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={bannerTrackRef}
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
            onTouchStart={(e) => {
              setIsBannerPaused(true);
              touchStartXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const startX = touchStartXRef.current;
              const endX = e.changedTouches[0]?.clientX;

              if (startX !== null && typeof endX === 'number') {
                const deltaX = endX - startX;
                if (Math.abs(deltaX) > 45) {
                  scrollBanner(deltaX > 0 ? 'left' : 'right');
                }
              }

              touchStartXRef.current = null;
              setIsBannerPaused(false);
            }}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {bannerProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="snap-start min-w-[220px] max-w-[220px] bg-white text-gray-900 rounded-xl p-2.5 border border-rose-100 hover:border-rose-300 transition"
              >
                <div className="h-28 rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold mb-1 truncate">
                  {product.category?.name || 'General Category'}
                </p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{product.title}</p>
                <p className="text-base font-bold text-gray-900">{formatBdt(product.currentPrice)}</p>
              </Link>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: bannerPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToBannerPage(index)}
                className={`h-2.5 rounded-full transition-all ${bannerPage === index ? 'w-6 bg-rose-600' : 'w-2.5 bg-rose-300 hover:bg-rose-400'}`}
                aria-label={`Go to carousel page ${index + 1}`}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Showcase Blocks */}
      <div className="max-w-7xl mx-auto px-4 py-5 w-full" id="featured">
        <section className="bg-white border-2 border-rose-600/80 rounded-2xl p-4 md:p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1">Top Deals</h2>
              <p className="text-gray-600 text-base">Score the lowest prices on GlobalMarketHub</p>
            </div>
            <Link href="/products" className="font-bold text-gray-900 text-xl hover:text-rose-700 transition inline-flex items-center gap-1.5">
              View more <ChevronRight size={22} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {topDeals.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group rounded-xl bg-gray-50 border border-transparent hover:border-rose-200 transition p-1.5 md:p-2">
                <div className="bg-white rounded-lg overflow-hidden mb-2 h-32 md:h-36">
                  <img
                    src={product.mainImage}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="min-h-[62px]">
                  <p className="font-semibold text-xs text-gray-900 truncate underline">{product.title}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <p className="text-sm font-bold text-rose-600 leading-none">{formatBdt(product.currentPrice)}</p>
                    {product.originalPrice > product.currentPrice && (
                      <p className="text-xs text-gray-400 line-through leading-none">{formatBdt(product.originalPrice)}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 underline leading-tight mt-1">MOQ: {computeMoq(product.stock)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1 inline-flex items-center gap-2">
                  <TrendingUp size={24} className="text-rose-600" />
                  Top Ranking
                </h2>
                <p className="text-gray-600 text-base">Navigate trends with data-driven rankings</p>
              </div>
              <Link href="/products?sort=rating" className="font-bold text-gray-900 text-xl hover:text-rose-700 transition inline-flex items-center gap-1.5">
                View more <ChevronRight size={22} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 flex-1">
              {topRankingShowcase.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className="group bg-gray-50 rounded-xl p-1.5 md:p-2 border border-transparent hover:border-rose-200 transition h-full flex flex-col">
                  <div className="rounded-lg overflow-hidden bg-white mb-2 relative h-32 md:h-36">
                    <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-stone-900/85 text-amber-300 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Top</span>
                  </div>
                  <div className="min-h-[62px]">
                    <p className="font-semibold text-xs text-gray-900 truncate underline">{product.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <p className="text-sm font-bold text-rose-600 leading-none">{formatBdt(product.currentPrice)}</p>
                      {product.originalPrice > product.currentPrice && (
                        <p className="text-xs text-gray-400 line-through leading-none">{formatBdt(product.originalPrice)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1 inline-flex items-center gap-2">
                  <Sparkles size={24} className="text-rose-600" />
                  New Arrivals
                </h2>
                <p className="text-gray-600 text-base">Stay ahead with the latest product offerings</p>
              </div>
              <Link href="/products?sort=createdAt" className="font-bold text-gray-900 text-xl hover:text-rose-700 transition inline-flex items-center gap-1.5">
                View more <ChevronRight size={22} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 flex-1">
              {newArrivals.map((product, index) => (
                <Link key={product.id} href={`/product/${product.id}`} className="group bg-gray-50 rounded-xl p-1.5 md:p-2 border border-transparent hover:border-rose-200 transition h-full flex flex-col">
                  <div className="rounded-lg overflow-hidden bg-white mb-2 relative h-32 md:h-36">
                    <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 text-sm bg-violet-600 text-white px-2 py-1 rounded-full">Fresh</span>
                    )}
                    {index === 2 && (
                      <span className="absolute top-2 right-2 text-sm bg-rose-600 text-white px-2 py-1 rounded">Best Seller</span>
                    )}
                  </div>
                  <div className="min-h-[62px]">
                    <p className="font-semibold text-xs text-gray-900 truncate underline">{product.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <p className="text-sm font-bold text-rose-600 leading-none">{formatBdt(product.currentPrice)}</p>
                      {product.originalPrice > product.currentPrice && (
                        <p className="text-xs text-gray-400 line-through leading-none">{formatBdt(product.originalPrice)}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 underline leading-tight mt-1">MOQ: {computeMoq(product.stock)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Campaign & Coupon Section */}
      <div className="max-w-7xl mx-auto px-4 pb-6 w-full">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-sky-600 to-cyan-500 text-white border border-sky-500">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone size={20} />
              <h3 className="text-xl font-bold">Active Campaigns</h3>
            </div>
            <p className="text-sm text-cyan-50 mb-3">Limited-time category promotions running this week.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(activeCampaigns.length > 0
                ? activeCampaigns.slice(0, 2)
                : [
                    {
                      id: 'fallback-1',
                      name: 'Set campaigns in Admin',
                      description: 'Create an active campaign from Admin > Campaigns.',
                      badge: 'Setup',
                      discountText: 'Offer text will appear here',
                    },
                  ]
              ).map((campaign) => (
                <div key={campaign.id} className="bg-white/15 rounded-lg p-2 border border-white/25">
                  <p className="text-xs uppercase tracking-wide text-cyan-100 mb-1">{campaign.badge}</p>
                  <p className="font-semibold line-clamp-1">{campaign.name}</p>
                  <p className="text-sm text-cyan-100 line-clamp-1">{campaign.description}</p>
                  <p className="text-sm text-cyan-50 mt-1">{campaign.discountText}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 md:p-5 bg-white border border-amber-200">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Ticket size={20} />
              <h3 className="text-xl font-bold text-gray-900">Coupon Center</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Showing currently active coupon from Admin panel.</p>
            {activeCoupon ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-bold text-base text-amber-800">{activeCoupon.code}</p>
                <p className="text-sm text-gray-700 mt-1">{activeCoupon.discount}% off on orders above BDT {activeCoupon.minOrder.toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">Expires: {activeCoupon.expires}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-600">No active coupon found. Activate one in Admin &gt; Coupons.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <Truck className="mx-auto mb-4 text-rose-600" size={32} />
              <h3 className="font-bold mb-2">Fast Shipping</h3>
              <p className="text-gray-600 text-sm">Delivery to your doorstep within 3-7 days</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto mb-4 text-rose-600" size={32} />
              <h3 className="font-bold mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">Multiple payment methods with encryption</p>
            </div>
            <div className="text-center">
              <Zap className="mx-auto mb-4 text-rose-600" size={32} />
              <h3 className="font-bold mb-2">Best Prices</h3>
              <p className="text-gray-600 text-sm">Competitive pricing and regular discounts</p>
            </div>
            <div className="text-center">
              <Flame className="mx-auto mb-4 text-rose-600" size={32} />
              <h3 className="font-bold mb-2">Trending Picks</h3>
              <p className="text-gray-600 text-sm">Curated products based on demand and conversion</p>
            </div>
            <div className="text-center">
              <HeadphonesIcon className="mx-auto mb-4 text-rose-600" size={32} />
              <h3 className="font-bold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Our team is always ready to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-12 w-full" id="featured-products">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <ProductGrid
          products={visibleFeaturedProducts}
          loading={loading}
          onAddToCart={handleAddToCart}
          columns={4}
        />
        {!loading && featuredProducts.length > 0 && (
          <p className="mt-5 text-center text-sm text-gray-600">
            Showing {visibleFeaturedProducts.length} of {featuredProducts.length} products
          </p>
        )}
        {!loading && hasMoreFeaturedProducts && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMoreFeatured}
              disabled={isLoadingMoreFeatured}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-8 py-3 text-white font-semibold hover:bg-rose-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingMoreFeatured && (
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              )}
              {isLoadingMoreFeatured ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}
      </div>

      {/* Categories Showcase */}
      <div className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <h2 className="text-3xl font-bold mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: '📱 Electronics', icon: 'Electronics' },
              { name: '👕 Clothing', icon: 'Clothing' },
              { name: '🏠 Home', icon: 'Home & Kitchen' },
              { name: '⚽ Sports', icon: 'Sports' },
              { name: '📚 Books', icon: 'Books' },
              { name: '💊 Health', icon: 'Health & Beauty' },
            ].map((cat) => (
              <Link
                key={cat.icon}
                href={`/products?category=${cat.icon.toLowerCase()}`}
                className="p-6 border rounded-lg text-center hover:border-rose-600 hover:bg-rose-50 transition"
              >
                <p className="text-2xl mb-2">{cat.name.split(' ')[0]}</p>
                <p className="text-sm font-semibold text-gray-700">{cat.name.split(' ').slice(1).join(' ')}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-rose-100 border-y py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">New to GlobalMarketHub?</h2>
          <p className="text-gray-700 mb-6">Sign up and get exclusive deals and early access to new products</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-rose-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-rose-700"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="border-2 border-rose-600 text-rose-600 px-8 py-3 rounded-lg font-bold hover:bg-rose-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
