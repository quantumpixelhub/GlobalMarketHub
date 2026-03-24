'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { Heart, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    currentPrice: number;
    originalPrice: number;
    mainImage: string;
    rating: number;
    stock: number;
  };
  createdAt: string;
  priceWhenAdded: number;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;

        const res = await fetch('/api/users/wishlist', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setWishlistItems(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();

    // Listen for wishlist updates and refresh
    const handleWishlistUpdate = () => {
      setLoading(true);
      fetchWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, []);

  const handleRemove = async (wishlistItemId: string, productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/users/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setWishlistItems(items => items.filter(item => item.id !== wishlistItemId));
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (product: any) => {
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
          productId: product.id,
          quantity: 1,
          priceSnapshot: product.currentPrice,
        }),
      });

      if (res.ok) {
        alert('Added to cart!');
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full text-center">
          <p className="text-xl mb-4">Please login to view your wishlist</p>
          <a href="/login" className="text-rose-600 hover:underline">
            Go to login page
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Loading wishlist...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation wishlistCount={wishlistItems.length} />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-600 mb-4">Your wishlist is empty</p>
            <a
              href="/products"
              className="inline-block bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4">Product</th>
                  <th className="text-left px-6 py-4">Price</th>
                  <th className="text-left px-6 py-4">Stock</th>
                  <th className="text-left px-6 py-4">Added Date</th>
                  <th className="text-left px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {wishlistItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <img
                          src={item.product.mainImage}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <a
                            href={`/product/${item.product.id}`}
                            className="font-semibold hover:text-rose-600"
                          >
                            {item.product.title}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        ৳{item.product.currentPrice.toLocaleString()}
                      </div>
                      {item.product.originalPrice > item.product.currentPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ৳{item.product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={item.product.stock > 0 ? 'text-rose-600' : 'text-red-600'}>
                        {item.product.stock > 0 ? `${item.product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          disabled={item.product.stock === 0}
                          className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:bg-gray-400"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemove(item.id, item.productId)}
                          className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
