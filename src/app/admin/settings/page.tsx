'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your store configuration</p>
        </div>
        <button className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600">Save Changes</button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" defaultValue="eShopping" placeholder="Store Name" />
            <input className="border rounded px-3 py-2" defaultValue="BDT" placeholder="Currency" />
          </div>
          <textarea className="border rounded px-3 py-2 w-full mt-4" rows={4} placeholder="About Text" />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping</h2>
          <input type="number" className="border rounded px-3 py-2" defaultValue={50} />
          <p className="text-sm text-gray-500 mt-2">Free shipping threshold</p>
        </div>
      </div>
    </div>
  );
}
