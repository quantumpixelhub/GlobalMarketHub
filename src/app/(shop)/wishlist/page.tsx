'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Heart, Trash2 } from 'lucide-react';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    title: string;
    currentPrice: number;
    originalPrice: number;
    mainImage: string;
    rating: number;
    reviewCount: number;
    stock: number;
    seller: {
      storeName: string;
    };
  };
  addedAt: string;
  priceSnapshot: number;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/users/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setWishlistItems(data.wishlist || []);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemove = async (wishlistItemId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/users/wishlist?productId=${wishlistItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setWishlistItems(items => items.filter(item => item.id !== wishlistItemId));
        alert('Removed from wishlist');
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
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full text-center">
          <p className="text-xl mb-4">Please login to view your wishlist</p>
          <a href="/login" className="text-emerald-600 hover:underline">
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
              className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
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
                            className="font-semibold hover:text-emerald-600"
                          >
                            {item.product.title}
                          </a>
                          <p className="text-sm text-gray-600">
                            by {item.product.seller.storeName}
                          </p>
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
                      <span className={item.product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.product.stock > 0 ? `${item.product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          disabled={item.product.stock === 0}
                          className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemove(item.product.id)}
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
