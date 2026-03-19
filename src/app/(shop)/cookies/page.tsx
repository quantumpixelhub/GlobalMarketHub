'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-lg opacity-90">Last updated: March 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your browser or device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Types of Cookies We Use</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Essential Cookies</h3>
                  <p className="text-gray-700">
                    These cookies are necessary for our website to function properly. They enable basic functions like page navigation and secure access to your account.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Performance Cookies</h3>
                  <p className="text-gray-700">
                    These cookies help us understand how visitors interact with our website by collecting information about the pages you visit, the time spent, and any errors you encounter.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Functional Cookies</h3>
                  <p className="text-gray-700">
                    These cookies remember your preferences and choices to provide a personalized experience, such as language preferences and login information.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Marketing Cookies</h3>
                  <p className="text-gray-700">
                    These cookies track your browsing habits to show you targeted advertisements and understand the effectiveness of our marketing campaigns.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Cookies</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>To keep you logged in to your account</li>
                <li>To remember your shopping cart contents</li>
                <li>To understand your browsing behavior and preferences</li>
                <li>To improve our website's functionality and user experience</li>
                <li>To prevent fraud and enhance security</li>
                <li>To deliver personalized content and recommendations</li>
                <li>To analyze website traffic and performance</li>
                <li>To display relevant advertisements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We may allow third-party service providers (such as analytics companies and advertising networks) to place cookies on your device. These cookies are subject to their own privacy policies.
              </p>
              <p className="text-gray-700">
                Third parties may use cookies to track your activity across multiple websites for targeted advertising purposes. You can opt out of this tracking using the provided tools.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>View what cookies are set and delete them</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies or only third-party cookies</li>
                <li>Delete cookies when you close your browser</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Please note that disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Opt-Out Options</h2>
              <p className="text-gray-700 mb-4">
                You can opt out of targeted advertising by adjusting your browser settings or visiting industry opt-out pages:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Your browser's privacy settings</li>
                <li>The Network Advertising Initiative (NAI) opt-out tool</li>
                <li>The Digital Advertising Alliance (DAA) opt-out tool</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Changes to This Cookie Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Cookie Policy from time to time. We will notify you of any significant changes by posting the updated policy on this page and updating the "Last updated" date above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about our use of cookies, please contact us at support@globalhub.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
