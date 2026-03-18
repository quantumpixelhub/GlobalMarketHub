'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ReviewSection } from '@/components/product/ReviewSection';
import { Heart } from 'lucide-react';
import { addToGuestCart } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

interface Product {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  mainImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  specifications: Record<string, string>;
  seller: {
    id: string;
    storeName: string;
    email: string;
    rating: number;
    reviewCount: number;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!product) return;

      addToGuestCart(
        {
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: product.currentPrice,
        },
        quantity
      );
      showToast(`Added ${quantity} item(s) to cart as guest.`, 'success');
      setQuantity(1);
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity: quantity,
          priceSnapshot: product?.currentPrice,
        }),
      });

      if (res.ok) {
        showToast(`Added ${quantity} item(s) to cart.`, 'success');
        setQuantity(1);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleAddToWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to add to wishlist.', 'info');
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('/api/users/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
        }),
      });

      if (res.ok) {
        setIsWishlisted(true);
        showToast('Added to wishlist.', 'success');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg p-6">
          {/* Product Images */}
          <div>
            <div className="bg-gray-100 rounded-lg mb-4 overflow-hidden">
              <img
                src={product.images?.[selectedImage] || product.mainImage}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[product.mainImage, ...(product.images || [])].slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`View ${idx + 1}`}
                  className={`w-full h-20 object-cover cursor-pointer rounded ${
                    selectedImage === idx ? 'ring-2 ring-emerald-600' : ''
                  }`}
                  onClick={() => setSelectedImage(idx)}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < Math.round(product.rating) ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>
              <button
                onClick={handleAddToWishlist}
                className={`p-2 rounded-full ${
                  isWishlisted
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <Heart size={24} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-emerald-600">
                  ৳{product.currentPrice.toLocaleString()}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
                {discount > 0 && (
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                    -{discount}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Stock Status */}
            <div className="mb-6">
              <p className={`text-sm font-semibold ${
                product.stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-l border-r"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
              >
                Add to Cart
              </button>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Sold by</h3>
              <p className="font-semibold text-gray-800">{product.seller.storeName}</p>
              <p className="text-sm text-gray-600">{product.seller.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm">
                  {product.seller.rating.toFixed(1)} ({product.seller.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="bg-white rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-bold mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <p className="text-sm text-gray-600 capitalize">{key}</p>
                  <p className="font-semibold">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-6 mt-6">
          <ReviewSection
            productId={productId}
            reviews={[]}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
            isAuthenticated={!!localStorage.getItem('token')}
            onSubmitReview={async () => {
              // Refresh product data
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
