'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/shared/Navigation';
import { ReviewSection } from '@/components/product/ReviewSection';
import { Heart, ChevronLeft, ChevronRight, ScanSearch, Package, ThumbsUp, ArrowLeft } from 'lucide-react';
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
  totalSold?: number;
  positiveReviews?: number;
  specifications: Record<string, string>;
  seller: {
    id: string;
    storeName: string;
    email: string;
    rating: number;
    reviewCount: number;
  };
  variants?: ProductVariant[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
}

interface RecommendedProduct {
  id: string;
  title: string;
  mainImage: string;
  currentPrice: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string | null;
}

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mediaTab, setMediaTab] = useState<'photos' | 'video'>('photos');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          const normalized: Product = {
            ...data.product,
            originalPrice: asNumber(data.product.originalPrice),
            currentPrice: asNumber(data.product.currentPrice),
            rating: asNumber(data.product.rating),
            reviewCount: asNumber(data.product.reviewCount),
            stock: asNumber(data.product.stock),
            totalSold: asNumber(data.product.totalSold),
            positiveReviews: asNumber(data.product.positiveReviews),
            seller: {
              ...data.product.seller,
              email: data.product.seller?.email || '',
              rating: asNumber(data.product.seller?.rating),
              reviewCount: asNumber(data.product.seller?.reviewCount),
            },
            variants: Array.isArray(data.product.variants)
              ? data.product.variants.map((variant: any) => ({
                  ...variant,
                  price: asNumber(variant.price),
                  stock: asNumber(variant.stock),
                }))
              : [],
          };
          setProduct(normalized);

          if (normalized.category?.id) {
            setLoadingRecommendations(true);
            try {
              const relatedRes = await fetch(`/api/products?categoryId=${normalized.category.id}&limit=8`);
              if (relatedRes.ok) {
                const relatedData = await relatedRes.json();
                const relatedItems = Array.isArray(relatedData?.products)
                  ? relatedData.products
                  : [];

                const normalizedRelated: RecommendedProduct[] = relatedItems
                  .filter((item: any) => item.id !== normalized.id)
                  .slice(0, 4)
                  .map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    mainImage: item.mainImage,
                    currentPrice: asNumber(item.currentPrice),
                    originalPrice: asNumber(item.originalPrice),
                    rating: asNumber(item.rating),
                    reviewCount: asNumber(item.reviewCount),
                  }));

                setRecommendedProducts(normalizedRelated);
              }
            } catch (relatedError) {
              console.error('Error fetching recommended products:', relatedError);
            } finally {
              setLoadingRecommendations(false);
            }
          }

          const firstInStockVariant = normalized.variants?.find((variant) => variant.stock > 0) || normalized.variants?.[0];
          if (firstInStockVariant?.attributes) {
            setSelectedAttributes(firstInStockVariant.attributes);
          }
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleAddToCart = async (redirectToCheckout = false) => {
    const currentProduct = product;
    if (!currentProduct) return;

    const selectedVariant = resolveSelectedVariant(currentProduct);
    const effectivePrice = selectedVariant?.price ?? currentProduct.currentPrice;
    const variantLabel = selectedVariant
      ? Object.entries(selectedVariant.attributes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : undefined;

    const token = localStorage.getItem('token');
    if (!token) {
      addToGuestCart(
        {
          id: currentProduct.id,
          title: variantLabel ? `${currentProduct.title} (${variantLabel})` : currentProduct.title,
          mainImage: currentProduct.mainImage,
          currentPrice: effectivePrice,
          variantLabel,
        },
        quantity,
        {
          variantId: selectedVariant?.id,
          variantLabel,
          cartKey: selectedVariant ? `${currentProduct.id}:${selectedVariant.id}` : currentProduct.id,
        }
      );
      showToast(`Added ${quantity} item(s) to cart as guest.`, 'success');
      setQuantity(1);
      if (redirectToCheckout) {
        window.location.href = '/checkout';
      }
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
          productId: currentProduct.id,
          quantity: quantity,
          variantId: selectedVariant?.id,
          priceSnapshot: effectivePrice,
        }),
      });

      if (res.ok) {
        showToast(`Added ${quantity} item(s) to cart.`, 'success');
        setQuantity(1);
        window.dispatchEvent(new Event('cart-updated'));
        if (redirectToCheckout) {
          window.location.href = '/checkout';
        }
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        addToGuestCart(
          {
            id: currentProduct.id,
            title: variantLabel ? `${currentProduct.title} (${variantLabel})` : currentProduct.title,
            mainImage: currentProduct.mainImage,
            currentPrice: effectivePrice,
            variantLabel,
          },
          quantity,
          {
            variantId: selectedVariant?.id,
            variantLabel,
            cartKey: selectedVariant ? `${currentProduct.id}:${selectedVariant.id}` : currentProduct.id,
          }
        );
        showToast('Session expired. Added to guest cart instead.', 'info');
        if (redirectToCheckout) {
          window.location.href = '/checkout';
        }
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to add to cart.', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      addToGuestCart(
        {
          id: currentProduct.id,
          title: variantLabel ? `${currentProduct.title} (${variantLabel})` : currentProduct.title,
          mainImage: currentProduct.mainImage,
          currentPrice: effectivePrice,
          variantLabel,
        },
        quantity,
        {
          variantId: selectedVariant?.id,
          variantLabel,
          cartKey: selectedVariant ? `${currentProduct.id}:${selectedVariant.id}` : currentProduct.id,
        }
      );
      showToast('Network issue. Added to guest cart instead.', 'info');
      if (redirectToCheckout) {
        window.location.href = '/checkout';
      }
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    const selectedVariantForBuyNow = resolveSelectedVariant(product);
    const buyNowPrice = selectedVariantForBuyNow?.price ?? product.currentPrice;
    const variantLabel = selectedVariantForBuyNow
      ? Object.values(selectedVariantForBuyNow.attributes || {}).join(' / ')
      : undefined;

    if (typeof window !== 'undefined') {
      const buyNowPayload = [
        {
          productId: product.id,
          quantity,
          price: buyNowPrice,
          title: variantLabel ? `${product.title} (${variantLabel})` : product.title,
          mainImage: product.mainImage,
          variantLabel,
        },
      ];

      sessionStorage.setItem('buy_now_checkout_item', JSON.stringify(buyNowPayload));
      window.location.href = '/checkout';
    }
  };

  const resolveSelectedVariant = (currentProduct: Product): ProductVariant | null => {
    const variants = currentProduct.variants || [];
    if (variants.length === 0) return null;

    const exact = variants.find((variant) =>
      Object.entries(selectedAttributes).every(([key, value]) => variant.attributes?.[key] === value)
    );

    return exact || variants[0] || null;
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
        <Navigation showCategoryLinks={false} />
        <div className="pt-6 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/90 border border-gray-200 px-4 py-2 shadow-sm">
            <div className="relative h-8 w-8" aria-hidden="true">
              <div className="absolute inset-0 rounded-full border-2 border-rose-200" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-600 animate-spin" />
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-orange-500 animate-spin [animation-duration:1.4s]" />
            </div>
            <span className="text-sm font-medium text-gray-600">Loading product...</span>
          </div>
        </div>
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full animate-pulse">
          <div className="mb-6">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="h-9 w-3/5 bg-gray-200 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div>
              <div className="grid grid-cols-[82px_1fr] gap-4">
                <div className="space-y-2">
                  <div className="h-20 w-full bg-gray-200 rounded-xl" />
                  <div className="h-20 w-full bg-gray-200 rounded-xl" />
                  <div className="h-20 w-full bg-gray-200 rounded-xl" />
                  <div className="h-20 w-full bg-gray-200 rounded-xl" />
                </div>
                <div className="h-[560px] w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)] animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <div className="h-9 w-11/12 bg-gray-200 rounded mb-4" />
              <div className="h-5 w-1/3 bg-gray-200 rounded mb-6" />

              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-40 bg-gray-200 rounded" />
                <div className="h-7 w-24 bg-gray-200 rounded" />
                <div className="h-7 w-16 bg-gray-200 rounded-full" />
              </div>

              <div className="space-y-3 mb-6">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-10 w-20 bg-gray-200 rounded-lg" />
                  <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                  <div className="h-10 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-11/12 bg-gray-200 rounded" />
                <div className="h-4 w-4/5 bg-gray-200 rounded" />
              </div>

              <div className="flex gap-3 mb-6">
                <div className="h-12 w-32 bg-gray-200 rounded-lg" />
                <div className="h-12 flex-1 bg-gray-200 rounded-lg" />
                <div className="h-12 flex-1 bg-gray-200 rounded-lg" />
              </div>

              <div className="h-28 w-full bg-gray-100 rounded-xl border border-gray-200" />
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-500">Loading product details, pricing, media, and variants...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation showCategoryLinks={false} />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-lg font-semibold text-gray-900">Product not found</p>
            <p className="text-sm text-gray-600 mt-1">This product may have been removed or is no longer active.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-white font-semibold hover:bg-rose-700"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <Link
                href="/products"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedVariant = resolveSelectedVariant(product);
  const effectivePrice = selectedVariant?.price ?? product.currentPrice;
  const effectiveStock = selectedVariant?.stock ?? product.stock;
  const effectiveSku = selectedVariant?.sku ?? product.sku;
  const discount = product.originalPrice > 0
    ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
    : 0;

  const variantGroups = (product.variants || []).reduce<Record<string, string[]>>((acc, variant) => {
    Object.entries(variant.attributes || {}).forEach(([key, value]) => {
      if (!acc[key]) acc[key] = [];
      if (!acc[key].includes(value)) {
        acc[key].push(value);
      }
    });
    return acc;
  }, {});

  const allImages = [product.mainImage, ...(product.images || [])].filter(Boolean);
  const selectedImageSrc = allImages[selectedImage] || product.mainImage;
  const parentCategories = categories.filter((cat) => !cat.parentId).slice(0, 8);
  const activeCategoryId = hoveredCategoryId || parentCategories[0]?.id || null;
  const activeSubcategories = activeCategoryId
    ? categories.filter((cat) => cat.parentId === activeCategoryId)
    : [];

  const showPreviousImage = () => {
    setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation showCategoryLinks={false} />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[88px_minmax(0,1fr)] gap-4">
          <div className="hidden lg:block">
            <div
              className="relative h-full"
              onMouseLeave={() => setHoveredCategoryId(null)}
            >
              <div className="w-[88px] rounded-2xl border border-gray-200 bg-gray-100 p-2 shadow-sm">
                <div className="space-y-2">
                  {parentCategories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onMouseEnter={() => setHoveredCategoryId(category.id)}
                      onFocus={() => setHoveredCategoryId(category.id)}
                      className={`w-full h-14 rounded-xl flex items-center justify-center text-2xl transition bg-rose-100 ${
                        activeCategoryId === category.id
                          ? 'border-2 border-rose-400 shadow-md'
                          : 'hover:border-rose-300 border border-transparent'
                      }`}
                      aria-label={category.name}
                    >
                      {category.icon || '📦'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`pointer-events-none absolute left-[96px] top-0 z-30 w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl transition-all duration-200 ${
                hoveredCategoryId ? 'pointer-events-auto opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}>
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {parentCategories.find((cat) => cat.id === activeCategoryId)?.name || 'Category'}
                  </p>
                </div>
                <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
                  {activeSubcategories.length === 0 ? (
                    <p className="text-xs text-gray-500">No sub-categories</p>
                  ) : (
                    activeSubcategories.map((sub) => {
                      const parent = parentCategories.find((cat) => cat.id === activeCategoryId);
                      return (
                        <Link
                          key={sub.id}
                          href={`/products/${parent?.slug || ''}/${sub.slug}`}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <span>{sub.icon || '📦'}</span>
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="grid grid-cols-[82px_1fr] gap-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="w-10 h-10 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} className="rotate-90" />
                </button>
                <div className="w-full space-y-2">
                  {allImages.slice(0, 6).map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setSelectedImage(idx);
                        setMediaTab('photos');
                      }}
                      className={`w-full rounded-xl overflow-hidden border-2 transition ${
                        selectedImage === idx ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${idx + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="w-10 h-10 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} className="rotate-90" />
                </button>
              </div>

              <div className="relative bg-gray-100 rounded-2xl overflow-hidden min-h-[560px] flex items-center justify-center">
                {mediaTab === 'photos' ? (
                  <img
                    src={selectedImageSrc}
                    alt={product.title}
                    className="w-full h-[560px] object-contain"
                  />
                ) : (
                  <div className="w-full h-[560px] flex items-center justify-center text-center px-6">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900 mb-2">Video preview will be available soon</p>
                      <p className="text-gray-600">You can still inspect detailed photos from multiple angles.</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center hover:bg-white transition"
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center hover:bg-white transition"
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute top-5 right-5 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleAddToWishlist}
                    className={`w-12 h-12 rounded-full shadow border flex items-center justify-center transition ${
                      isWishlisted
                        ? 'bg-red-100 text-red-600 border-red-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600'
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={22} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-white text-gray-600 border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition"
                    aria-label="Scan image"
                  >
                    <ScanSearch size={22} />
                  </button>
                </div>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-white/95 border border-gray-200 p-1 flex items-center gap-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMediaTab('photos')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${mediaTab === 'photos' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${mediaTab === 'video' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Video
                  </button>
                </div>
              </div>
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
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-rose-600">
                  ৳{effectivePrice.toLocaleString()}
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
              <p className="text-sm text-gray-600">SKU: {effectiveSku}</p>
            </div>

            {Object.keys(variantGroups).length > 0 && (
              <div className="mb-6 space-y-3">
                {Object.entries(variantGroups).map(([key, values]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-gray-700 capitalize mb-2">Select {key}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => {
                        const selected = selectedAttributes[key] === value;
                        return (
                          <button
                            key={`${key}-${value}`}
                            type="button"
                            onClick={() => setSelectedAttributes((prev) => ({ ...prev, [key]: value }))}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                              selected
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Stock Status */}
            <div className="mb-6">
              <p className={`text-sm font-semibold ${
                effectiveStock > 0 ? 'text-rose-600' : 'text-red-600'
              }`}>
                {effectiveStock > 0 ? `${effectiveStock} in stock` : 'Out of stock'}
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
              <div className="flex-1 grid grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={effectiveStock === 0}
                  className="bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 font-semibold"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={effectiveStock === 0}
                  className="bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 disabled:bg-gray-400 font-semibold"
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="group relative overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100/70 px-4 py-3 shadow-sm">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-200/40" />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm">
                    <Package size={18} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-rose-700 font-semibold">Total Sold</p>
                    <p className="text-2xl leading-7 font-extrabold text-rose-700">
                      {(product.totalSold || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="relative mt-2 text-xs text-gray-600">Delivered units completed successfully</p>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-100/70 px-4 py-3 shadow-sm">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-200/40" />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
                    <ThumbsUp size={18} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-orange-700 font-semibold">Positive Reviews</p>
                    <p className="text-2xl leading-7 font-extrabold text-orange-700">
                      {(product.positiveReviews || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="relative mt-2 text-xs text-gray-600">Approved ratings at 4 stars and above</p>
              </div>
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

        <div className="bg-white rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
            {product.category?.slug && (
              <Link
                href={`/products/${product.category.slug}`}
                className="text-sm font-semibold text-rose-700 hover:text-rose-800"
              >
                View more in {product.category.name}
              </Link>
            )}
          </div>

          {loadingRecommendations ? (
            <p className="text-sm text-gray-600">Loading recommendations...</p>
          ) : recommendedProducts.length === 0 ? (
            <p className="text-sm text-gray-600">No similar products found right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="block rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition overflow-hidden"
                >
                  <img
                    src={item.mainImage}
                    alt={item.title}
                    className="w-full h-44 object-cover bg-gray-100"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">{item.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold text-rose-700">৳{item.currentPrice.toLocaleString()}</span>
                      {item.originalPrice > item.currentPrice && (
                        <span className="text-xs text-gray-400 line-through">৳{item.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">⭐ {item.rating.toFixed(1)} ({item.reviewCount})</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
