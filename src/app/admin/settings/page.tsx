'use client';

import React, { useState } from 'react';
import { Settings, Save, Upload } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    storeName: 'eShopping',
    currency: 'BDT',
    tagline: 'Your one-stop marketplace',
    aboutText: 'Brief description of your store...',
    supportEmail: 'support@eshopping.com',
    supportPhone: '01913512342',
    freeShippingThreshold: '50',
    enableReviews: true,
    enableWishlist: true,
    maintenanceMode: false,
    facebookUrl: 'https://facebook.com/yourpage',
    instagramUrl: 'https://instagram.com/yourpage',
    youtubeUrl: 'https://youtube.com/yourchannel',
    linkedinUrl: 'https://linkedin.com/company/yourcompany',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const FormSection = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} className="text-blue-600" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4 mt-4">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminHeader
          title="Settings"
          subtitle="Manage your store configuration"
          icon={Settings}
        />
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <FormSection
          icon={Settings}
          title="Store Information"
          description="Basic details about your store"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    <Upload size={24} />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Upload size={16} />
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or SVG</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About Text</label>
              <textarea
                value={formData.aboutText}
                onChange={(e) => handleChange('aboutText', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                rows={4}
              />
            </div>
          </div>
        </FormSection>

        {/* Contact Information */}
        <FormSection
          icon={Settings}
          title="Contact Information"
          description="How customers can reach you"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
              <input
                type="tel"
                value={formData.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </FormSection>

        {/* Shipping */}
        <FormSection
          icon={Settings}
          title="Shipping"
          description="Shipping-related settings"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($)</label>
            <input
              type="number"
              value={formData.freeShippingThreshold}
              onChange={(e) => handleChange('freeShippingThreshold', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-600 mt-2">
              Orders above this amount qualify for free shipping. Set to 0 to disable.
            </p>
          </div>
        </FormSection>

        {/* Features */}
        <FormSection
          icon={Settings}
          title="Features"
          description="Toggle store features on or off"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Product Reviews</p>
                <p className="text-sm text-gray-600">Allow customers to leave reviews</p>
              </div>
              <ToggleSwitch
                checked={formData.enableReviews}
                onChange={(v) => handleChange('enableReviews', v)}
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Wishlist</p>
                  <p className="text-sm text-gray-600">Allow customers to save products for later</p>
                </div>
                <ToggleSwitch
                  checked={formData.enableWishlist}
                  onChange={(v) => handleChange('enableWishlist', v)}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable the storefront for customers</p>
                </div>
                <ToggleSwitch
                  checked={formData.maintenanceMode}
                  onChange={(v) => handleChange('maintenanceMode', v)}
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* Social Media */}
        <FormSection
          icon={Settings}
          title="Social Media"
          description="Links displayed in the website footer"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
