'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { User, MapPin, Package, LogOut, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useCSRFToken } from '@/hooks/useCSRFToken';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  addresses: any[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: any[];
}

export default function AccountPage() {
  const { showToast } = useToast();
  const { token: csrfToken, sessionId, refreshToken, handleError } = useCSRFToken();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    division: '',
    district: '',
    upazila: '',
    address: '',
    postCode: '',
    isDefault: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        // Fetch profile
        const profileRes = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);
          setFormData({
            firstName: profileData.user.firstName || '',
            lastName: profileData.user.lastName || '',
            phone: profileData.user.phone || '',
          });
          setAddressForm((prev) => ({
            ...prev,
            firstName: profileData.user.firstName || '',
            lastName: profileData.user.lastName || '',
            email: profileData.user.email || '',
            phone: profileData.user.phone || '',
          }));
        }

        // Fetch orders
        const ordersRes = await fetch('/api/orders?limit=20', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSaving(true);
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          ...formData,
          _csrf: csrfToken,
          _session_id: sessionId,
        }),
      });

      // Handle CSRF token validation error
      if (res.status === 403) {
        const wasStale = await handleError(res);
        if (wasStale) {
          showToast('Security token expired. Please try again.', 'error');
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditMode(false);
        showToast('Profile updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !profile) return;

    try {
      setAddressSaving(true);
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          ...addressForm,
          _csrf: csrfToken,
          _session_id: sessionId,
        }),
      });

      // Handle CSRF token validation error
      if (res.status === 403) {
        const wasStale = await handleError(res);
        if (wasStale) {
          showToast('Security token expired. Please try again.', 'error');
          return;
        }
      }

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to add address', 'error');
        return;
      }

      const data = await res.json();
      setProfile({
        ...profile,
        addresses: [...(profile.addresses || []), data.address],
      });
      setShowAddressForm(false);
      showToast('Address added successfully', 'success');
    } catch (error) {
      console.error('Error adding address:', error);
      showToast('Failed to add address', 'error');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload file
    try {
      setImageUploading(true);
      const token = localStorage.getItem('token');
      if (!token || !profile) return;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to upload image', 'error');
        return;
      }

      const data = await res.json();
      setProfile({
        ...profile,
        profileImage: data.user.profileImage,
      });
      showToast('Profile picture updated successfully', 'success');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showToast('Failed to upload profile picture', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full text-center">
          <p>Please login to view your account</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b">
                <div className="relative">
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-rose-600" size={40} />
                    )}
                  </div>
                  <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 bg-rose-600 text-white rounded-full p-2 cursor-pointer hover:bg-rose-700 shadow-lg">
                    <Camera size={16} />
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="font-bold">{profile?.firstName} {profile?.lastName}</p>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                  {imageUploading && <p className="text-xs text-rose-600 mt-1">Uploading...</p>}
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded ${
                    activeTab === 'profile'
                      ? 'bg-rose-100 text-rose-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User size={16} className="inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2 rounded ${
                    activeTab === 'orders'
                      ? 'bg-rose-100 text-rose-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package size={16} className="inline mr-2" />
                  Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-4 py-2 rounded ${
                    activeTab === 'addresses'
                      ? 'bg-rose-100 text-rose-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapPin size={16} className="inline mr-2" />
                  Addresses
                </button>
              </nav>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">My Profile</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:bg-gray-400"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">First Name</p>
                        <p className="font-semibold">{profile.firstName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Name</p>
                        <p className="font-semibold">{profile.lastName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>

                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No orders yet</p>
                    <a
                      href="/products"
                      className="inline-block mt-4 bg-rose-600 text-white px-6 py-2 rounded hover:bg-rose-700"
                    >
                      Start Shopping
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Order Number</p>
                            <p className="font-semibold">{order.orderNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              order.status === 'COMPLETED'
                                ? 'bg-rose-100 text-rose-700'
                                : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-semibold">৳{order.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">My Addresses</h2>
                  <button
                    onClick={() => setShowAddressForm((prev) => !prev)}
                    className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
                  >
                    {showAddressForm ? 'Cancel' : 'Add New Address'}
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mb-6 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        required
                        value={addressForm.label}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Label (Home/Office)"
                      />
                      <input
                        required
                        value={addressForm.firstName}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="First Name"
                      />
                      <input
                        required
                        value={addressForm.lastName}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Last Name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        required
                        type="email"
                        value={addressForm.email}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Email"
                      />
                      <input
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Phone"
                      />
                    </div>

                    <input
                      required
                      value={addressForm.address}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Street Address"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        required
                        value={addressForm.division}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, division: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Division"
                      />
                      <input
                        required
                        value={addressForm.district}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="District"
                      />
                      <input
                        required
                        value={addressForm.upazila}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, upazila: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Upazila"
                      />
                      <input
                        value={addressForm.postCode}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, postCode: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Post Code"
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      />
                      Set as default address
                    </label>

                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="px-5 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:bg-gray-400"
                    >
                      {addressSaving ? 'Saving...' : 'Save Address'}
                    </button>
                  </form>
                )}

                {profile.addresses && profile.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {profile.addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border rounded-lg p-4 ${
                          address.isDefault ? 'border-rose-600 bg-rose-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{address.label}</p>
                            <p className="text-gray-700 mt-1">{address.address}</p>
                            <p className="text-sm text-gray-600">
                              {address.upazila}, {address.district}, {address.division}
                            </p>
                            {address.isDefault && (
                              <span className="inline-block mt-2 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm font-semibold">
                                Default Address
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No addresses saved</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
