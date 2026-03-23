'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface CategoryWithEmoji {
  id: string;
  name: string;
  slug: string;
  description?: string; // Contains emoji
  parentId?: string | null;
}

export const EmojiCategoryBrowser: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithEmoji[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const parentCategories = (data.categories || []).filter(
            (cat: CategoryWithEmoji) => !cat.parentId
          );
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products/${category.slug}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors group"
        >
          <span className="text-4xl flex-shrink-0">
            {category.description || '📦'}
          </span>
          <span className="font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
};
