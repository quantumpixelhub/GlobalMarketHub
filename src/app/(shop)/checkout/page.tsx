'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CheckoutForm } from '@/components/cart/CheckoutForm';

interface UserAddress {
  id: string;
  label: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  isDefault: boolean;
}

interface CartSummary {
  cartId: string;
  subtotal: number;
  itemCount: number;
  items: any[];
  totalQuantity: number;
}

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login to proceed with checkout');
          window.location.href = '/login';
          return;
        }

        // Fetch user profile
        const profileRes = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        setAddresses(profileData.user?.addresses || []);

        // Fetch cart
        const cartRes = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const cartData = await cartRes.json();
        setCart(cartData);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartId: cart?.cartId,
          shippingAddressId: data.addressId,
        }),
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        alert('Order created! Proceed to payment.');
        
        // Initiate payment
        const paymentRes = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderData.order.id,
            paymentMethod: data.paymentMethod,
          }),
        });

        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          // Redirect to payment gateway
          window.location.href = paymentData.paymentUrl;
        }
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error processing order');
    } finally {
      setSubmitting(false);
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
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              addresses={addresses}
              loading={submitting}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>৳{(cart?.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%):</span>
                <span>৳{(((cart?.subtotal || 0) * 0.05)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>৳100</span>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-emerald-600">
                ৳{((cart?.subtotal || 0) + ((cart?.subtotal || 0) * 0.05) + 100).toLocaleString()}
              </span>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Items in cart: {cart?.totalQuantity}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
