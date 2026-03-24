'use client';

import React, { useEffect, useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import FormModal from '@/components/admin/FormModal';
import Badge from '@/components/admin/Badge';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  usage: { used: number; total: number };
  expires: string;
  status: 'Active' | 'Expired' | 'Inactive';
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    minOrder: '',
    totalUsage: '',
    expires: '',
    status: 'Active' as Coupon['status'],
  });

  const fetchCoupons = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateClick = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount: '',
      minOrder: '',
      totalUsage: '',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount.toString(),
      minOrder: coupon.minOrder.toString(),
      totalUsage: coupon.usage.total.toString(),
      expires: coupon.expires,
      status: coupon.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (coupon: Coupon) => {
    if (confirm(`Delete coupon "${coupon.code}"?`)) {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCoupons(coupons.filter((c) => c.id !== coupon.id));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discount || !formData.minOrder) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      code: formData.code,
      discount: parseFloat(formData.discount),
      minOrder: parseFloat(formData.minOrder),
      totalUsage: parseFloat(formData.totalUsage) || 100,
      expires: formData.expires,
      status: formData.status,
    };

    if (editingCoupon) {
      const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? data.coupon : c)));
      }
    } else {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCoupons([data.coupon, ...coupons]);
      }
    }

    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
    },
    {
      key: 'discount',
      label: 'Discount',
      render: (value: number) => `${value}%`,
      sortable: true,
    },
    {
      key: 'minOrder',
      label: 'Min Order',
      render: (value: number) => `$${value}`,
      sortable: true,
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (value: { used: number; total: number }) => `${value.used}/${value.total}`,
    },
    {
      key: 'expires',
      label: 'Expires',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <Badge label={status} color={status === 'Active' ? 'green' : 'red'} />
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Coupons"
        subtitle="Manage discount coupons"
        icon={Tag}
        action={{
          label: 'Create Coupon',
          onClick: handleCreateClick,
          icon: Plus,
        }}
      />

      <DataTable
        columns={columns}
        data={coupons}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <FormModal
        isOpen={isModalOpen}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingCoupon ? 'Update' : 'Create'}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="e.g., SAVE10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expires</label>
            <input
              type="text"
              value={formData.expires}
              onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="12/31/2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Coupon['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Order ($)</label>
            <input
              type="number"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Usage Limit</label>
          <input
            type="number"
            value={formData.totalUsage}
            onChange={(e) => setFormData({ ...formData, totalUsage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="100"
          />
        </div>
      </FormModal>
    </div>
  );
}
