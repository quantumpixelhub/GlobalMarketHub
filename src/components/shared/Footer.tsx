import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Globe2 } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaGooglePay } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="rounded-full bg-emerald-600/20 p-2 ring-1 ring-emerald-400/40">
                  <Globe2 size={22} className="text-emerald-300" />
                </span>
                <span className="text-3xl font-extrabold tracking-tight leading-none">
                  <span className="text-white">GlobalMarket</span>
                  <span className="text-amber-300">Hub</span>
                </span>
              </Link>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your one-stop marketplace for products from Bangladesh's top retailers.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>support@globalhub.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="hover:text-white transition-colors">
                  Sellers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold mb-4">Policies</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-700 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-3">Subscribe to Newsletter</h4>
              <p className="text-sm text-gray-400 mb-3">Get updates on products and special offers</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded text-black"
                />
                <button className="bg-emerald-600 px-6 py-2 rounded hover:bg-emerald-700">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h4 className="font-bold">Follow Us</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors" aria-label="Follow us on Facebook">
                  <Facebook size={24} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors" aria-label="Follow us on Twitter">
                  <Twitter size={24} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors" aria-label="Follow us on Instagram">
                  <Instagram size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>&copy; 2026 GlobalMarketHub. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              <span className="text-xs text-gray-300 mr-1">Payment methods:</span>
              <span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-slate-900" aria-label="Visa">
                <FaCcVisa size={24} />
              </span>
              <span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-slate-900" aria-label="Mastercard">
                <FaCcMastercard size={24} />
              </span>
              <span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-slate-900" aria-label="PayPal">
                <FaCcPaypal size={24} />
              </span>
              <span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-slate-900" aria-label="Google Pay">
                <FaGooglePay size={24} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
