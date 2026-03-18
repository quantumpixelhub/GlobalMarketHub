'use client';

import React, { useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function PaymentsPage() {
  const [paymentConfig, setPaymentConfig] = useState({
    uddoktaEnabled: true,
    uddoktaApiKey: '',
    uddoktaBaseUrl: 'https://sandbox.uddoktapay.com/api/checkout-v2',
    bkashEnabled: true,
    bkashNumber: '01913512342',
    bkashAccountType: 'Personal',
    nagadEnabled: true,
    nagadNumber: '01913512342',
    nagadAccountType: 'Personal',
    rocketEnabled: true,
    rocketNumber: '01913512342',
    rocketAccountType: 'Personal',
    ipayEnabled: true,
    ipayNumber: '01913512342',
    cardPaymentEnabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setPaymentConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Payment configuration saved successfully!');
    }, 1000);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminHeader
          title="Payment Methods"
          subtitle="Configure payment gateways and mobile wallets"
          icon={CreditCard}
        />
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mobile Wallets */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mobile Wallets</h3>
              <p className="text-sm text-gray-600">Accept payments via local mobile wallet services</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-6">
            {/* bKash */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-pink-600">bKash</p>
                  <p className="text-sm text-gray-600">Accept bKash mobile wallet payments</p>
                </div>
                <ToggleSwitch
                  checked={paymentConfig.bkashEnabled}
                  onChange={(v) => handleChange('bkashEnabled', v)}
                />
              </div>
              {paymentConfig.bkashEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-pink-500 py-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">bKash Number</label>
                    <input
                      type="tel"
                      value={paymentConfig.bkashNumber}
                      onChange={(e) => handleChange('bkashNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={paymentConfig.bkashAccountType}
                      onChange={(e) => handleChange('bkashAccountType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option>Personal</option>
                      <option>Merchant</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Nagad */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-orange-600">Nagad</p>
                  <p className="text-sm text-gray-600">Accept Nagad mobile wallet payments</p>
                </div>
                <ToggleSwitch
                  checked={paymentConfig.nagadEnabled}
                  onChange={(v) => handleChange('nagadEnabled', v)}
                />
              </div>
              {paymentConfig.nagadEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-orange-500 py-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nagad Number</label>
                    <input
                      type="tel"
                      value={paymentConfig.nagadNumber}
                      onChange={(e) => handleChange('nagadNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={paymentConfig.nagadAccountType}
                      onChange={(e) => handleChange('nagadAccountType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option>Personal</option>
                      <option>Merchant</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Rocket */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-purple-600">Rocket</p>
                  <p className="text-sm text-gray-600">Accept Rocket mobile wallet payments</p>
                </div>
                <ToggleSwitch
                  checked={paymentConfig.rocketEnabled}
                  onChange={(v) => handleChange('rocketEnabled', v)}
                />
              </div>
              {paymentConfig.rocketEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-purple-500 py-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rocket Number</label>
                    <input
                      type="tel"
                      value={paymentConfig.rocketNumber}
                      onChange={(e) => handleChange('rocketNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={paymentConfig.rocketAccountType}
                      onChange={(e) => handleChange('rocketAccountType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option>Personal</option>
                      <option>Merchant</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* iPay */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-blue-600">iPay</p>
                  <p className="text-sm text-gray-600">Accept iPay mobile wallet payments</p>
                </div>
                <ToggleSwitch
                  checked={paymentConfig.ipayEnabled}
                  onChange={(v) => handleChange('ipayEnabled', v)}
                />
              </div>
              {paymentConfig.ipayEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-blue-500 py-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">iPay Number</label>
                    <input
                      type="tel"
                      value={paymentConfig.ipayNumber}
                      onChange={(e) => handleChange('ipayNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UddoktaPay Gateway */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🌐</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">UddoktaPay Gateway</h3>
              <p className="text-sm text-gray-600">Automated payment processing via UddoktaPay API</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Enable UddoktaPay</p>
                <p className="text-sm text-gray-600">Process payments automatically through UddoktaPay gateway</p>
              </div>
              <ToggleSwitch
                checked={paymentConfig.uddoktaEnabled}
                onChange={(v) => handleChange('uddoktaEnabled', v)}
              />
            </div>

            {paymentConfig.uddoktaEnabled && (
              <div className="grid grid-cols-1 gap-4 pl-4 border-l-4 border-orange-500 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    value={paymentConfig.uddoktaApiKey}
                    onChange={(e) => handleChange('uddoktaApiKey', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your UddoktaPay API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
                  <input
                    type="url"
                    value={paymentConfig.uddoktaBaseUrl}
                    onChange={(e) => handleChange('uddoktaBaseUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Use sandbox URL for testing, switch to live URL for production
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Payment */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💳</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Card Payment</h3>
              <p className="text-sm text-gray-600">Accept credit/debit card payments</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Credit/Debit Card</p>
                <p className="text-sm text-gray-600">Accept Visa, Mastercard, etc.</p>
              </div>
              <ToggleSwitch
                checked={paymentConfig.cardPaymentEnabled}
                onChange={(v) => handleChange('cardPaymentEnabled', v)}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-xl">💡</span>
          <p className="text-sm text-blue-900">
            Cash on Delivery is always available. Toggle the methods above to show them at checkout.
          </p>
        </div>
      </form>
    </div>
  );
}
