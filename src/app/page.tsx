'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import Link from 'next/link';
import { Zap, Shield, Truck, HeadphonesIcon, ChevronRight, TrendingUp, Sparkles, Flame } from 'lucide-react';
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
  seller: {
    id: string;
    storeName: string;
  };
}

const formatBdt = (value: number) => `BDT ${value.toLocaleString()}`;

const computeMoq = (stock: number) => {
  if (stock >= 500) return 10;
  if (stock >= 200) return 5;
  if (stock >= 80) return 2;
  return 1;
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=24');
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

  const topDeals = featuredProducts.slice(0, 6);
  const topRanking = [...featuredProducts]
    .sort((a, b) => (Number(b.rating) - Number(a.rating)) || (b.reviewCount - a.reviewCount))
    .slice(0, 3);
  const newArrivals = featuredProducts.slice(6, 9);

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

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white py-14">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_80%_80%,white,transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <p className="uppercase tracking-[0.24em] text-xs font-semibold text-emerald-100 mb-3">Global Sourcing Marketplace</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trade smarter with verified products and better prices</h1>
          <p className="text-lg text-emerald-50 mb-8">Discover trend-driven deals, supplier-ready catalogs, and cross-border inventory in one place.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/products"
              className="bg-white text-emerald-700 px-8 py-3 rounded-full font-bold hover:bg-emerald-50 transition"
            >
              Shop Now
            </Link>
            <button
              onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white px-8 py-3 rounded-full font-bold hover:bg-white/15 transition"
            >
              Explore Showcase
            </button>
          </div>
        </div>
      </div>

      {/* Showcase Blocks */}
      <div className="max-w-7xl mx-auto px-4 py-5 w-full" id="featured">
        <section className="bg-white border-2 border-emerald-600/80 rounded-2xl p-4 md:p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1">Top Deals</h2>
              <p className="text-gray-600 text-base">Score the lowest prices on GlobalMarketHub</p>
            </div>
            <Link href="/products" className="font-bold text-gray-900 text-xl hover:text-emerald-700 transition inline-flex items-center gap-1.5">
              View more <ChevronRight size={22} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {topDeals.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group rounded-xl bg-gray-50 border border-transparent hover:border-emerald-200 transition p-1.5 md:p-2">
                <div className="bg-white rounded-lg overflow-hidden mb-2 h-36 md:h-40">
                  <img
                    src={product.mainImage}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="rounded-full bg-rose-100 text-red-700 font-bold text-lg md:text-xl px-2.5 py-1 mb-1.5 inline-flex items-center gap-1.5 max-w-full">
                  <span className="text-red-400 text-base">▼</span>
                  <span className="truncate">{formatBdt(product.currentPrice)}</span>
                </div>
                <p className="underline text-xl text-gray-800">MOQ: {computeMoq(product.stock)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1 inline-flex items-center gap-2">
                  <TrendingUp size={24} className="text-emerald-600" />
                  Top Ranking
                </h2>
                <p className="text-gray-600 text-base">Navigate trends with data-driven rankings</p>
              </div>
              <Link href="/products?sort=rating" className="font-bold text-gray-900 text-xl hover:text-emerald-700 transition inline-flex items-center gap-1.5">
                View more <ChevronRight size={22} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {topRanking.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className="group bg-gray-50 rounded-xl p-1.5 md:p-2 border border-transparent hover:border-emerald-200 transition">
                  <div className="rounded-lg overflow-hidden bg-white mb-2 relative h-36 md:h-40">
                    <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-stone-900/85 text-amber-300 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Top</span>
                  </div>
                  <p className="font-semibold text-xl text-gray-900 truncate underline">{product.title}</p>
                  <p className="text-gray-600 underline text-xl">Hot selling</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1 inline-flex items-center gap-2">
                  <Sparkles size={24} className="text-emerald-600" />
                  New Arrivals
                </h2>
                <p className="text-gray-600 text-base">Stay ahead with the latest product offerings</p>
              </div>
              <Link href="/products?sort=createdAt" className="font-bold text-gray-900 text-xl hover:text-emerald-700 transition inline-flex items-center gap-1.5">
                View more <ChevronRight size={22} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {newArrivals.map((product, index) => (
                <Link key={product.id} href={`/product/${product.id}`} className="group bg-gray-50 rounded-xl p-1.5 md:p-2 border border-transparent hover:border-emerald-200 transition">
                  <div className="rounded-lg overflow-hidden bg-white mb-2 relative h-36 md:h-40">
                    <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 text-sm bg-violet-600 text-white px-2 py-1 rounded-full">Fresh</span>
                    )}
                    {index === 2 && (
                      <span className="absolute top-2 right-2 text-sm bg-orange-500 text-white px-2 py-1 rounded">Best Seller</span>
                    )}
                  </div>
                  <p className="font-bold text-3xl text-gray-900 underline leading-tight mb-1">{formatBdt(product.currentPrice)}</p>
                  <p className="text-xl text-gray-800 underline">MOQ: {computeMoq(product.stock)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <Truck className="mx-auto mb-4 text-emerald-600" size={32} />
              <h3 className="font-bold mb-2">Fast Shipping</h3>
              <p className="text-gray-600 text-sm">Delivery to your doorstep within 3-7 days</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto mb-4 text-emerald-600" size={32} />
              <h3 className="font-bold mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">Multiple payment methods with encryption</p>
            </div>
            <div className="text-center">
              <Zap className="mx-auto mb-4 text-emerald-600" size={32} />
              <h3 className="font-bold mb-2">Best Prices</h3>
              <p className="text-gray-600 text-sm">Competitive pricing and regular discounts</p>
            </div>
            <div className="text-center">
              <Flame className="mx-auto mb-4 text-emerald-600" size={32} />
              <h3 className="font-bold mb-2">Trending Picks</h3>
              <p className="text-gray-600 text-sm">Curated products based on demand and conversion</p>
            </div>
            <div className="text-center">
              <HeadphonesIcon className="mx-auto mb-4 text-emerald-600" size={32} />
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
          products={featuredProducts}
          loading={loading}
          onAddToCart={handleAddToCart}
          columns={4}
        />
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
                className="p-6 border rounded-lg text-center hover:border-emerald-600 hover:bg-emerald-50 transition"
              >
                <p className="text-2xl mb-2">{cat.name.split(' ')[0]}</p>
                <p className="text-sm font-semibold text-gray-700">{cat.name.split(' ').slice(1).join(' ')}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-emerald-100 border-y py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">New to GlobalMarketHub?</h2>
          <p className="text-gray-700 mb-6">Sign up and get exclusive deals and early access to new products</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-lg font-bold hover:bg-emerald-50"
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
