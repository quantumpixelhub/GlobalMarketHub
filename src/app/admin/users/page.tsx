'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';

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
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
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

    fetchUsers();
  }, []);

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
                onClick={() => setSelectedUser(user)}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm font-semibold"
              >
                View Details
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
                <p className="font-semibold text-gray-900">{selectedUser.role}</p>
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
            </div>

            <div className="mt-6 flex justify-end">
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
      )}
    </div>
  );
}
