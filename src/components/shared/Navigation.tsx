"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { SearchBar } from '../product/SearchBar';
import { Logo } from './Logo';
import { getGuestCartSummary } from '@/lib/guestCart';

interface NavigationProps {
  cartItemCount?: number;
  wishlistCount?: number;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

interface ProfileSummary {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  cartItemCount,
  wishlistCount = 0,
  isAuthenticated,
  userName = '',
  onLogout,
}) => {
  const MAX_VISIBLE_CATEGORY_LINKS = 14;

  const pathname = usePathname();
  const [resolvedCartCount, setResolvedCartCount] = React.useState(cartItemCount || 0);
  const [resolvedAuth, setResolvedAuth] = React.useState(Boolean(isAuthenticated));
  const [resolvedUserName, setResolvedUserName] = React.useState(userName);
  const [resolvedWishlistCount, setResolvedWishlistCount] = React.useState(wishlistCount || 0);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);

  const resolveProfile = React.useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const user: ProfileSummary = data.user || {};
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      setResolvedUserName(fullName || user.email?.split('@')[0] || userName || 'Account');
      setProfileImage(user.profileImage || null);
    } catch {
      setProfileImage(null);
    }
  }, [userName]);

  const syncCartAndAuthState = React.useCallback(async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const signedIn = Boolean(token);
    setResolvedAuth(isAuthenticated ?? signedIn);

    if (!signedIn) {
      setResolvedUserName(userName);
      setProfileImage(null);
    }

    if (cartItemCount !== undefined) {
      setResolvedCartCount(cartItemCount);
    } else if (!token) {
      setResolvedCartCount(getGuestCartSummary().totalQuantity);
    } else {
      try {
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setResolvedCartCount(data.totalQuantity || data.itemCount || 0);
        }
      } catch {
        setResolvedCartCount(0);
      }
    }

    if (token) {
      await resolveProfile(token);
    }
  }, [cartItemCount, isAuthenticated, resolveProfile, userName]);

  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout();
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      setResolvedAuth(false);
      setProfileImage(null);
      setResolvedUserName('');
      window.dispatchEvent(new Event('cart-updated'));
      window.location.href = '/';
    }
  }, [onLogout]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchWishlistCount = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setResolvedWishlistCount(0);
      return;
    }

    try {
      const res = await fetch('/api/users/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResolvedWishlistCount(data.count || 0);
      }
    } catch {
      setResolvedWishlistCount(0);
    }
  }, []);

  React.useEffect(() => {
    syncCartAndAuthState();
    fetchCategories();
    fetchWishlistCount();

    const onStorage = () => syncCartAndAuthState();
    const onCartUpdated = () => syncCartAndAuthState();
    const onWishlistUpdated = () => fetchWishlistCount();

    window.addEventListener('storage', onStorage);
    window.addEventListener('cart-updated', onCartUpdated);
    window.addEventListener('wishlist-updated', onWishlistUpdated);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart-updated', onCartUpdated);
      window.removeEventListener('wishlist-updated', onWishlistUpdated);
    };
  }, [pathname, syncCartAndAuthState, fetchCategories, fetchWishlistCount]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="hidden md:block bg-emerald-700 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>🚚 Free shipping on orders over ৳2,500</span>
          <span>✉️ Contact: support@globalhub.com</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 md:gap-6 mb-3 md:mb-4">
          {/* Logo */}
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <Logo size="lg" className="origin-left scale-[1.12] md:scale-[1.2]" />
          </div>

          {/* Search Bar */}
          <div className="flex-1">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 md:gap-7 self-end lg:self-auto flex-shrink-0">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative hover:text-emerald-600 transition-colors group"
              title="Wishlist"
            >
              <Heart size={22} />
              {resolvedWishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {resolvedWishlistCount}
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
              <ShoppingCart size={22} />
              {resolvedCartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {resolvedCartCount}
                </span>
              )}
              <span className="absolute left-0 -bottom-8 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">
                Cart
              </span>
            </Link>

            {/* Auth */}
            {resolvedAuth ? (
              <div className="flex items-center gap-3 pl-3 border-l">
                <Link
                  href="/account"
                  className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
                  title="My Account"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <User size={22} />
                  )}
                  <span className="hidden sm:inline text-sm">{resolvedUserName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={22} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 md:gap-4 pl-3 border-l">
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

        {/* Category Links with Subcategories */}
        <div className="flex gap-2 md:gap-3 flex-wrap pb-2 mt-5 md:mt-6 scrollbar-hide border-b-2 border-blue-600">
          {categories
            .filter((cat) => !cat.parentId) // Only main categories
            .slice(0, MAX_VISIBLE_CATEGORY_LINKS)
            .map((category) => {
              const subcategories = categories.filter((cat) => cat.parentId === category.id);
              const hasSubcategories = subcategories.length > 0;

              return (
                <div key={category.id} className="relative group flex-shrink-0">
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-xs whitespace-nowrap hover:text-emerald-600 transition-colors py-3 px-1.5 border-b-2 border-transparent hover:border-blue-600"
                  >
                    {category.name}
                  </Link>

                  {/* Subcategories Dropdown */}
                  {hasSubcategories && (
                    <div className="absolute left-0 top-full bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 w-max">
                      {subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/products?category=${sub.slug}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors first:rounded-t last:rounded-b whitespace-nowrap"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          <Link
            href="/products"
            className="text-xs whitespace-nowrap font-semibold py-2 px-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors ml-auto"
          >
            See All →
          </Link>
        </div>
      </div>
    </nav>
  );
};
