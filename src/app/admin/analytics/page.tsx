'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package, BarChart3, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import AdminHeader from '@/components/admin/AdminHeader';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  completedOrders: number;
  lowStockCount: number;
}

const monthlySalesData = [
  { month: 'Oct', sales: 400 },
  { month: 'Nov', sales: 300 },
  { month: 'Dec', sales: 200 },
  { month: 'Jan', sales: 278 },
  { month: 'Feb', sales: 1200 },
  { month: 'Mar', sales: 189 },
];

const orderStatusData = [
  { name: 'Processing', value: 1, color: '#3B82F6' },
  { name: 'Shipped', value: 1, color: '#8B5CF6' },
  { name: 'Pending', value: 2, color: '#F59E0B' },
  { name: 'Delivered', value: 1, color: '#2563EB' },
];

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

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;
  }

  return (
    <div>
      <AdminHeader
        title="Analytics"
        subtitle="Monitor your store performance and sales metrics"
        icon={BarChart3}
      />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Sales"
          value={analytics.totalOrders}
          icon={ShoppingCart}
          subtitle={`${analytics.completedOrders} completed`}
          bgColor="bg-white"
          iconColor="text-blue-500"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(analytics.totalRevenue / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          subtitle="All-time total"
          bgColor="bg-white"
          iconColor="text-blue-500"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          subtitle="Registered customers"
          bgColor="bg-white"
          iconColor="text-purple-500"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Pending Orders"
          value={analytics.totalOrders - analytics.completedOrders}
          icon={Package}
          subtitle={`${analytics.lowStockCount} low stock items`}
          bgColor="bg-white"
          iconColor="text-blue-600"
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={24} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Monthly Sales</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="sales" fill="#FF6B35" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={24} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Orders by Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </RechartsPie>
          </ResponsiveContainer>
          <div className="mt-6 space-y-2">
            {orderStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sold</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { rank: '#1', name: 'Drone with Camera', sold: 1, price: '$449.99' },
                { rank: '#2', name: 'Wireless Bluetooth Headphones', sold: 2, price: '$299.98' },
                { rank: '#3', name: 'Premium Sneakers', sold: 1, price: '$129.99' },
                { rank: '#4', name: 'Wireless Earbuds', sold: 1, price: '$129.99' },
                { rank: '#5', name: 'Portable Bluetooth Speaker', sold: 1, price: '$79.99' },
              ].map((product) => (
                <tr key={product.rank} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{product.rank}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <span className="font-medium">{product.sold} sold</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                    {product.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
