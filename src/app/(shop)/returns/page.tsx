'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsRefundsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
            <p className="text-lg opacity-90">We want you to be satisfied with your purchase</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Return Policy */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <RotateCcw className="text-blue-600" size={32} />
              <h2 className="text-2xl font-bold">Return Policy</h2>
            </div>
            <p className="text-gray-700 mb-4">
              GlobalMarketHub offers a hassle-free return policy to ensure customer satisfaction.
            </p>
            <ul className="space-y-3 text-gray-700 ml-6">
              <li>✓ 30-day return period from the date of purchase</li>
              <li>✓ Items must be unused and in original packaging</li>
              <li>✓ Return shipping may be prepaid or postpaid depending on the reason</li>
              <li>✓ Refunds are processed within 5-7 business days after return approval</li>
              <li>✓ All return labels and instructions are provided via email</li>
            </ul>
          </div>

          {/* Eligible and Non-Eligible */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold">Eligible for Return</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li>• Items in original condition</li>
                <li>• Products within return window</li>
                <li>• Items with intact packaging</li>
                <li>• Products with no signs of use</li>
                <li>• All tags and seals attached</li>
                <li>• Defective or damaged items</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-600" size={24} />
                <h3 className="text-xl font-bold">Not Eligible for Return</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li>• Items used or showed signs of wear</li>
                <li>• Products past 30-day window</li>
                <li>• Items without original packaging</li>
                <li>• Custom or personalized products</li>
                <li>• Perishable items</li>
                <li>• Items purchased on final sale</li>
              </ul>
            </div>
          </div>

          {/* How to Return */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-8">How to Return an Item</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="font-bold text-lg mb-2">1. Initiate Return</h3>
                <p className="text-gray-700">Log in to your account, go to My Orders, and click "Return Item" on the product you want to return.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="font-bold text-lg mb-2">2. Select Reason</h3>
                <p className="text-gray-700">Choose the reason for your return from the available options (e.g., defective, wrong size, changed mind).</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="font-bold text-lg mb-2">3. Get Return Label</h3>
                <p className="text-gray-700">We'll email you a return shipping label. Print it and attach it to your package.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="font-bold text-lg mb-2">4. Ship Package</h3>
                <p className="text-gray-700">Drop off your package at the nearest courier center with the return label.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="font-bold text-lg mb-2">5. Receive Refund</h3>
                <p className="text-gray-700">Once we receive and inspect your return, we'll process your refund within 5-7 business days.</p>
              </div>
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Refund Information</h2>
            <p className="text-gray-700 mb-4">
              Refunds will be credited to the original payment method used for the purchase. Here's what you need to know:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Processing Time:</strong> Refunds are processed within 5-7 business days after we receive and inspect your return.
              </li>
              <li>
                <strong>Shipping Costs:</strong> Original shipping charges are non-refundable. Return shipping may be prepaid or postpaid.
              </li>
              <li>
                <strong>Full Refund:</strong> You'll receive a full refund of the product price minus any applicable deductions.
              </li>
              <li>
                <strong>Bank Processing:</strong> Your bank may take additional 2-3 business days to process the refund.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
