'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryFilter } from '@/components/product/CategoryFilter';
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
  isFeatured: boolean;
  category: { id: string; slug: string; name: string };
  seller: { id: string; storeName: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductsContentProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

function ProductsContentInner({ initialProducts, initialCategories }: ProductsContentProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';

  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState('createdAt');
  const { showToast } = useToast();

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        if (response.ok) {
          showToast('Product added to cart!', 'success');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        const product = products.find((p) => p.id === productId);
        if (product) {
          addToGuestCart({
            id: product.id,
            title: product.title,
            mainImage: product.mainImage,
            currentPrice: product.currentPrice,
          });
        }
        showToast('Network issue. Added to guest cart instead.', 'info');
      }
    } else {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: product.currentPrice,
        });
      }
      showToast('Network issue. Added to guest cart instead.', 'info');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category?.slug !== selectedCategory) return false;
    if (p.currentPrice < minPrice || p.currentPrice > maxPrice) return false;
    return true;
  });

  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.currentPrice - b.currentPrice;
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      case 'createdAt':
      default:
        return 0; // Keep original order (newest first from API)
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filters */}
      <aside className="lg:col-span-1">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => {
            setMinPrice(min);
            setMaxPrice(max);
          }}
        />
      </aside>

      {/* Products Area */}
      <main className="lg:col-span-3">
        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">{sortedAndFilteredProducts.length} products found</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="createdAt">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={sortedAndFilteredProducts}
          loading={false}
          onAddToCart={handleAddToCart}
          columns={3}
        />
      </main>
    </div>
  );
}

export function ProductsContent({ initialProducts, initialCategories }: ProductsContentProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContentInner initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
