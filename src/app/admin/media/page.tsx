'use client';

import React from 'react';

const mediaItems = [
  '/logo.png',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
];

export default function MediaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Media</h1>
        <p className="text-gray-600 mt-2">Manage product and brand assets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mediaItems.map((src, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-3">
            <img src={src} alt={`Media ${idx + 1}`} className="w-full h-36 object-cover rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
