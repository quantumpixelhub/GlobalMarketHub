'use client';

import React, { useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import FormModal from '@/components/admin/FormModal';
import Badge from '@/components/admin/Badge';

interface Category {
  id: string;
  name: string;
  products: number;
  status: 'Active' | 'Inactive';
  description?: string;
}

const initialCategories: Category[] = [
  { id: '1', name: 'Electronics', products: 4, status: 'Active', description: 'Electronic devices and gadgets' },
  { id: '2', name: 'Clothing', products: 3, status: 'Active', description: 'Apparel and fashion items' },
  { id: '3', name: 'Home & Kitchen', products: 3, status: 'Active', description: 'Home and kitchen products' },
  { id: '4', name: 'Sports & Outdoors', products: 3, status: 'Active', description: 'Sports equipment and outdoor gear' },
  { id: '5', name: 'Books & Media', products: 3, status: 'Active', description: 'Books, magazines, and media' },
  { id: '6', name: 'Health & Beauty', products: 4, status: 'Active', description: 'Health and beauty products' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreateClick = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    if (confirm(`Delete category "${category.name}"?`)) {
      setCategories(categories.filter((c) => c.id !== category.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id ? { ...c, name: formData.name, description: formData.description } : c
        )
      );
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        products: 0,
        status: 'Active',
      };
      setCategories([...categories, newCategory]);
    }

    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'products',
      label: 'Products',
      sortable: true,
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
        data={categories}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter category name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Enter category description"
            rows={3}
          />
        </div>
      </FormModal>
    </div>
  );
}
