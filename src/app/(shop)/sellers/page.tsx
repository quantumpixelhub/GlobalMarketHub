'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { TrendingUp, Users, DollarSign, Globe } from 'lucide-react';

export default function SellersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Become a Seller</h1>
            <p className="text-lg opacity-90 mb-8">Start your business on GlobalMarketHub and reach millions of customers</p>
            <a href="/seller-signup" className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
              Apply Now
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Sell on GlobalMarketHub?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Globe size={48} className="mx-auto text-emerald-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Global Reach</h3>
                <p className="text-gray-600">Access millions of customers across Bangladesh and beyond</p>
              </div>
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <TrendingUp size={48} className="mx-auto text-emerald-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Grow Your Business</h3>
                <p className="text-gray-600">Tools and analytics to help you scale your sales</p>
              </div>
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DollarSign size={48} className="mx-auto text-emerald-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Competitive Fees</h3>
                <p className="text-gray-600">Low commission rates with transparent pricing</p>
              </div>
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Users size={48} className="mx-auto text-emerald-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Support</h3>
                <p className="text-gray-600">Dedicated support team to help you succeed</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow p-8 mb-16">
            <h2 className="text-3xl font-bold mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-bold mb-2">Register</h3>
                <p className="text-sm text-gray-600">Create your seller account and verify your details</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-bold mb-2">Setup Store</h3>
                <p className="text-sm text-gray-600">Customize your store and add payment methods</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-bold mb-2">List Products</h3>
                <p className="text-sm text-gray-600">Add your products with photos and descriptions</p>
              </div>
              <div className="text-center">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-bold mb-2">Start Selling</h3>
                <p className="text-sm text-gray-600">Manage orders and grow your business</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow p-8 mb-16">
            <h2 className="text-3xl font-bold mb-8">Seller Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Basic Requirements</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>✓ Valid business registration</li>
                  <li>✓ Bank account for payments</li>
                  <li>✓ Valid contact information</li>
                  <li>✓ Quality product photos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Seller Standards</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>✓ Maintain product quality</li>
                  <li>✓ Respond to inquiries promptly</li>
                  <li>✓ Process orders on time</li>
                  <li>✓ Maintain positive ratings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-emerald-50 rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
            <p className="text-gray-700 mb-8 text-lg">
              Join thousands of successful sellers on GlobalMarketHub. Apply now and start reaching customers today.
            </p>
            <a href="/seller-signup" className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
              Apply as a Seller
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
