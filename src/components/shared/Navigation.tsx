import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { SearchBar } from '../product/SearchBar';
import { Logo } from './Logo';

interface NavigationProps {
  cartItemCount?: number;
  wishlistCount?: number;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  cartItemCount = 0,
  wishlistCount = 0,
  isAuthenticated = false,
  userName = '',
  onLogout,
}) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-emerald-700 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>🚚 Free shipping on orders over ৳2,500</span>
          <span>✉️ Contact: support@globalhub.com</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6 mb-4">
          {/* Logo */}
          <Logo variant="full" size="md" />

          {/* Search Bar */}
          <SearchBar />

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative hover:text-emerald-600 transition-colors group"
              title="Wishlist"
            >
              <Heart size={24} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
              <span className="absolute left-0 -bottom-8 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">
                Wishlist
              </span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative hover:text-emerald-600 transition-colors group"
              title="Shopping Cart"
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
              <span className="absolute left-0 -bottom-8 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">
                Cart
              </span>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4 pl-4 border-l">
                <Link
                  href="/account"
                  className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
                  title="My Account"
                >
                  <User size={24} />
                  <span className="hidden sm:inline text-sm">{userName}</span>
                </Link>
                <button
                  onClick={onLogout}
                  className="hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-4 border-l">
                <Link
                  href="/login"
                  className="text-sm hover:text-emerald-600 transition-colors"
                >
                  Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/register"
                  className="text-sm hover:text-emerald-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Category Links */}
        <div className="flex gap-6 overflow-x-auto pb-2">
          <Link href="/category/electronics" className="text-sm whitespace-nowrap hover:text-emerald-600">
            📱 Electronics
          </Link>
          <Link href="/category/clothing" className="text-sm whitespace-nowrap hover:text-emerald-600">
            👕 Clothing
          </Link>
          <Link href="/category/home-kitchen" className="text-sm whitespace-nowrap hover:text-emerald-600">
            🏠 Home & Kitchen
          </Link>
          <Link href="/category/sports-outdoors" className="text-sm whitespace-nowrap hover:text-emerald-600">
            ⚽ Sports
          </Link>
          <Link href="/category/books-media" className="text-sm whitespace-nowrap hover:text-emerald-600">
            📚 Books
          </Link>
          <Link href="/category/health-beauty" className="text-sm whitespace-nowrap hover:text-emerald-600">
            💄 Health & Beauty
          </Link>
        </div>
      </div>
    </nav>
  );
};
