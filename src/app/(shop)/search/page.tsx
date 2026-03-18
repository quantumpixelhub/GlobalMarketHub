'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { addToGuestCart } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setProducts(data.results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleAddToCart = async (productId: string) => {
    try {
      const product = (products as any[]).find((p: any) => p.id === productId);
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
      const product = (products as any[]).find((p: any) => p.id === productId);
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

        <ProductGrid
          products={products}
          loading={loading}
          onAddToCart={handleAddToCart}
          columns={4}
        />

        {!loading && products.length === 0 && (
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
