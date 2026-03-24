'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

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
  variants?: ProductVariant[];
}

interface ProductVariant {
  id?: string;
  attributes?: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
}

interface VariantFormRow {
  attributeName: 'size' | 'color' | 'weight';
  attributeValue: string;
  price: string;
  stock: string;
  sku: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: { products: number };
}

interface OptionItem {
  id: string;
  name: string;
}

const LIVE_MAIN_CATEGORY_SLUGS = new Set([
  'fashion-apparel',
  'electronics-gadgets',
  'home-furniture-living',
  'beauty-personal-care',
  'food-grocery-beverages',
  'health-wellness',
  'sports-outdoor',
  'toys-kids-baby',
  'automotive-tools',
  'pet-supplies',
  'books-media-education',
  'tools-hardware-industrial',
  'office-business-stationery',
  'travel-luggage-lifestyle',
  'digital-products-services',
]);

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([]);
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
  const [variants, setVariants] = useState<VariantFormRow[]>([]);
  const { showToast } = useToast();

  const normalizeProduct = (product: any): Product => ({
    ...product,
    currentPrice: asNumber(product.currentPrice),
    originalPrice: asNumber(product.originalPrice),
    stock: asNumber(product.stock),
    rating: asNumber(product.rating),
    reviewCount: asNumber(product.reviewCount),
    seller: product.seller || { storeName: 'N/A' },
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant: any) => ({
          ...variant,
          price: asNumber(variant.price),
          stock: asNumber(variant.stock),
        }))
      : [],
  });

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/admin/categories', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const sorted = (data.categories || [])
            .filter((c: Category) => !c.parentId && LIVE_MAIN_CATEGORY_SLUGS.has(c.slug))
            .sort((a: Category, b: Category) => a.name.localeCompare(b.name));
          setCategories(sorted);
          setCategoryOptions(sorted.map((c: Category) => ({ id: c.id, name: c.name })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products for a specific category
  const fetchProductsByCategory = async (categoryId: string) => {
    try {
      setLoadingCategory(categoryId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/products?categoryId=${categoryId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const normalized = (data.products || []).map(normalizeProduct);
        
        // Merge with existing products
        setProducts((prev) => {
          const filtered = prev.filter((p) => p.category?.id !== categoryId);
          return [...filtered, ...normalized];
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingCategory(null);
    }
  };

  // Handle category expand/collapse
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Fetch products for this category
      fetchProductsByCategory(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Fetch sellers for dropdown
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await fetch('/api/sellers');
        if (res.ok) {
          const data = await res.json();
          setSellers((data.sellers || []).map((s: any) => ({ id: s.id, name: s.storeName })));
        }
      } catch (error) {
        console.error('Error loading sellers:', error);
      }
    };

    fetchSellers();
    setLoading(false);
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      originalPrice: '',
      currentPrice: '',
      stock: '',
      categoryId: categoryOptions[0]?.id || '',
      sellerId: sellers[0]?.id || '',
      mainImage: '',
    });
    setVariants([]);
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
    const mappedVariants = (product.variants || []).map((variant) => {
      const attrs = variant.attributes || {};
      const entry = Object.entries(attrs)[0] || ['size', ''];
      const normalizedName = (entry[0] || 'size').toLowerCase();
      const attributeName = (
        normalizedName === 'color' || normalizedName === 'weight' ? normalizedName : 'size'
      ) as VariantFormRow['attributeName'];

      return {
        attributeName,
        attributeValue: String(entry[1] || ''),
        price: String(variant.price ?? ''),
        stock: String(variant.stock ?? ''),
        sku: variant.sku || '',
      };
    });
    setVariants(mappedVariants);
    setShowModal(true);
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { attributeName: 'size', attributeValue: '', price: '', stock: '0', sku: '' },
    ]);
  };

  const updateVariantRow = (index: number, key: keyof VariantFormRow, value: string) => {
    setVariants((prev) => prev.map((variant, idx) => (idx === index ? { ...variant, [key]: value } : variant)));
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login as admin', 'error');
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
        variants: variants
          .filter((variant) => variant.attributeValue.trim() && variant.price.trim() && variant.sku.trim())
          .map((variant) => ({
            attributeName: variant.attributeName,
            attributeValue: variant.attributeValue.trim(),
            price: Number(variant.price),
            stock: Number(variant.stock || 0),
            sku: variant.sku.trim(),
          })),
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
        showToast(errorData.error || 'Failed to save product', 'error');
        return;
      }

      showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully', 'success');
      setShowModal(false);

      const refreshed = await fetch('/api/products?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        const normalized = (data.products || []).map(normalizeProduct);
        setProducts(normalized);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Error saving product', 'error');
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
          showToast('Product deleted successfully', 'success');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Error deleting product', 'error');
      }
    }
  };

  const getProductsForCategory = (categoryId: string): Product[] => {
    return products.filter((p) => p.category?.id === categoryId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog by category</p>
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
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No categories found
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryProducts = getProductsForCategory(category.id);
            const isExpanded = expandedCategories.has(category.id);
            const isLoading = loadingCategory === category.id;
            const productCount = isExpanded && !isLoading
              ? categoryProducts.length
              : (category._count?.products || 0);

            return (
              <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Category Header - Clickable */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-600 px-6 py-4 flex items-center justify-between hover:from-emerald-600 hover:to-emerald-700 transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight size={20} className="text-white flex-shrink-0" />
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-white">{category.name}</h2>
                      <p className="text-emerald-100 text-sm">
                        {isLoading ? 'Loading...' : `${productCount} product${productCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Products Table - Expanded */}
                {isExpanded && (
                  <div>
                    {isLoading ? (
                      <div className="px-6 py-4 text-center text-gray-500">
                        Loading products...
                      </div>
                    ) : categoryProducts.length === 0 ? (
                      <div className="px-6 py-4 text-center text-gray-500">
                        No products in this category
                      </div>
                    ) : (
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
                          {categoryProducts
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((product) => (
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Variants (Size / Color / Weight)</h3>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  <Plus size={16} />
                  Add Variant
                </button>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-gray-500">No variants added. Product-level price and stock will be used.</p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={`${variant.sku || 'variant'}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 border rounded p-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Type</label>
                        <select
                          value={variant.attributeName}
                          onChange={(e) => updateVariantRow(index, 'attributeName', e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="size">Size</option>
                          <option value="color">Color</option>
                          <option value="weight">Weight</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Value</label>
                        <input
                          value={variant.attributeValue}
                          onChange={(e) => updateVariantRow(index, 'attributeValue', e.target.value)}
                          placeholder="e.g. XL / Red / 500g"
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Price</label>
                        <input
                          type="number"
                          min="1"
                          value={variant.price}
                          onChange={(e) => updateVariantRow(index, 'price', e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => updateVariantRow(index, 'stock', e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Variant SKU</label>
                        <div className="flex gap-2">
                          <input
                            value={variant.sku}
                            onChange={(e) => updateVariantRow(index, 'sku', e.target.value)}
                            className="w-full border rounded px-2 py-2"
                            placeholder="e.g. SKU-SHIRT-XL-RED"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            aria-label="Remove variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
