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
    <nav className="flex flex-col gap-2 items-center">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products/${category.slug}`}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white hover:bg-gray-100 transition-colors group shadow-sm border border-gray-100"
          title={category.name}
        >
          <span className="text-2xl flex-shrink-0">
            {category.description || '📦'}
          </span>
        </Link>
      ))}
    </nav>
  );
};
