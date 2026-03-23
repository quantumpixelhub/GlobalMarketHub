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

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <Link href="/products" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft size={20} />
          <span>Continue Shopping</span>
        </Link>

        {isGuestCheckout && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold text-blue-900">You are shopping as a guest</p>
            <p className="text-sm text-blue-800 mt-1">
              You can checkout and pay now. Registering an account lets you save addresses, track orders, and reorder faster.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {!cart?.items.length ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link href="/products" className="text-emerald-600 hover:underline">
                  Continue shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 flex gap-4">
                    {/* Item details would go here */}
                    <p className="font-semibold">{item.product?.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div>
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
