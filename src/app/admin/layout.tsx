'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type LucideIcon,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  FolderTree,
  Tag,
  Star,
  Image,
  Bell,
  CreditCard,
  Settings,
  Megaphone,
  Store,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type NotificationCounts = {
  dashboard: number;
  products: number;
  orders: number;
  categories: number;
  campaigns: number;
  coupons: number;
  users: number;
  reviews: number;
  media: number;
  notifications: number;
  payments: number;
  settings: number;
};

type MenuKey = keyof NotificationCounts;

type MenuItem = {
  key: MenuKey;
  icon: LucideIcon;
  label: string;
  href: string;
};

const MENU_SEEN_STORAGE_KEY = 'admin-menu-notification-seen';

const emptyCounts: NotificationCounts = {
  dashboard: 0,
  products: 0,
  orders: 0,
  categories: 0,
  campaigns: 0,
  coupons: 0,
  users: 0,
  reviews: 0,
  media: 0,
  notifications: 0,
  payments: 0,
  settings: 0,
};

const menuItems: MenuItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/admin/analytics' },
  { key: 'products', icon: Package, label: 'Products', href: '/admin/products' },
  { key: 'orders', icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { key: 'categories', icon: FolderTree, label: 'Categories', href: '/admin/categories' },
  { key: 'campaigns', icon: Megaphone, label: 'Campaigns', href: '/admin/campaigns' },
  { key: 'coupons', icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { key: 'users', icon: Users, label: 'Users', href: '/admin/users' },
  { key: 'reviews', icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { key: 'media', icon: Image, label: 'Media', href: '/admin/media' },
  { key: 'notifications', icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { key: 'payments', icon: CreditCard, label: 'Payments', href: '/admin/payments' },
  { key: 'settings', icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>(emptyCounts);
  const [seenCounts, setSeenCounts] = useState<NotificationCounts>(emptyCounts);
  const pathname = usePathname();

  const persistSeenCounts = (nextSeen: NotificationCounts) => {
    setSeenCounts(nextSeen);
    localStorage.setItem(MENU_SEEN_STORAGE_KEY, JSON.stringify(nextSeen));
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MENU_SEEN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSeenCounts({
        ...emptyCounts,
        ...(typeof parsed === 'object' && parsed ? parsed : {}),
      });
    } catch {
      setSeenCounts(emptyCounts);
    }
  }, []);

  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;
        const data = await res.json();
        setNotificationCounts({
          ...emptyCounts,
          ...(data?.notificationCounts || {}),
        });
      } catch (error) {
        console.error('Failed to load menu notification counts:', error);
      }
    };

    fetchNotificationCounts();
  }, []);

  useEffect(() => {
    const activeItem = menuItems.find((item) => item.href === pathname);
    if (!activeItem) return;

    const currentCount = Number(notificationCounts[activeItem.key] || 0);
    const seenCount = Number(seenCounts[activeItem.key] || 0);
    if (currentCount <= seenCount) return;

    persistSeenCounts({
      ...seenCounts,
      [activeItem.key]: currentCount,
    });
  }, [pathname, notificationCounts, seenCounts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Welcome Back!</h2>
          <p className="text-xs text-gray-500">Manage your store and track performance</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
          >
            <LogOut size={18} />
            Logout
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              A
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-73px)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } sticky top-[73px] h-[calc(100vh-73px)] bg-gray-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 overflow-y-auto`}
      >
        {/* Logo & Sidebar Toggle */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && (
            <Logo size="sm" tone="light" className="origin-left flex-1 min-w-0" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const totalCount = Number(notificationCounts[item.key] || 0);
            const alreadySeen = Number(seenCounts[item.key] || 0);
            const unreadCount = Math.max(0, totalCount - alreadySeen);

            return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                const countAtClick = Number(notificationCounts[item.key] || 0);
                const seenAtClick = Number(seenCounts[item.key] || 0);
                if (countAtClick > seenAtClick) {
                  persistSeenCounts({
                    ...seenCounts,
                    [item.key]: countAtClick,
                  });
                }
              }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                pathname === item.href ? 'bg-rose-600 text-white' : 'hover:bg-gray-800 text-gray-100'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && unreadCount > 0 && (
                <span
                  className="ml-auto inline-flex min-w-[1.4rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-500 text-white"
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition"
          >
            <Store size={18} />
            {sidebarOpen && <span>Visit Store</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Page Content */}
        <div className="p-6 bg-gray-50 min-h-[calc(100vh-73px)] overflow-x-hidden">{children}</div>
      </div>
      </div>
    </div>
  );
}
