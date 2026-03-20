'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { addToGuestCart } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

type SortMode = 'best_price' | 'trust_seller' | 'most_reviews' | 'highest_rated' | 'best_value';

interface SearchListing {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  mainImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  sourceType?: 'LOCAL' | 'DOMESTIC' | 'INTERNATIONAL';
  sourcePlatform?: string;
  externalUrl?: string;
  lastSyncedAt?: string;
  discountVerified?: boolean;
  seller: {
    id: string;
    storeName: string;
  };
}

interface SearchResponse {
  sections?: {
    localInventory: SearchListing[];
    domesticSellers: SearchListing[];
    internationalSellers: SearchListing[];
  };
  results?: SearchListing[];
  sortMode?: SortMode;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [localProducts, setLocalProducts] = useState<SearchListing[]>([]);
  const [domesticProducts, setDomesticProducts] = useState<SearchListing[]>([]);
  const [internationalProducts, setInternationalProducts] = useState<SearchListing[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('best_value');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLocalProducts([]);
        setDomesticProducts([]);
        setInternationalProducts([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&sortMode=${encodeURIComponent(sortMode)}`,
        );
        const data: SearchResponse = await res.json();

        if (data.sections) {
          setLocalProducts(data.sections.localInventory || []);
          setDomesticProducts(data.sections.domesticSellers || []);
          setInternationalProducts(data.sections.internationalSellers || []);
          return;
        }

        setLocalProducts(data.results || []);
        setDomesticProducts([]);
        setInternationalProducts([]);
      } catch (error) {
        console.error('Search error:', error);
        setLocalProducts([]);
        setDomesticProducts([]);
        setInternationalProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, sortMode]);

  const handleAddToCart = async (productId: string) => {
    try {
      const product = localProducts.find((p) => p.id === productId);
      if (!product) return;

      const token = localStorage.getItem('token');
      if (!token) {
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
        showToast('Added to cart as guest. Login for easier checkout next time.', 'success');
        return;
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        showToast('Product added to cart.', 'success');
        window.dispatchEvent(new Event('cart-updated'));
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
        showToast('Session expired. Added to guest cart instead.', 'info');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to add product to cart.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      const product = localProducts.find((p) => p.id === productId);
      if (product) {
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
      }
      showToast('Network issue. Added to guest cart instead.', 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600 mb-8">
          {query && `Showing results for "${query}"`}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label htmlFor="sort-mode" className="text-sm text-gray-700 font-medium">
            Sort by:
          </label>
          <select
            id="sort-mode"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="best_value">Best Value</option>
            <option value="best_price">Best Price</option>
            <option value="trust_seller">Trust Seller</option>
            <option value="most_reviews">Most Reviews</option>
            <option value="highest_rated">Highest Rated</option>
          </select>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Local Inventory</h2>
            <span className="text-sm text-gray-500">{localProducts.length} items</span>
          </div>
          <ProductGrid
            products={localProducts}
            loading={loading}
            onAddToCart={handleAddToCart}
            columns={4}
          />
        </section>

        <section className="mb-10 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-emerald-800">Domestic Sellers</h2>
              <p className="text-xs text-emerald-700">Bangladesh platforms and local marketplaces</p>
            </div>
            <span className="text-sm text-gray-500">{domesticProducts.length} items</span>
          </div>
          <ProductGrid products={domesticProducts} loading={loading} columns={4} />
        </section>

        <section className="mb-10 rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-800">International Sellers</h2>
              <p className="text-xs text-blue-700">Cross-border global marketplaces</p>
            </div>
            <span className="text-sm text-gray-500">{internationalProducts.length} items</span>
          </div>
          <ProductGrid products={internationalProducts} loading={loading} columns={4} />
        </section>

        {!loading && localProducts.length === 0 && domesticProducts.length === 0 && internationalProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-4">No products found</p>
            <p className="text-gray-400">Try searching for different keywords</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
