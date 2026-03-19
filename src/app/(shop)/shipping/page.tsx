'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { Truck, Clock, MapPin } from 'lucide-react';

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
            <p className="text-lg opacity-90">Fast and reliable delivery to your doorstep</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Shipping Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-4 mb-4">
                <Truck className="text-emerald-600" size={32} />
                <h2 className="text-2xl font-bold">Standard Shipping</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Our standard shipping option is available for all orders within Bangladesh.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Delivery time: 3-7 business days</li>
                <li>✓ Free for orders over ৳2,500</li>
                <li>✓ ৳100 for orders below ৳2,500</li>
                <li>✓ Track your order in real-time</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="text-emerald-600" size={32} />
                <h2 className="text-2xl font-bold">Express Shipping</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Fast shipping for customers who need their items quickly.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Delivery time: 1-2 business days</li>
                <li>✓ Available for Dhaka and nearby areas</li>
                <li>✓ ৳300 for all orders</li>
                <li>✓ Priority handling and delivery</li>
              </ul>
            </div>
          </div>

          {/* Shipping Process */}
          <div className="bg-white rounded-lg shadow p-8 mb-12">
            <h2 className="text-2xl font-bold mb-8">Shipping Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-bold mb-2">Order Placed</h3>
                <p className="text-sm text-gray-600">Your order is confirmed and processing begins</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-bold mb-2">Packed & Labeled</h3>
                <p className="text-sm text-gray-600">Items are carefully packed and labeled</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-bold mb-2">Picked Up</h3>
                <p className="text-sm text-gray-600">Courier collects your package</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-bold mb-2">Delivered</h3>
                <p className="text-sm text-gray-600">Package reaches your destination</p>
              </div>
            </div>
          </div>

          {/* Coverage Areas */}
          <div className="bg-white rounded-lg shadow p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Coverage Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3">Standard Shipping (All Bangladesh)</h3>
                <p className="text-gray-700">We deliver to all districts across Bangladesh including remote areas.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3">Express Shipping</h3>
                <p className="text-gray-700">
                  Available in Dhaka, Chittagong, Sylhet, and other major cities. Check availability at checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-emerald-50 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-4">
              <MapPin className="text-emerald-600" size={32} />
              <h2 className="text-2xl font-bold">Track Your Order</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Once your order ships, you'll receive a tracking number via email. You can use this number to track your package in real-time on our platform.
            </p>
            <a href="/products" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
