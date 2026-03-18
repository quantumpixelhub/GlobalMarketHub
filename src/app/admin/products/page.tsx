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
    id?: string;
    storeName: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
}

interface OptionItem {
  id: string;
  name: string;
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
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [sellers, setSellers] = useState<OptionItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: '',
    currentPrice: '',
    stock: '',
    categoryId: '',
    sellerId: '',
    mainImage: '',
  });

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

    const fetchDropdowns = async () => {
      try {
        const [catRes, sellerRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/sellers'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories((catData.categories || []).map((c: any) => ({ id: c.id, name: c.name })));
        }

        if (sellerRes.ok) {
          const sellerData = await sellerRes.json();
          setSellers((sellerData.sellers || []).map((s: any) => ({ id: s.id, name: s.storeName })));
        }
      } catch (error) {
        console.error('Error loading form options:', error);
      }
    };

    fetchDropdowns();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      originalPrice: '',
      currentPrice: '',
      stock: '',
      categoryId: categories[0]?.id || '',
      sellerId: sellers[0]?.id || '',
      mainImage: '',
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      description: (product as any).description || '',
      originalPrice: String(product.originalPrice || ''),
      currentPrice: String(product.currentPrice || ''),
      stock: String(product.stock || ''),
      categoryId: (product as any).categoryId || product.category?.id || '',
      sellerId: (product as any).sellerId || product.seller?.id || '',
      mainImage: (product as any).mainImage || '',
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login as admin');
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        originalPrice: Number(formData.originalPrice),
        currentPrice: Number(formData.currentPrice),
        stock: Number(formData.stock),
        categoryId: formData.categoryId,
        sellerId: formData.sellerId,
        mainImage: formData.mainImage,
      };

      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to save product');
        return;
      }

      alert(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowModal(false);

      const refreshed = await fetch('/api/products?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
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
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setSaving(false);
    }
  };

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
          onClick={openCreateModal}
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
                        onClick={() => openEditModal(product)}
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
          <form onSubmit={handleSaveProduct} className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required className="w-full border rounded px-3 py-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} required rows={4} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Price</label>
                <input type="number" min="1" value={formData.currentPrice} onChange={(e) => setFormData((p) => ({ ...p, currentPrice: e.target.value }))} required className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Original Price</label>
                <input type="number" min="1" value={formData.originalPrice} onChange={(e) => setFormData((p) => ({ ...p, originalPrice: e.target.value }))} required className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))} required className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Main Image URL</label>
                <input value={formData.mainImage} onChange={(e) => setFormData((p) => ({ ...p, mainImage: e.target.value }))} required className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))} required className="w-full border rounded px-3 py-2">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Seller</label>
                <select value={formData.sellerId} onChange={(e) => setFormData((p) => ({ ...p, sellerId: e.target.value }))} required className="w-full border rounded px-3 py-2">
                  <option value="">Select seller</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:bg-emerald-300">
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
