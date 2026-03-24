'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg opacity-90">Last updated: March 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                GlobalMarketHub ("we" or "us" or "Company") operates the globalmmarkethub.com website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Information Collection and Use</h2>
              <p className="text-gray-700 mb-4">We collect several different types of information for various purposes:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Personal Data: Email address, first and last name, phone number, address, cookies and usage data</li>
                <li>Financial Data: Payment information, billing address, transaction history</li>
                <li>Usage Data: IP address, browser type, pages visited, time spent, referring source</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Use of Data</h2>
              <p className="text-gray-700 mb-4">GlobalMarketHub uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Security of Data</h2>
              <p className="text-gray-700 mb-4">
                The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at support@globalhub.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
