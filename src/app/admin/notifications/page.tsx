'use client';

import React, { useEffect, useState } from 'react';

const MENU_SEEN_STORAGE_KEY = 'admin-menu-notification-seen';

type NotificationLevel = 'Warning' | 'Info' | 'Success';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  table: {
    columns: string[];
    rows: string[][];
  };
};

type DashboardResponse = {
  lowStockCount?: number;
  incompleteCount?: number;
  refundedCount?: number;
  recoveredOrders?: number;
  recoveredAmount?: number;
  notificationCounts?: {
    notifications?: number;
  };
  notificationDetails?: {
    lowStockProducts?: Array<{
      id: string;
      title: string;
      stock: number;
      mainCategory?: string;
      subCategory?: string | null;
      notifiedAt?: string;
    }>;
    recentIncompleteOrders?: Array<{
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      updatedAt?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
    }>;
    recentRefundedOrders?: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      updatedAt: string;
    }>;
    recentRecoveredOrders?: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      updatedAt: string;
    }>;
  };
};

function formatAmount(value: number): string {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) {
          alert('Admin access required');
          window.location.href = '/login';
          return;
        }

        if (!res.ok) {
          setNotifications([
            {
              id: 'load-failed',
              title: 'Unable to load notifications',
              message: 'Failed to load latest admin alerts.',
              level: 'Warning',
              table: {
                columns: ['SL', 'Details'],
                rows: [['1', 'Please refresh this page or try again later.']],
              },
            },
          ]);
          return;
        }

        const data: DashboardResponse = await res.json();
        const list: NotificationItem[] = [];

        const lowStockProducts = data.notificationDetails?.lowStockProducts || [];
        if (Number(data.lowStockCount || 0) > 0) {
          list.push({
            id: 'low-stock',
            title: 'Low Stock Alert',
            message: `${data.lowStockCount} products are below low-stock threshold.`,
            level: 'Warning',
            table: {
              columns: ['SL', 'Product', 'Main Category', 'Sub Category', 'Stock', 'Date'],
              rows: lowStockProducts.length
                ? lowStockProducts.map((item, index) => [
                    String(index + 1),
                    item.title,
                    item.mainCategory || 'N/A',
                    item.subCategory || '-',
                    String(item.stock),
                    item.notifiedAt ? formatDate(item.notifiedAt) : 'N/A',
                  ])
                : [['1', 'No product breakdown available.', '-', '-', '-', '-']],
            },
          });
        }

        const recentIncomplete = data.notificationDetails?.recentIncompleteOrders || [];
        if (Number(data.incompleteCount || 0) > 0) {
          list.push({
            id: 'incomplete-orders',
            title: 'Incomplete Tracking Orders',
            message: `${data.incompleteCount} orders still need completion tracking.`,
            level: 'Info',
            table: {
              columns: ['SL', 'Order #', 'Status', 'Amount', 'Customer', 'Email', 'Phone', 'Date'],
              rows: recentIncomplete.length
                ? recentIncomplete.map((order, index) => [
                    String(index + 1),
                    order.orderNumber,
                    order.status,
                    formatAmount(order.totalAmount),
                    order.customerName || 'N/A',
                    order.customerEmail || 'N/A',
                    order.customerPhone || 'N/A',
                    formatDate(order.updatedAt || order.createdAt),
                  ])
                : [['1', 'No recent incomplete order details available.', '-', '-', '-', '-', '-', '-']],
            },
          });
        }

        const recentRecovered = data.notificationDetails?.recentRecoveredOrders || [];
        if (Number(data.recoveredOrders || 0) > 0) {
          list.push({
            id: 'recovered-orders',
            title: 'Recovered Orders',
            message: `${data.recoveredOrders} orders recovered (${formatAmount(Number(data.recoveredAmount || 0))}).`,
            level: 'Success',
            table: {
              columns: ['SL', 'Order #', 'Amount', 'Date'],
              rows: recentRecovered.length
                ? recentRecovered.map((order, index) => [
                    String(index + 1),
                    order.orderNumber,
                    formatAmount(order.totalAmount),
                    formatDate(order.updatedAt),
                  ])
                : [['1', 'No recent recovered order details available.', '-', '-']],
            },
          });
        }

        const recentRefunded = data.notificationDetails?.recentRefundedOrders || [];
        if (Number(data.refundedCount || 0) > 0) {
          list.push({
            id: 'refunded-payments',
            title: 'Refunded Payments',
            message: `${data.refundedCount} payments are refunded.`,
            level: 'Info',
            table: {
              columns: ['SL', 'Order #', 'Amount', 'Date'],
              rows: recentRefunded.length
                ? recentRefunded.map((order, index) => [
                    String(index + 1),
                    order.orderNumber,
                    formatAmount(order.totalAmount),
                    formatDate(order.updatedAt),
                  ])
                : [['1', 'No recent refunded payment details available.', '-', '-']],
            },
          });
        }

        if (list.length === 0) {
          list.push({
            id: 'all-clear',
            title: 'No new notifications',
            message: 'All admin alerts have been reviewed.',
            level: 'Success',
            table: {
              columns: ['SL', 'Details'],
              rows: [['1', 'You are all caught up for now.']],
            },
          });
        }

        setNotifications(list);

        const totalNotifications = Number(data?.notificationCounts?.notifications || 0);
        try {
          const raw = localStorage.getItem(MENU_SEEN_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : {};
          const nextSeen = {
            ...(typeof parsed === 'object' && parsed ? parsed : {}),
            notifications: totalNotifications,
          };
          localStorage.setItem(MENU_SEEN_STORAGE_KEY, JSON.stringify(nextSeen));
        } catch {
          // Ignore localStorage parse failures.
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([
          {
            id: 'unexpected-error',
            title: 'Unexpected notification error',
            message: 'Could not load notifications.',
            level: 'Warning',
            table: {
              columns: ['SL', 'Details'],
              rows: [['1', 'Please try refreshing the page.']],
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const levelBadgeClass = (level: NotificationLevel) => {
    if (level === 'Warning') return 'bg-amber-100 text-amber-800';
    if (level === 'Success') return 'bg-emerald-100 text-emerald-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        <p className="text-gray-600 mt-2">Track system and store alerts</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading notifications...</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2 gap-4">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${levelBadgeClass(item.level)}`}>{item.level}</span>
              </div>
              <p className="text-gray-700 mb-3">{item.message}</p>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 overflow-x-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Details</p>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      {item.table.columns.map((column) => (
                        <th key={`${item.id}-${column}`} className="px-3 py-2 font-semibold whitespace-nowrap">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.table.rows.map((row, rowIndex) => (
                      <tr key={`${item.id}-row-${rowIndex}`} className="border-b border-gray-100 last:border-0 text-gray-700">
                        {row.map((cell, cellIndex) => (
                          <td key={`${item.id}-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
