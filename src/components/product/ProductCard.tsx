"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
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
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  currentPrice,
  originalPrice,
  mainImage,
  rating,
  reviewCount,
  stock,
  isFeatured,
  seller,
  onAddToCart,
  onAddToWishlist,
}) => {
  const router = useRouter();
  const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  const isOutOfStock = stock === 0;
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);

  const goToProduct = () => {
    router.push(`/product/${id}`);
  };

  const handleWishlistClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (wishlistLoading) return;

    if (onAddToWishlist) {
      onAddToWishlist(id);
      setIsWishlisted(true);
      return;
    }

    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setWishlistLoading(true);

      if (isWishlisted) {
        const res = await fetch(`/api/users/wishlist?productId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok || res.status === 404) {
          setIsWishlisted(false);
          window.dispatchEvent(new Event('wishlist-updated'));
        }
        return;
      }

      const addRes = await fetch('/api/users/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id }),
      });

      if (addRes.ok || addRes.status === 400) {
        // 400 is treated as already in wishlist so the UI can still reflect saved state.
        setIsWishlisted(true);
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } catch {
      // Silent fallback to avoid interrupting product browsing if wishlist API fails.
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
      onClick={goToProduct}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProduct();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${title}`}
    >
      {/* Product Image */}
      <div className="relative bg-gray-100 overflow-hidden group">
        <div className="relative h-56 w-full">
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
            Featured
          </div>
        )}

        {/* Stock Status */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => handleWishlistClick(e as any)}
            className="bg-white/95 border border-gray-200 p-2 rounded-full shadow-sm hover:bg-red-50 cursor-pointer"
            title="Add to wishlist"
            disabled={wishlistLoading}
          >
            <Heart size={20} className={`text-red-500 ${isWishlisted ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Seller */}
        <p className="text-xs text-gray-500 mb-1">{seller.storeName}</p>

        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 hover:text-emerald-600">
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-600">৳{currentPrice.toLocaleString()}</span>
          {originalPrice > currentPrice && (
            <span className="text-sm text-gray-400 line-through">৳{originalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(id);
          }}
          disabled={isOutOfStock}
          className="w-full mt-3 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={18} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};
