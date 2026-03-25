'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>(emptyCounts);
  const pathname = usePathname();

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const menuItems = [
    { key: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard', href: '/admin/analytics' },
    { key: 'products' as const, icon: Package, label: 'Products', href: '/admin/products' },
    { key: 'orders' as const, icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { key: 'categories' as const, icon: FolderTree, label: 'Categories', href: '/admin/categories' },
    { key: 'campaigns' as const, icon: Megaphone, label: 'Campaigns', href: '/admin/campaigns' },
    { key: 'coupons' as const, icon: Tag, label: 'Coupons', href: '/admin/coupons' },
    { key: 'users' as const, icon: Users, label: 'Users', href: '/admin/users' },
    { key: 'reviews' as const, icon: Star, label: 'Reviews', href: '/admin/reviews' },
    { key: 'media' as const, icon: Image, label: 'Media', href: '/admin/media' },
    { key: 'notifications' as const, icon: Bell, label: 'Notifications', href: '/admin/notifications' },
    { key: 'payments' as const, icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { key: 'settings' as const, icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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

      <div className="flex flex-1">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo & Sidebar Toggle */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && (
            <Logo size="sm" tone="light" className="max-w-[180px] origin-left" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                pathname === item.href ? 'bg-rose-600 text-white' : 'hover:bg-gray-800 text-gray-100'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && (
                <span
                  className={`ml-auto inline-flex min-w-[1.4rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    notificationCounts[item.key] > 0 ? 'bg-rose-500 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {notificationCounts[item.key]}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">{children}</div>
      </div>
      </div>
    </div>
  );
}
