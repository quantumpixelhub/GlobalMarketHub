'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { Lock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Security</h1>
            <p className="text-lg opacity-90">Your safety and privacy are our top priority</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Security Overview */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Shield className="text-blue-600" size={32} />
              <h2 className="text-2xl font-bold">Our Security Measures</h2>
            </div>
            <p className="text-gray-700 mb-4">
              GlobalMarketHub uses industry-leading security technologies and practices to protect your data and ensure safe transactions.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="text-blue-600" size={24} />
                <h3 className="font-bold text-lg">SSL Encryption</h3>
              </div>
              <p className="text-gray-700">
                All data transmitted between your browser and our servers is encrypted using SSL/TLS technology, protecting sensitive information.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-blue-600" size={24} />
                <h3 className="font-bold text-lg">PCI Compliance</h3>
              </div>
              <p className="text-gray-700">
                We comply with PCI DSS standards for secure payment processing, ensuring your payment information is always protected.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-blue-600" size={24} />
                <h3 className="font-bold text-lg">Data Protection</h3>
              </div>
              <p className="text-gray-700">
                Your personal information is stored in secure databases with restricted access, and we never sell your data to third parties.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-blue-600" size={24} />
                <h3 className="font-bold text-lg">Fraud Protection</h3>
              </div>
              <p className="text-gray-700">
                We employ advanced fraud detection systems to monitor suspicious activities and protect both buyers and sellers.
              </p>
            </div>
          </div>

          {/* Password Security */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Password Security Tips</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex gap-4">
                <span className="font-bold text-blue-600">1.</span>
                <p>Use a strong password with a mix of uppercase, lowercase, numbers, and special characters</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600">2.</span>
                <p>Never share your password with anyone, including GlobalMarketHub staff</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600">3.</span>
                <p>Change your password regularly and don't reuse old passwords</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600">4.</span>
                <p>Use two-factor authentication when available for additional security</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600">5.</span>
                <p>Always log out when using shared devices</p>
              </div>
            </div>
          </div>

          {/* Safe Shopping */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Safe Shopping Guidelines</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold mb-2">✓ Before You Shop</h3>
                <p>Check that our website URL starts with "https://" and look for the padlock icon in your browser address bar.</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">✓ During Checkout</h3>
                <p>Verify seller ratings and reviews. Use official payment methods and never share payment details via email or chat.</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">✓ After Purchase</h3>
                <p>Keep order confirmations and track your package. Report any suspicious activity immediately to our support team.</p>
              </div>
            </div>
          </div>

          {/* Reporting Issues */}
          <div className="bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Report Security Issues</h2>
            <p className="text-gray-700 mb-4">
              If you discover a security vulnerability or have concerns about your account, please contact us immediately.
            </p>
            <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
              Contact Security Team
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
