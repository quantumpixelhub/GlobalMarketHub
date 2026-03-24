'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the Register button in the top right corner, fill in your details, and verify your email. You\'ll be able to start shopping immediately.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, debit cards, mobile banking, and other digital payment methods. All payments are processed securely.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-7 business days. Express shipping is available for urgent orders and typically arrives within 1-2 business days.'
    },
    {
      question: 'Can I return items?',
      answer: 'Yes, we have a 30-day return policy for most items. Products must be unused and in original packaging. Some items may have different return policies.'
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can use this to track your package in real-time.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard security measures including SSL encryption to protect your personal and financial information.'
    },
    {
      question: 'Can I modify my order after placing it?',
      answer: 'If your order hasn\'t shipped yet, you can modify or cancel it from your account dashboard. Once shipped, you\'ll need to contact customer service.'
    },
    {
      question: 'How do I become a seller?',
      answer: 'Visit our Sellers page and fill out the seller registration form. Our team will review your application and get back to you within 3-5 business days.'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg opacity-90">Find answers to common questions</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 text-left">{faq.question}</h3>
                  <ChevronDown
                    size={24}
                    className={`flex-shrink-0 text-blue-600 transition ${
                      openItems.includes(index) ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 pb-6 border-t">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Didn't find your answer?</h2>
            <p className="text-gray-700 mb-6">
              Our customer support team is ready to help. Get in touch with us for any other questions.
            </p>
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
