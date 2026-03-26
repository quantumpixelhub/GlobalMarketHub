import React from 'react';
import { ProductCard } from './ProductCard';
import type { RankingMetricContext } from '@/lib/rankingMetricsClient';

interface Product {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  mainImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  seller: {
    id: string;
    storeName: string;
  };
  sourceType?: 'LOCAL' | 'DOMESTIC' | 'INTERNATIONAL';
  sourcePlatform?: string;
  externalUrl?: string;
  lastSyncedAt?: string;
  discountVerified?: boolean;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  rankingMetricContext?: RankingMetricContext;
  columns?: 2 | 3 | 4 | 5;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onAddToWishlist,
  rankingMetricContext,
  columns = 4,
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-${columns === 2 ? 2 : columns === 3 ? 3 : columns === 5 ? 5 : 4} gap-4`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-80" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridClass[columns]} gap-4`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          rankingMetricContext={rankingMetricContext}
          onAddToCart={onAddToCart}
          onAddToWishlist={onAddToWishlist}
        />
      ))}
    </div>
  );
};
