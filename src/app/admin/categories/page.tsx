'use client';

import React from 'react';

const categories = [
  { name: 'Electronics', products: 4, status: 'Active' },
  { name: 'Clothing', products: 3, status: 'Active' },
  { name: 'Home & Kitchen', products: 3, status: 'Active' },
  { name: 'Sports & Outdoors', products: 3, status: 'Active' },
  { name: 'Books & Media', products: 3, status: 'Active' },
  { name: 'Health & Beauty', products: 4, status: 'Active' },
];

export default function CategoriesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
        <p className="text-gray-600 mt-2">Manage product categories</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Category</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Products</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.name} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{category.name}</td>
                <td className="px-6 py-4">{category.products}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {category.status}
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
