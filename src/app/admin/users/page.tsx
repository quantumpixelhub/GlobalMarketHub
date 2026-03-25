'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Trash2, Shield } from 'lucide-react';

type PermissionKey =
  | 'canUseAdminPanel'
  | 'manageDashboard'
  | 'manageProducts'
  | 'manageOrders'
  | 'manageCategories'
  | 'manageCampaigns'
  | 'manageCoupons'
  | 'manageUsers'
  | 'manageReviews'
  | 'manageMedia'
  | 'manageNotifications'
  | 'managePayments'
  | 'manageSettings';

type PermissionState = Record<PermissionKey, boolean>;

const defaultPermissions: PermissionState = {
  canUseAdminPanel: false,
  manageDashboard: false,
  manageProducts: false,
  manageOrders: false,
  manageCategories: false,
  manageCampaigns: false,
  manageCoupons: false,
  manageUsers: false,
  manageReviews: false,
  manageMedia: false,
  manageNotifications: false,
  managePayments: false,
  manageSettings: false,
};

const permissionLabels: Array<{ key: PermissionKey; label: string }> = [
  { key: 'canUseAdminPanel', label: 'Admin Panel Access' },
  { key: 'manageDashboard', label: 'Dashboard' },
  { key: 'manageProducts', label: 'Products' },
  { key: 'manageOrders', label: 'Orders' },
  { key: 'manageCategories', label: 'Categories' },
  { key: 'manageCampaigns', label: 'Campaigns' },
  { key: 'manageCoupons', label: 'Coupons' },
  { key: 'manageUsers', label: 'Users' },
  { key: 'manageReviews', label: 'Reviews' },
  { key: 'manageMedia', label: 'Media' },
  { key: 'manageNotifications', label: 'Notifications' },
  { key: 'managePayments', label: 'Payments' },
  { key: 'manageSettings', label: 'Settings' },
];

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  adminPermission?: Partial<PermissionState> | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDraft, setRoleDraft] = useState<string>('CUSTOMER');
  const [permissionDraft, setPermissionDraft] = useState<PermissionState>(defaultPermissions);

  const hydrateEditor = (user: User | null) => {
    if (!user) return;
    setRoleDraft(user.role);
    setPermissionDraft({
      ...defaultPermissions,
      ...(user.adminPermission || {}),
    });
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const res = await fetch('/api/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 403) {
        alert('Admin access required');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (userId: string) => {
    const confirmed = window.confirm('Delete this member permanently? This cannot be undone.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setDeletingId(userId);
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete member');
        return;
      }

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('Member deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

  const saveUserPrivileges = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setSaving(true);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: roleDraft,
          permissions: permissionDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update privileges');
        return;
      }

      const updatedUser = data.user as User;
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setSelectedUser(updatedUser);
      hydrateEditor(updatedUser);
      alert('Privileges updated successfully');
    } catch (error) {
      console.error('Privilege update error:', error);
      alert('Failed to update privileges');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'SELLER':
        return 'bg-rose-100 text-rose-700';
      case 'CUSTOMER':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
        <p className="text-gray-600 mt-2">Manage platform users and their roles</p>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <User className="text-rose-600" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{user.email}</span>
                  {user.emailVerified && <span className="text-rose-600">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span>{user.phone}</span>
                  {user.phoneVerified && <span className="text-rose-600">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUser(user);
                  hydrateEditor(user);
                }}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm font-semibold"
              >
                View Details
              </button>

              <button
                type="button"
                onClick={() => deleteUser(user.id)}
                disabled={deletingId === user.id}
                className="w-full mt-2 px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-semibold disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={15} />
                  {deletingId === user.id ? 'Deleting...' : 'Delete Member'}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <div className="mt-1 flex items-center gap-2">
                  <Shield size={16} className="text-gray-500" />
                  <select
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="SELLER">SELLER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Email Verified</p>
                <p className="font-semibold text-gray-900">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone Verified</p>
                <p className="font-semibold text-gray-900">{selectedUser.phoneVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-semibold text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
              </div>

              <div className="pt-2">
                <p className="text-gray-500 mb-2">Function Permissions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissionLabels.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(permissionDraft[item.key])}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPermissionDraft((prev) => ({
                            ...prev,
                            [item.key]: checked,
                          }));
                        }}
                      />
                      <span className="text-gray-800 text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => deleteUser(selectedUser.id)}
                disabled={deletingId === selectedUser.id}
                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deletingId === selectedUser.id ? 'Deleting...' : 'Delete Member'}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveUserPrivileges}
                  disabled={saving}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Privileges'}
                </button>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
