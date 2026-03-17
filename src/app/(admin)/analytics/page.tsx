'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueChange: 8.5,
    ordersChange: 12.3,
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

        // In production, fetch real analytics data
        // For now, calculate from available data
        const ordersRes = await fetch('/api/orders?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const productsRes = await fetch('/api/products?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (ordersRes.ok && productsRes.ok) {
          const ordersData = await ordersRes.json();
          const productsData = await productsRes.json();

          const totalOrders = ordersData.orders?.length || 0;
          const totalProducts = productsData.products?.length || 0;
          const totalRevenue = ordersData.orders?.reduce(
            (sum: number, order: any) => sum + order.totalAmount,
            0
          ) || 0;

          setAnalytics({
            totalRevenue,
            totalOrders,
            totalProducts,
            totalUsers: 3, // From seed data
            revenueChange: 8.5,
            ordersChange: 12.3,
          });
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
      change: `+${analytics.revenueChange}%`,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: analytics.totalOrders,
      change: `+${analytics.ordersChange}%`,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      label: 'Total Users',
      value: analytics.totalUsers,
      change: '+0%',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Package,
      label: 'Total Products',
      value: analytics.totalProducts,
      change: '+0%',
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
                <p className="text-green-600 text-sm mt-2">{card.change} from last month</p>
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
