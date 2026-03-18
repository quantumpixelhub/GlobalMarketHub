'use client';

import React from 'react';

const reviews = [
  { user: 'Rahim', product: 'MacBook Pro 14-inch M3', rating: 5, status: 'Published' },
  { user: 'Karim', product: 'Wireless Earbuds Pro ANC', rating: 4, status: 'Published' },
  { user: 'Ayesha', product: 'Vitamin C Brightening Serum', rating: 5, status: 'Published' },
];

export default function ReviewsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reviews</h1>
        <p className="text-gray-600 mt-2">Moderate customer reviews</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800">{review.user}</p>
              <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">Product: {review.product}</p>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {review.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
