'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { Globe, Users, Zap, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">About GlobalMarketHub</h1>
            <p className="text-lg opacity-90">Connecting sellers and buyers worldwide</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Mission Section */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              GlobalMarketHub is dedicated to creating a seamless marketplace where sellers can reach customers globally and buyers can discover quality products with ease. We believe in transparency, fairness, and innovation in every transaction.
            </p>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Globe size={40} className="mx-auto text-rose-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Global Reach</h3>
              <p className="text-gray-600">Connect with millions of customers worldwide</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Users size={40} className="mx-auto text-rose-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Community First</h3>
              <p className="text-gray-600">Building a trusted community of sellers and buyers</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Zap size={40} className="mx-auto text-rose-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600">Leveraging technology for better experiences</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Award size={40} className="mx-auto text-rose-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Quality</h3>
              <p className="text-gray-600">Ensuring high standards in all operations</p>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2024, GlobalMarketHub has grown to become a leading e-commerce platform connecting sellers and buyers across multiple categories. Our platform is designed with user experience at its core, making buying and selling simple, secure, and enjoyable.
            </p>
            <p className="text-gray-700 mb-4">
              With a diverse range of products from agriculture to electronics, we serve customers looking for quality, variety, and competitive prices. Our commitment to seller success and buyer satisfaction drives everything we do.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-rose-600 text-white rounded-lg p-8 text-center">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <p className="text-lg">Products Available</p>
            </div>
            <div className="bg-rose-600 text-white rounded-lg p-8 text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <p className="text-lg">Active Sellers</p>
            </div>
            <div className="bg-rose-600 text-white rounded-lg p-8 text-center">
              <div className="text-4xl font-bold mb-2">100K+</div>
              <p className="text-lg">Happy Customers</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
