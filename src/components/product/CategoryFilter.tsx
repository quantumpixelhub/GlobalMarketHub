import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min: number, max: number) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  minPrice = 0,
  maxPrice = 500000,
  onPriceChange,
}) => {
  const [showCategories, setShowCategories] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const mainCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  );

  const subcategoriesByParent = useMemo(() => {
    const groups: Record<string, Category[]> = {};

    categories.forEach((category) => {
      if (!category.parentId) return;
      if (!groups[category.parentId]) {
        groups[category.parentId] = [];
      }
      groups[category.parentId].push(category);
    });

    return groups;
  }, [categories]);

  const handleApplyPrice = () => {
    onPriceChange?.(localMin, localMax);
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Categories Section */}
      <div className="border-b">
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-semibold">Categories</span>
          <ChevronDown size={20} className={showCategories ? 'rotate-180' : ''} />
        </button>
        {showCategories && (
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => onCategoryChange?.('')}
              className={`block w-full text-left px-3 py-2 rounded ${
                !selectedCategory
                  ? 'bg-emerald-100 text-emerald-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {mainCategories.map((category) => {
              const subcategories = subcategoriesByParent[category.id] || [];

              return (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => onCategoryChange?.(category.slug)}
                    className={`block w-full text-left px-3 py-2 rounded ${
                      selectedCategory === category.slug
                        ? 'bg-emerald-100 text-emerald-700 font-semibold'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>

                  {subcategories.length > 0 && (
                    <div className="pl-5 space-y-1">
                      {subcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => onCategoryChange?.(subcategory.slug)}
                          className={`block w-full text-left px-3 py-1.5 rounded text-sm ${
                            selectedCategory === subcategory.slug
                              ? 'bg-emerald-100 text-emerald-700 font-semibold'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="border-b">
        <button
          onClick={() => setShowPrice(!showPrice)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-semibold">Price Range</span>
          <ChevronDown size={20} className={showPrice ? 'rotate-180' : ''} />
        </button>
        {showPrice && (
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Min Price (৳)</label>
              <input
                type="number"
                value={localMin}
                onChange={(e) => setLocalMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Max Price (৳)</label>
              <input
                type="number"
                value={localMax}
                onChange={(e) => setLocalMax(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleApplyPrice}
              className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Ratings Filter */}
      <div className="border-b px-4 py-3 space-y-2">
        <h3 className="font-semibold mb-3">Ratings</h3>
        {[5, 4, 3, 2, 1].map((rating) => (
          <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">
              {'⭐'.repeat(rating)} & up ({rating === 5 ? '500+' : '200+'})
            </span>
          </label>
        ))}
      </div>

      {/* Discount Filter */}
      <div className="px-4 py-3 space-y-2">
        <h3 className="font-semibold mb-3">Discount</h3>
        {['50% or more', '30-50%', '10-30%', 'Below 10%'].map((range) => (
          <label key={range} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">{range}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
