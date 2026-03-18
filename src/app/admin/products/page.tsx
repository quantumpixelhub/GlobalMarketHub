'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  stock: number;
  rating: number;
  reviewCount: number;
  seller: {
    storeName: string;
  };
}

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch('/api/products?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const normalized = (data.products || []).map((product: any) => ({
            ...product,
            currentPrice: asNumber(product.currentPrice),
            originalPrice: asNumber(product.originalPrice),
            stock: asNumber(product.stock),
            rating: asNumber(product.rating),
            reviewCount: asNumber(product.reviewCount),
            seller: product.seller || { storeName: 'N/A' },
          }));
          setProducts(normalized);
        } else if (res.status === 403) {
          alert('Admin access required');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          setProducts(products.filter(p => p.id !== productId));
          alert('Product deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Title</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Price</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Stock</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Rating</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Seller</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{product.title}</td>
                  <td className="px-6 py-4 text-gray-600">৳{product.currentPrice.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1">
                      ⭐ {product.rating.toFixed(1)} ({product.reviewCount})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.seller?.storeName || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <p className="text-gray-600 mb-4">
              {editingProduct
                ? 'This feature is in development. Use API route for now.'
                : 'This feature is in development. Use API route for now.'}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
