'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import FormModal from '@/components/admin/FormModal';
import Badge from '@/components/admin/Badge';

interface Campaign {
  id: string;
  name: string;
  description: string;
  badge: string;
  discountText: string;
  startsAt: string;
  endsAt: string;
  status: 'Active' | 'Inactive' | 'Scheduled' | 'Ended';
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    badge: '',
    discountText: '',
    startsAt: '',
    endsAt: '',
    status: 'Active' as Campaign['status'],
  });

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch('/api/admin/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateClick = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      badge: 'Campaign',
      discountText: '',
      startsAt: new Date().toLocaleDateString(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      badge: campaign.badge,
      discountText: campaign.discountText,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      status: campaign.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (campaign: Campaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c.id !== campaign.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      badge: formData.badge,
      discountText: formData.discountText,
      startsAt: formData.startsAt,
      endsAt: formData.endsAt,
      status: formData.status,
    };

    if (editingCampaign) {
      const res = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCampaigns(campaigns.map((c) => (c.id === editingCampaign.id ? data.campaign : c)));
      }
    } else {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCampaigns([data.campaign, ...campaigns]);
      }
    }

    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
    },
    {
      key: 'badge',
      label: 'Badge',
      sortable: true,
    },
    {
      key: 'discountText',
      label: 'Offer',
    },
    {
      key: 'startsAt',
      label: 'Starts',
      sortable: true,
    },
    {
      key: 'endsAt',
      label: 'Ends',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <Badge
          label={status}
          color={status === 'Active' ? 'green' : status === 'Scheduled' ? 'yellow' : 'red'}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Campaigns"
        subtitle="Manage homepage campaign highlights"
        icon={Megaphone}
        action={{
          label: 'Create Campaign',
          onClick: handleCreateClick,
          icon: Plus,
        }}
      />

      <DataTable columns={columns} data={campaigns} onEdit={handleEditClick} onDelete={handleDeleteClick} loading={loading} />

      <FormModal
        isOpen={isModalOpen}
        title={editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingCampaign ? 'Update' : 'Create'}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="Eid Mega Deals"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="Festival picks with big markdowns"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge</label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="Seasonal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Offer Text</label>
            <input
              type="text"
              value={formData.discountText}
              onChange={(e) => setFormData({ ...formData, discountText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="Up to 15% off"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Starts</label>
            <input
              type="text"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="03/20/2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ends</label>
            <input
              type="text"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="04/10/2026"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Campaign['status'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Ended">Ended</option>
          </select>
        </div>
      </FormModal>
    </div>
  );
}
