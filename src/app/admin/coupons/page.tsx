'use client';

import React from 'react';

const coupons = [
  { code: 'SAVE10', discount: '10%', minOrder: '500', usage: '0/100', expires: '12/31/2026', status: 'Active' },
  { code: 'WELCOME20', discount: '20%', minOrder: '1000', usage: '5/50', expires: '11/30/2026', status: 'Active' },
];

export default function CouponsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Coupons</h1>
        <p className="text-gray-600 mt-2">Manage discount coupons</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Code</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Discount</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Min Order</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Usage</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Expires</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.code} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{coupon.code}</td>
                <td className="px-6 py-4">{coupon.discount}</td>
                <td className="px-6 py-4">${coupon.minOrder}</td>
                <td className="px-6 py-4">{coupon.usage}</td>
                <td className="px-6 py-4">{coupon.expires}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {coupon.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
