'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, Plus } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import FormModal from '@/components/admin/FormModal';
import Badge from '@/components/admin/Badge';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number; children: number };
  status: 'Active' | 'Inactive';
  description?: string;
  image?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '', parentId: '' });
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const mapped = (data.categories || []).map((category: any) => ({
          ...category,
          status: 'Active' as const,
        }));
        setCategories(mapped);

        const parentIds = mapped
          .filter((category: Category) => !category.parentId)
          .map((category: Category) => category.id);
        setExpandedParentIds(new Set(parentIds));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const parentOptions = useMemo(
    () => categories.filter((category) => !category.parentId && category.id !== editingCategory?.id),
    [categories, editingCategory]
  );

  const groupedCategories = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]));

    const parents = categories
      .filter((category) => !category.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const grouped = parents.flatMap((parent) => {
      const children = categories
        .filter((category) => category.parentId === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!expandedParentIds.has(parent.id)) {
        return [parent];
      }
      return [parent, ...children];
    });

    const orphans = categories
      .filter((category) => category.parentId && !byId.has(String(category.parentId)))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...grouped, ...orphans];
  }, [categories, expandedParentIds]);

  const childCountByParent = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((category) => {
      if (!category.parentId) return;
      counts[category.parentId] = (counts[category.parentId] || 0) + 1;
    });
    return counts;
  }, [categories]);

  const toggleParent = (parentId: string) => {
    setExpandedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const handleCreateClick = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', image: '', parentId: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (category: Category) => {
    if (confirm(`Delete category "${category.name}"?`)) {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to delete category');
        return;
      }

      setCategories(categories.filter((c) => c.id !== category.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const normalizedName = formData.name.trim().toLowerCase();
    const isDuplicate = categories.some(
      (category) =>
        category.name.trim().toLowerCase() === normalizedName &&
        category.id !== editingCategory?.id
    );

    if (isDuplicate) {
      alert('Duplicate category name is not allowed.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
      parentId: formData.parentId || null,
    };

    if (editingCategory) {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to update category');
        return;
      }

      const updated = { ...data.category, status: 'Active' as const };
      setCategories(categories.map((c) => (c.id === editingCategory.id ? updated : c)));
    } else {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to create category');
        return;
      }

      setCategories([{ ...data.category, status: 'Active' as const }, ...categories]);
    }

    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Category',
      render: (_: unknown, item: Category) => (
        <div className="flex items-center gap-2">
          {item.parentId ? (
            <span className="text-gray-400">↳</span>
          ) : childCountByParent[item.id] ? (
            <button
              onClick={() => toggleParent(item.id)}
              className="text-gray-500 hover:text-gray-700"
              title={expandedParentIds.has(item.id) ? 'Collapse sub-categories' : 'Expand sub-categories'}
            >
              {expandedParentIds.has(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <button
            type="button"
            onClick={() => {
              if (!item.parentId && childCountByParent[item.id]) {
                toggleParent(item.id);
              }
            }}
            className={item.parentId ? 'text-gray-700 cursor-default' : 'font-semibold text-gray-900 text-left'}
          >
            {item.name}
          </button>
        </div>
      ),
      sortable: true,
    },
    {
      key: '_count.products',
      label: 'Products',
      render: (_: unknown, item: Category) => item._count?.products ?? 0,
      sortable: false,
    },
    {
      key: 'parent',
      label: 'Parent',
      render: (_: unknown, item: Category) => item.parent?.name || 'Main Category',
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => <Badge label={status} color="green" />,
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Categories"
        subtitle="Manage product categories"
        icon={FolderTree}
        action={{
          label: 'Add Category',
          onClick: handleCreateClick,
          icon: Plus,
        }}
      />

      <DataTable
        columns={columns}
        data={groupedCategories}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <FormModal
        isOpen={isModalOpen}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="Enter category name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
          >
            <option value="">Main Category</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 resize-none"
            placeholder="Enter category description"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            placeholder="https://..."
          />
        </div>
      </FormModal>
    </div>
  );
}
