'use client';

import React, { useState } from 'react';
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

const initialCoupons: Coupon[] = [
  {
    id: '1',
    code: 'SAVE10',
    discount: 10,
    minOrder: 500,
    usage: { used: 0, total: 100 },
    expires: '12/31/2026',
    status: 'Active',
  },
  {
    id: '2',
    code: 'WELCOME20',
    discount: 20,
    minOrder: 1000,
    usage: { used: 5, total: 50 },
    expires: '11/30/2026',
    status: 'Active',
  },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    minOrder: '',
    totalUsage: '',
  });

  const handleCreateClick = () => {
    setEditingCoupon(null);
    setFormData({ code: '', discount: '', minOrder: '', totalUsage: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount.toString(),
      minOrder: coupon.minOrder.toString(),
      totalUsage: coupon.usage.total.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    if (confirm(`Delete coupon "${coupon.code}"?`)) {
      setCoupons(coupons.filter((c) => c.id !== coupon.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discount || !formData.minOrder) return;

    if (editingCoupon) {
      setCoupons(
        coupons.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                code: formData.code,
                discount: parseFloat(formData.discount),
                minOrder: parseFloat(formData.minOrder),
                usage: { ...c.usage, total: parseFloat(formData.totalUsage) || c.usage.total },
              }
            : c
        )
      );
    } else {
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        code: formData.code,
        discount: parseFloat(formData.discount),
        minOrder: parseFloat(formData.minOrder),
        usage: { used: 0, total: parseFloat(formData.totalUsage) || 100 },
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status: 'Active',
      };
      setCoupons([...coupons, newCoupon]);
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., SAVE10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Order ($)</label>
            <input
              type="number"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="100"
          />
        </div>
      </FormModal>
    </div>
  );
}
