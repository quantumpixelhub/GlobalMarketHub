'use client';

import React from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const blogs = [
    {
      id: 1,
      title: '10 Tips for Smart Online Shopping',
      excerpt: 'Learn how to shop online safely and save money with these expert tips.',
      date: 'March 15, 2026',
      author: 'Sarah Khan',
      image: '🛍️',
      category: 'Shopping Tips'
    },
    {
      id: 2,
      title: 'How to Start Your E-commerce Business',
      excerpt: 'A comprehensive guide for entrepreneurs looking to launch their online store.',
      date: 'March 10, 2026',
      author: 'Ahmed Hassan',
      image: '💼',
      category: 'Seller Guide'
    },
    {
      id: 3,
      title: 'Understanding Product Reviews and Ratings',
      excerpt: 'Why customer reviews matter and how to make the most of them.',
      date: 'March 5, 2026',
      author: 'Fatima Ali',
      image: '⭐',
      category: 'Consumer Guide'
    },
    {
      id: 4,
      title: 'Trending Products This Season',
      excerpt: 'Discover the hottest products that customers are buying this month.',
      date: 'February 28, 2026',
      author: 'Karim Sheikh',
      image: '🔥',
      category: 'Trends'
    },
    {
      id: 5,
      title: 'Secure Payment Methods Online',
      excerpt: 'Learn about different payment options and how to shop securely.',
      date: 'February 20, 2026',
      author: 'Nadia Islam',
      image: '🔒',
      category: 'Security'
    },
    {
      id: 6,
      title: 'Customer Success Stories',
      excerpt: 'Real stories from buyers and sellers who found success on GlobalMarketHub.',
      date: 'February 15, 2026',
      author: 'Rajib Das',
      image: '🌟',
      category: 'Success Stories'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">GlobalMarketHub Blog</h1>
            <p className="text-lg opacity-90">Tips, trends, and insights for smarter shopping and selling</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                {/* Image */}
                <div className="bg-gradient-to-r from-rose-100 to-rose-50 h-48 flex items-center justify-center text-6xl">
                  {blog.image}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      {blog.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:text-rose-600">
                    {blog.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {blog.excerpt}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{blog.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>By {blog.author}</span>
                    </div>
                  </div>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition"
                  >
                    Read More
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Previous</button>
            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">2</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">3</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Next</button>
          </div>

          {/* Newsletter Section */}
          <div className="mt-16 bg-rose-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Subscribe to Our Blog</h2>
            <p className="text-gray-700 mb-6">Get the latest tips and insights delivered to your inbox</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
              <button
                type="submit"
                className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
