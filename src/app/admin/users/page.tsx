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
        return 'bg-blue-100 text-blue-700';
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-700';
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={24} />
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
                  {user.emailVerified && <span className="text-blue-600">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span>{user.phone}</span>
                  {user.phoneVerified && <span className="text-blue-600">✓</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm font-semibold">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
