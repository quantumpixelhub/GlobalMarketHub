'use client';

import React from 'react';

export default function PaymentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-600 mt-2">Configure payment methods and gateways</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">UddoktaPay Gateway</h2>
          <p className="text-gray-600 mb-4">Automated payment processing via UddoktaPay API</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" placeholder="API Key" />
            <input className="border rounded px-3 py-2" placeholder="API Base URL" defaultValue="https://sandbox.uddoktapay.com/api/checkout-v2" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Mobile Wallets</h2>
          <p className="text-gray-600 mb-4">Accept payments via local mobile wallet services</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-3 py-2" placeholder="bKash Number" defaultValue="01913512342" />
            <input className="border rounded px-3 py-2" placeholder="Nagad Number" defaultValue="01913512342" />
            <input className="border rounded px-3 py-2" placeholder="Rocket Number" defaultValue="01913512342" />
            <input className="border rounded px-3 py-2" placeholder="iPay Number" defaultValue="01913512342" />
          </div>
        </div>
      </div>
    </div>
  );
}
