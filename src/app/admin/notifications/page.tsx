'use client';

import React from 'react';

const notifications = [
  { title: 'Low Stock Alert', message: '3 products are below low-stock threshold', level: 'Warning' },
  { title: 'New Order', message: 'You received a new order from customer', level: 'Info' },
  { title: 'Payment Gateway', message: 'Stripe configuration updated successfully', level: 'Success' },
];

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        <p className="text-gray-600 mt-2">Track system and store alerts</p>
      </div>

      <div className="space-y-4">
        {notifications.map((item) => (
          <div key={item.title} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{item.level}</span>
            </div>
            <p className="text-gray-600">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
