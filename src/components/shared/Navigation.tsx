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
  showCategoryLinks?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
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
  showCategoryLinks = true,
}) => {
  const pathname = usePathname();
  const [resolvedCartCount, setResolvedCartCount] = React.useState(cartItemCount || 0);
  const [resolvedAuth, setResolvedAuth] = React.useState(Boolean(isAuthenticated));
  const [resolvedUserName, setResolvedUserName] = React.useState(userName);
  const [resolvedWishlistCount, setResolvedWishlistCount] = React.useState(wishlistCount || 0);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [visibleCategoryCount, setVisibleCategoryCount] = React.useState(0);
  const [linksContainerWidth, setLinksContainerWidth] = React.useState(0);
  const [showCategoryStripOnScroll, setShowCategoryStripOnScroll] = React.useState(true);
  const linksContainerRef = React.useRef<HTMLDivElement>(null);
  const measurementWrapRef = React.useRef<HTMLDivElement>(null);
  const lastScrollYRef = React.useRef(0);

  const mainCategories = React.useMemo(
    () => categories.filter((cat) => !cat.parentId),
    [categories],
  );

  const categoryTree = React.useMemo(() => {
    return mainCategories
      .map((parent) => ({
        ...parent,
        children: categories
          .filter((cat) => cat.parentId === parent.id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, mainCategories]);

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

  React.useEffect(() => {
    const linksContainer = linksContainerRef.current;
    if (!linksContainer) return;

    const updateWidth = () => {
      setLinksContainerWidth(linksContainer.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(linksContainer);

    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const measureWrap = measurementWrapRef.current;

    if (!measureWrap || mainCategories.length === 0) {
      setVisibleCategoryCount(0);
      return;
    }

    const items = Array.from(
      measureWrap.querySelectorAll<HTMLElement>('[data-measure-category="true"]'),
    );

    if (items.length === 0) {
      setVisibleCategoryCount(0);
      return;
    }

    const tops = items.map((item) => item.offsetTop);
    const uniqueRowTops = Array.from(new Set(tops)).sort((a, b) => a - b);

    if (uniqueRowTops.length <= 2) {
      setVisibleCategoryCount(items.length);
      return;
    }

    const secondRowTop = uniqueRowTops[1];
    const fittedCount = tops.filter((top) => top <= secondRowTop).length;
    setVisibleCategoryCount(Math.max(1, fittedCount));
  }, [mainCategories, linksContainerWidth]);

  React.useEffect(() => {
    if (!showCategoryLinks || typeof window === 'undefined') return;

    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      // Keep links visible near top for discoverability.
      if (currentY < 120) {
        setShowCategoryStripOnScroll(true);
      } else if (delta > 4) {
        setShowCategoryStripOnScroll(false);
      } else if (delta < -4) {
        setShowCategoryStripOnScroll(true);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [showCategoryLinks]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="hidden md:block bg-orange-500 text-white text-sm py-2">
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
        {showCategoryLinks && (
        <div
          className={`mt-5 md:mt-6 transition-all duration-300 ${
            showCategoryStripOnScroll
              ? 'max-h-[420px] overflow-visible opacity-100 translate-y-0 pb-2 border-b-2 border-blue-600'
              : 'max-h-0 overflow-hidden opacity-0 -translate-y-1 pb-0 border-b-0'
          }`}
        >
          <div className="flex items-end gap-2 md:gap-3">
            <div ref={linksContainerRef} className="relative flex-1 min-w-0">
              <div className="flex gap-2 md:gap-3 flex-wrap scrollbar-hide">
                {mainCategories
                  .slice(0, visibleCategoryCount || mainCategories.length)
                  .map((category) => {
                    const subcategories = categories.filter((cat) => cat.parentId === category.id);
                    const hasSubcategories = subcategories.length > 0;

                    return (
                      <div key={category.id} className="relative group flex-shrink-0">
                        <Link
                          href={`/products/${category.slug}`}
                          className="flex items-center gap-1.5 text-xs whitespace-nowrap hover:text-emerald-600 transition-colors py-3 px-1.5 border-b-2 border-transparent hover:border-blue-600"
                        >
                          <span className="text-[13px] leading-none opacity-85">{category.icon || '📦'}</span>
                          {category.name}
                        </Link>

                        {/* Subcategories Dropdown */}
                        {hasSubcategories && (
                          <div className="absolute left-0 top-full bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 w-max">
                            {subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products/${category.slug}/${sub.slug}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors first:rounded-t last:rounded-b whitespace-nowrap"
                              >
                                <span className="opacity-85 leading-none">{sub.icon || '📦'}</span>
                                {sub.image && (
                                  <img
                                    src={sub.image}
                                    alt=""
                                    aria-hidden="true"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    className="w-4 h-4 rounded object-cover"
                                  />
                                )}
                                <span>{sub.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Hidden measurement row to compute exact two-line fit */}
              <div className="absolute left-0 top-0 invisible pointer-events-none -z-10 w-full">
                <div ref={measurementWrapRef} className="flex gap-2 md:gap-3 flex-wrap">
                  {mainCategories.map((category) => (
                    <span
                      key={`measure-${category.id}`}
                      data-measure-category="true"
                      className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap py-3 px-1.5 border-b-2 border-transparent"
                    >
                      <span className="text-[13px] leading-none opacity-85">{category.icon || '📦'}</span>
                      <span>{category.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <details className="relative flex-shrink-0 self-end group">
              <summary className="list-none cursor-pointer text-xs whitespace-nowrap font-semibold py-2 px-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
                See All →
              </summary>

              <div className="absolute right-0 top-full mt-2 w-[min(90vw,680px)] bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 max-h-[70vh] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryTree.map((parent) => (
                    <details key={`all-${parent.id}`} className="rounded border border-gray-100 overflow-hidden">
                      <summary className="list-none cursor-pointer flex items-start gap-3 font-semibold text-gray-900 hover:text-emerald-600 p-2 bg-gray-50/50 hover:bg-emerald-50/50">
                        <span className="text-base opacity-85 flex-shrink-0 w-6 text-center">{parent.icon || '📦'}</span>
                        {parent.image && (
                          <img
                            src={parent.image}
                            alt=""
                            aria-hidden="true"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${parent.slug}`}
                            className="block hover:text-emerald-600 font-semibold text-sm"
                          >
                            {parent.name}
                          </Link>
                          <span className="text-xs text-gray-500">{parent.children?.length || 0} subcategories</span>
                        </div>
                      </summary>

                      {parent.children && parent.children.length > 0 ? (
                        <div className="mt-2 ml-2 space-y-1 border-l border-gray-200 pl-3 bg-white p-2">
                          {parent.children.map((sub) => (
                            <Link
                              key={`all-sub-${sub.id}`}
                              href={`/products/${parent.slug}/${sub.slug}`}
                              className="flex items-center gap-2 text-xs text-gray-600 hover:text-emerald-600 p-1"
                            >
                              <span className="opacity-85">{sub.icon || '📦'}</span>
                              {sub.image && (
                                <img
                                  src={sub.image}
                                  alt=""
                                  aria-hidden="true"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  className="w-6 h-6 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <span>{sub.name}</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </details>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200">
                  <Link
                    href="/products"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Browse all products
                  </Link>
                </div>
              </div>
            </details>
          </div>
        </div>
        )}
      </div>
    </nav>
  );
};
