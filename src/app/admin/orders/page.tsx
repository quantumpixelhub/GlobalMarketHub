'use client';

import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  deliveryStatus?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  courierName?: string;
  totalAmount: number;
  createdAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  items: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch('/api/admin/orders?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else if (res.status === 403) {
          alert('Admin access required');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
        <p className="text-gray-600 mt-2">View and manage customer orders</p>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[1600px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Order #</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Address</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Courier</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Delivery</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.customerName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown Customer')}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{order.customerEmail || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{order.customerPhone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 min-w-[260px]">{order.customerAddress || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{order.courierName || 'Not Assigned'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                        {order.deliveryStatus || 'Pending Dispatch'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ৳{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">
                    {selectedOrder.customerName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{selectedOrder.customerEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{selectedOrder.customerPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{selectedOrder.customerAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Courier</p>
                  <p className="font-semibold">{selectedOrder.courierName || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Status</p>
                  <p className="font-semibold">{selectedOrder.deliveryStatus || 'Pending Dispatch'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="font-semibold">{selectedOrder.trackingNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Email</p>
                  <p className="font-semibold">
                    {selectedOrder.user?.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ৳{selectedOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-semibold">{selectedOrder.items.length} items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
