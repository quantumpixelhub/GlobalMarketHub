'use client';

import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  trackingProgress?: string;
  isIncomplete?: boolean;
  isRecovered?: boolean;
  deliveryStatus?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  courierName?: string;
  totalAmount: number;
  paymentStatus?: string;
  createdAt: string;
  payment?: {
    id: string;
    gatewayName: string;
    gatewayTransactionId?: string | null;
    status: string;
    amount: number;
    completedAt?: string | null;
  } | null;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  items: any[];
}

type EditableOrderFields = {
  courierName: string;
  trackingNumber: string;
  status: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'incomplete' | 'recovered' | 'refunded'>('all');
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [recoveredCount, setRecoveredCount] = useState(0);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const [refundedCount, setRefundedCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [edits, setEdits] = useState<Record<string, EditableOrderFields>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [recoveringOrderId, setRecoveringOrderId] = useState<string | null>(null);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const query =
          activeFilter === 'incomplete'
            ? '&view=incomplete'
            : activeFilter === 'recovered'
              ? '&view=recovered'
            : activeFilter === 'refunded'
              ? '&view=refunded'
              : '';
        const res = await fetch(`/api/admin/orders?limit=100${query}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const list = data.orders || [];
          setIncompleteCount(Number(data?.summary?.incompleteCount || 0));
          setRecoveredCount(Number(data?.summary?.recoveredCount || 0));
          setRecoveredAmount(Number(data?.summary?.recoveredAmount || 0));
          setRefundedCount(Number(data?.summary?.refundedCount || 0));
          setOrders(list);
          const initialEdits: Record<string, EditableOrderFields> = {};
          list.forEach((order: Order) => {
            initialEdits[order.id] = {
              courierName: order.courierName && order.courierName !== 'Not Assigned' ? order.courierName : '',
              trackingNumber: order.trackingNumber || '',
              status: order.status || 'PENDING',
            };
          });
          setEdits(initialEdits);
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
  }, [activeFilter]);

  const updateEditField = (orderId: string, field: keyof EditableOrderFields, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [orderId]: {
        courierName: prev[orderId]?.courierName || '',
        trackingNumber: prev[orderId]?.trackingNumber || '',
        status: prev[orderId]?.status || 'PENDING',
        [field]: value,
      },
    }));
  };

  const saveOrderUpdate = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again');
      return;
    }

    const payload = edits[orderId] || { courierName: '', trackingNumber: '', status: 'PENDING' };

    try {
      setSavingOrderId(orderId);
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          courierName: payload.courierName,
          trackingNumber: payload.trackingNumber,
          status: payload.status,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to update order');
        return;
      }

      const updatedOrder: Order = data.order;
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setEdits((prev) => ({
        ...prev,
        [orderId]: {
          courierName: updatedOrder.courierName && updatedOrder.courierName !== 'Not Assigned' ? updatedOrder.courierName : '',
          trackingNumber: updatedOrder.trackingNumber || '',
          status: updatedOrder.status || 'PENDING',
        },
      }));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setSavingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-rose-100 text-rose-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PROCESSING':
        return 'bg-rose-100 text-rose-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrackingProgressColor = (value?: string) => {
    if (value === 'Tracking Active') return 'bg-emerald-100 text-emerald-700';
    if (value === 'Partially Assigned') return 'bg-amber-100 text-amber-700';
    if (value === 'Pending Assignment') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const canRefundOrder = (order: Order) => {
    const gateway = String(order.payment?.gatewayName || '').toLowerCase();
    const txStatus = String(order.payment?.status || '').toUpperCase();
    const orderPaymentStatus = String(order.paymentStatus || '').toUpperCase();

    if (gateway !== 'uddoktapay') return false;
    if (txStatus === 'REFUNDED' || orderPaymentStatus === 'REFUNDED') return false;
    return txStatus === 'SUCCESS' || orderPaymentStatus === 'SUCCESS';
  };

  const refundOrder = async (order: Order) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again');
      return;
    }

    const confirmed = window.confirm(
      `Initiate refund for ${order.orderNumber}? This will call UddoktaPay refund API.`
    );
    if (!confirmed) return;

    try {
      setRefundingOrderId(order.id);

      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: 'Admin initiated refund from Orders panel',
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Refund failed');
        return;
      }

      alert('Refund processed successfully');

      setOrders((prev) =>
        prev.map((item) => {
          if (item.id !== order.id) return item;
          return {
            ...item,
            paymentStatus: 'REFUNDED',
            payment: item.payment
              ? {
                  ...item.payment,
                  status: 'REFUNDED',
                }
              : item.payment,
          };
        })
      );

      setSelectedOrder((prev) => {
        if (!prev || prev.id !== order.id) return prev;
        return {
          ...prev,
          paymentStatus: 'REFUNDED',
          payment: prev.payment
            ? {
                ...prev.payment,
                status: 'REFUNDED',
              }
            : prev.payment,
        };
      });
    } catch (error) {
      console.error('Refund error:', error);
      alert('Refund failed');
    } finally {
      setRefundingOrderId(null);
    }
  };

  const canRecoverOrder = (order: Order) => {
    return Boolean(order.isIncomplete) && !order.isRecovered;
  };

  const recoverOrder = async (order: Order) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again');
      return;
    }

    const confirmed = window.confirm(`Recover ${order.orderNumber} and mark it as actively followed up?`);
    if (!confirmed) return;

    try {
      setRecoveringOrderId(order.id);
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'recover',
          orderId: order.id,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to recover order');
        return;
      }

      const updatedOrder: Order = data.order;
      setOrders((prev) => prev.map((item) => (item.id === order.id ? updatedOrder : item)));
      setSelectedOrder((prev) => (prev?.id === order.id ? updatedOrder : prev));
      setRecoveredCount((prev) => prev + 1);
      setRecoveredAmount((prev) => prev + Number(order.totalAmount || 0));
      setIncompleteCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Recovery error:', error);
      alert('Failed to recover order');
    } finally {
      setRecoveringOrderId(null);
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
        <p className="text-sm text-gray-500 mt-1">
          Recovered Orders: <span className="font-semibold text-emerald-700">{recoveredCount}</span> |
          Recovered Amount: <span className="font-semibold text-emerald-700"> ৳{recoveredAmount.toLocaleString()}</span>
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeFilter === 'all' ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('incomplete')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeFilter === 'incomplete' ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Incomplete Tracking ({incompleteCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('recovered')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeFilter === 'recovered' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Recovered Orders ({recoveredCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('refunded')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeFilter === 'refunded' ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Refunded Payments ({refundedCount})
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[1850px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Order #</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Address</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Courier</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Tracking</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Tracking Progress</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Delivery</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Recovery</th>
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
                    <td className="px-6 py-4">
                      <input
                        value={edits[order.id]?.courierName ?? ''}
                        onChange={(e) => updateEditField(order.id, 'courierName', e.target.value)}
                        placeholder="Courier name"
                        className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={edits[order.id]?.trackingNumber ?? ''}
                        onChange={(e) => updateEditField(order.id, 'trackingNumber', e.target.value)}
                        placeholder="Tracking no"
                        className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getTrackingProgressColor(order.trackingProgress)}`}>
                        {order.trackingProgress || 'Pending Assignment'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={edits[order.id]?.status ?? order.status}
                        onChange={(e) => updateEditField(order.id, 'status', e.target.value)}
                        className="w-44 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURNED">Returned</option>
                      </select>
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
                      <div className="flex items-center gap-2">
                        {order.isRecovered && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            Recovered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {canRecoverOrder(order) && (
                          <button
                            onClick={() => recoverOrder(order)}
                            disabled={recoveringOrderId === order.id}
                            className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400"
                          >
                            {recoveringOrderId === order.id ? 'Recovering...' : 'Recover'}
                          </button>
                        )}
                        <button
                          onClick={() => saveOrderUpdate(order.id)}
                          disabled={savingOrderId === order.id}
                          className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-400"
                        >
                          {savingOrderId === order.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
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
                  <p className="text-sm text-gray-600">Tracking Progress</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getTrackingProgressColor(selectedOrder.trackingProgress)}`}>
                    {selectedOrder.trackingProgress || 'Pending Assignment'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recovery State</p>
                  <p className="font-semibold">{selectedOrder.isRecovered ? 'Recovered' : 'Not Recovered'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Email</p>
                  <p className="font-semibold">
                    {selectedOrder.user?.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-rose-600">
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
                  <p className="text-sm text-gray-600">Payment</p>
                  <p className="font-semibold">
                    {selectedOrder.payment?.gatewayName || 'N/A'} | {selectedOrder.payment?.status || selectedOrder.paymentStatus || 'PENDING'}
                  </p>
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
                {canRefundOrder(selectedOrder) && (
                  <button
                    type="button"
                    onClick={() => refundOrder(selectedOrder)}
                    disabled={refundingOrderId === selectedOrder.id}
                    className="w-full bg-amber-500 text-white py-2 rounded hover:bg-amber-600 disabled:bg-gray-400"
                  >
                    {refundingOrderId === selectedOrder.id
                      ? 'Processing Refund...'
                      : 'Refund via UddoktaPay'}
                  </button>
                )}
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
