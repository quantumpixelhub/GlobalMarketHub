'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CartSummary } from '@/components/cart/CartSummary';
import { ArrowLeft } from 'lucide-react';
import {
  getGuestCartSummary,
  removeFromGuestCart,
  updateGuestCartItemQuantity,
} from '@/lib/guestCart';

interface CartData {
  cartId: string;
  items: any[];
  subtotal: number;
  itemCount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setIsGuestCheckout(true);
          setCart(getGuestCartSummary());
          return;
        }

        setIsGuestCheckout(false);

        const res = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setCart(data);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart(removeFromGuestCart(cartItemId));
        return;
      }

      await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      window.dispatchEvent(new Event('cart-updated'));
      // Refetch cart
      if (cart) {
        setCart({
          ...cart,
          items: cart.items.filter(item => item.id !== cartItemId),
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart(updateGuestCartItemQuantity(cartItemId, quantity));
        return;
      }

      await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      window.dispatchEvent(new Event('cart-updated'));
      // Update local state
      if (cart) {
        setCart({
          ...cart,
          items: cart.items.map(item =>
            item.id === cartItemId ? { ...item, quantity } : item
          ),
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation cartItemCount={cart?.itemCount} />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col">
        <Link href="/products" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6">
          <ArrowLeft size={20} />
          <span>Continue Shopping</span>
        </Link>

        {isGuestCheckout && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-rose-900">You are shopping as a guest</p>
            <p className="text-sm text-rose-800 mt-1">
              You can checkout and pay now. Registering an account lets you save addresses, track orders, and reorder faster.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Main product details */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white rounded-lg p-4 min-h-[200px]">
              {!cart?.items.length ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link href="/products" className="text-rose-600 hover:underline">
                    Continue shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center border-b last:border-b-0 pb-4 last:pb-0">
                      {/* Product image */}
                      {item.product?.mainImage && (
                        <img src={item.product.mainImage} alt={item.product.title} className="w-20 h-20 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{item.product?.title}</p>
                        <p className="text-gray-500 text-sm">{item.product?.description}</p>
                        <p className="text-rose-600 font-bold mt-1">৳{item.product?.currentPrice?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 hover:bg-gray-100 rounded">-</button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">+</button>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Similar Products Section */}
            <div className="bg-white rounded-lg p-4 mt-4">
              <h2 className="text-xl font-bold mb-3">Similar Products</h2>
              <div className="text-gray-400 italic">(Similar products will be shown here.)</div>
            </div>
          </div>
          {/* Cart Summary */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <CartSummary
              items={cart?.items || []}
              subtotal={cart?.subtotal || 0}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onCheckout={() => {
                window.location.href = '/checkout';
              }}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
