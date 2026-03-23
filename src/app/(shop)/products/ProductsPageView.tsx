'use client';

import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductsContent } from './ProductsContent';

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
  parentId?: string | null;
}

interface ProductsPageViewProps {
  initialCategorySlug?: string;
}

export function ProductsPageView({ initialCategorySlug = '' }: ProductsPageViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        if (productsRes.ok) {
          const productData = await productsRes.json();
          setProducts(Array.isArray(productData) ? productData : productData.products || []);
        }

        if (categoriesRes.ok) {
          const categoryData = await categoriesRes.json();
          setCategories(categoryData.categories || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">All Products</h1>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-lg text-gray-600">Loading products...</div>
          </div>
        ) : (
          <ProductsContent
            initialProducts={products}
            initialCategories={categories}
            initialCategorySlug={initialCategorySlug}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
