'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  completedOrders: number;
  lowStockCount: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    completedOrders: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch('/api/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAnalytics({
            totalRevenue: data.totalRevenue || 0,
            totalOrders: data.totalOrders || 0,
            totalProducts: data.totalProducts || 0,
            totalUsers: data.totalUsers || 0,
            completedOrders: data.completedOrders || 0,
            lowStockCount: data.lowStockCount || 0,
          });
        } else if (res.status === 403) {
          alert('Admin access required');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const cards = [
    {
      icon: TrendingUp,
      label: 'Total Revenue',
      value: `৳${analytics.totalRevenue.toLocaleString()}`,
      change: 'All-time total',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: analytics.totalOrders,
      change: `${analytics.completedOrders} completed`,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      label: 'Total Users',
      value: analytics.totalUsers,
      change: 'Registered accounts',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Package,
      label: 'Total Products',
      value: analytics.totalProducts,
      change: `${analytics.lowStockCount} low stock`,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your e-commerce platform</p>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-lg p-6 shadow">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <card.icon size={24} />
                </div>
                <p className="text-gray-600 text-sm">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                <p className="text-gray-600 text-sm mt-2">{card.change}</p>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
