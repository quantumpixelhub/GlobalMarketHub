'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import Link from 'next/link';
import { Zap, Shield, Truck, HeadphonesIcon } from 'lucide-react';

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

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=8');
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

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to add items to cart');
      window.location.href = '/login';
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
        alert('Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">🌍 Welcome to GlobalMarketHub</h1>
          <p className="text-xl mb-8">Your one-stop shop for global products and best deals</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Shop Now
            </Link>
            <button
              onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700"
            >
              Featured Products
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <HeadphonesIcon className="mx-auto mb-4 text-emerald-600" size={32} />
              <h3 className="font-bold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Our team is always ready to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-12 w-full" id="featured">
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
