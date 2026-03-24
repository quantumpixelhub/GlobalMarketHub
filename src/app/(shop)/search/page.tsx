'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { addToGuestCart } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

type SortMode = 'best_price' | 'trust_seller' | 'most_reviews' | 'highest_rated' | 'best_value';

interface SearchListing {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  mainImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  sourceType?: 'LOCAL' | 'DOMESTIC' | 'INTERNATIONAL';
  sourcePlatform?: string;
  externalUrl?: string;
  lastSyncedAt?: string;
  discountVerified?: boolean;
  seller: {
    id: string;
    storeName: string;
  };
}

interface SearchResponse {
  sections?: {
    localInventory: SearchListing[];
    domesticSellers: SearchListing[];
    internationalSellers: SearchListing[];
  };
  results?: SearchListing[];
  sortMode?: SortMode;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    sections?: {
      localInventory: { total: number; pages: number; hasNext: boolean; hasPrev: boolean };
      domesticSellers: { total: number; pages: number; hasNext: boolean; hasPrev: boolean };
      internationalSellers: { total: number; pages: number; hasNext: boolean; hasPrev: boolean };
    };
  };
  sourceStats?: {
    domesticByPlatform: Record<string, number>;
    internationalByPlatform: Record<string, number>;
    coverage?: string;
    errors?: string[];
    generatedAt?: string;
    fromCache?: boolean;
    stale?: boolean;
  };
}

const PAGE_SIZE = 24;
const CLIENT_CACHE_TTL_MS = 60 * 1000;

type CachedSearchEntry = {
  createdAt: number;
  data: SearchResponse;
};

const hasAnyResults = (data: SearchResponse) => {
  if (data.sections) {
    return (
      (data.sections.localInventory?.length || 0) > 0 ||
      (data.sections.domesticSellers?.length || 0) > 0 ||
      (data.sections.internationalSellers?.length || 0) > 0
    );
  }
  return (data.results?.length || 0) > 0;
};

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [localProducts, setLocalProducts] = useState<SearchListing[]>([]);
  const [domesticProducts, setDomesticProducts] = useState<SearchListing[]>([]);
  const [internationalProducts, setInternationalProducts] = useState<SearchListing[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('best_value');
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page') || '1')));
  const [goToPageInput, setGoToPageInput] = useState('');
  const [pagination, setPagination] = useState<SearchResponse['pagination']>();
  const [sourceStats, setSourceStats] = useState<SearchResponse['sourceStats']>();
  const [loading, setLoading] = useState(true);
  const pageCacheRef = useRef<Map<string, CachedSearchEntry>>(new Map());
  const requestSeqRef = useRef(0);
  const { showToast } = useToast();

  const setPageWithUrl = (targetPage: number) => {
    const safePage = Math.max(1, targetPage);
    setPage(safePage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(safePage));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setPageWithUrl(1);
    setGoToPageInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sortMode]);

  useEffect(() => {
    const pageFromUrl = Math.max(1, Number(searchParams.get('page') || '1'));
    if (pageFromUrl !== page) {
      setPage(pageFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const requestId = ++requestSeqRef.current;
    const controller = new AbortController();

    const fetchResults = async () => {
      if (!query) {
        setLocalProducts([]);
        setDomesticProducts([]);
        setInternationalProducts([]);
        setLoading(false);
        return;
      }
      
      try {
        const cacheKey = `${query}|${sortMode}|${page}|${PAGE_SIZE}`;
        const cached = pageCacheRef.current.get(cacheKey);
        const cachedIsFresh = Boolean(cached && Date.now() - cached.createdAt < CLIENT_CACHE_TTL_MS);
        if (cached && cachedIsFresh && hasAnyResults(cached.data)) {
          setPagination(cached.data.pagination);
          setSourceStats(cached.data.sourceStats);
          if (cached.data.sections) {
            setLocalProducts(cached.data.sections.localInventory || []);
            setDomesticProducts(cached.data.sections.domesticSellers || []);
            setInternationalProducts(cached.data.sections.internationalSellers || []);
            setLoading(false);
            return;
          }
        }

        setLoading(true);
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&sortMode=${encodeURIComponent(sortMode)}&page=${page}&limit=${PAGE_SIZE}`,
          { cache: 'no-store', signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Search request failed with status ${res.status}`);
        }
        const data: SearchResponse = await res.json();

        // Ignore stale responses from older requests when query/page changed.
        if (requestId !== requestSeqRef.current) {
          return;
        }

        if (hasAnyResults(data)) {
          pageCacheRef.current.set(cacheKey, { createdAt: Date.now(), data });
        } else {
          pageCacheRef.current.delete(cacheKey);
        }
        setPagination(data.pagination);
        setSourceStats(data.sourceStats);

        if (data.sections) {
          setLocalProducts(data.sections.localInventory || []);
          setDomesticProducts(data.sections.domesticSellers || []);
          setInternationalProducts(data.sections.internationalSellers || []);
          return;
        }

        setLocalProducts(data.results || []);
        setDomesticProducts([]);
        setInternationalProducts([]);
        setPagination(undefined);
        setSourceStats(undefined);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Search error:', error);
        setLocalProducts([]);
        setDomesticProducts([]);
        setInternationalProducts([]);
        setPagination(undefined);
        setSourceStats(undefined);
      } finally {
        if (requestId === requestSeqRef.current) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [query, sortMode, page]);

  const hasNextPage = Boolean(
    pagination?.sections?.localInventory?.hasNext ||
    pagination?.sections?.domesticSellers?.hasNext ||
    pagination?.sections?.internationalSellers?.hasNext
  );
  const hasPrevPage = page > 1;
  const knownPages = [
    pagination?.sections?.localInventory?.pages ?? 0,
    pagination?.sections?.domesticSellers?.pages ?? 0,
    pagination?.sections?.internationalSellers?.pages ?? 0,
  ];
  const totalPages = Math.max(1, ...knownPages, hasNextPage ? page + 1 : page);
  const pageWindowSize = 7;
  const halfWindow = Math.floor(pageWindowSize / 2);
  let startPage = Math.max(1, page - halfWindow);
  let endPage = Math.min(totalPages, startPage + pageWindowSize - 1);
  if (endPage - startPage + 1 < pageWindowSize) {
    startPage = Math.max(1, endPage - pageWindowSize + 1);
  }
  const pageButtons = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);

  const goToPage = () => {
    const parsed = Number(goToPageInput);
    if (!Number.isFinite(parsed)) return;
    const safePage = Math.max(1, Math.min(totalPages, Math.floor(parsed)));
    setPageWithUrl(safePage);
    setGoToPageInput('');
  };

  const renderPaginationControls = (position: 'top' | 'bottom') => (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setPageWithUrl(page - 1)}
        disabled={loading || !hasPrevPage}
        className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50"
      >
        Previous
      </button>
      {startPage > 1 && (
        <>
          <button
            type="button"
            onClick={() => setPageWithUrl(1)}
            disabled={loading}
            className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50"
          >
            1
          </button>
          {startPage > 2 && <span className="px-1 text-gray-500">...</span>}
        </>
      )}

      {pageButtons.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => setPageWithUrl(pageNumber)}
          disabled={loading}
          className={`px-3 py-2 rounded border disabled:opacity-50 ${
            pageNumber === page
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          {pageNumber}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-gray-500">...</span>}
          <button
            type="button"
            onClick={() => setPageWithUrl(totalPages)}
            disabled={loading}
            className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <span className="text-gray-600">Page {page} / {totalPages}</span>
      <button
        type="button"
        onClick={() => setPageWithUrl(page + 1)}
        disabled={loading || !hasNextPage}
        className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50"
      >
        Next
      </button>

      <div className="ml-2 flex items-center gap-2">
        <label htmlFor={`goto-page-${position}`} className="text-gray-600">Go to</label>
        <input
          id={`goto-page-${position}`}
          type="number"
          min={1}
          max={totalPages}
          value={goToPageInput}
          onChange={(e) => setGoToPageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToPage();
          }}
          className="w-20 px-2 py-2 border border-gray-300 rounded"
          placeholder="Page"
        />
        <button
          type="button"
          onClick={goToPage}
          disabled={loading || !goToPageInput}
          className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50"
        >
          Go
        </button>
      </div>
    </div>
  );

  const handleAddToCart = async (productId: string) => {
    try {
      const product = localProducts.find((p) => p.id === productId);
      if (!product) return;

      const token = localStorage.getItem('token');
      if (!token) {
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
        showToast('Added to cart as guest. Login for easier checkout next time.', 'success');
        return;
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        showToast('Product added to cart.', 'success');
        window.dispatchEvent(new Event('cart-updated'));
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
        showToast('Session expired. Added to guest cart instead.', 'info');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to add product to cart.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      const product = localProducts.find((p) => p.id === productId);
      if (product) {
        addToGuestCart({
          id: product.id,
          title: product.title,
          mainImage: product.mainImage,
          currentPrice: Number(product.currentPrice),
        });
      }
      showToast('Network issue. Added to guest cart instead.', 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600 mb-8">
          {query && `Showing results for "${query}"`}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label htmlFor="sort-mode" className="text-sm text-gray-700 font-medium">
            Sort by:
          </label>
          <select
            id="sort-mode"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="best_value">Best Value</option>
            <option value="best_price">Best Price</option>
            <option value="trust_seller">Trust Seller</option>
            <option value="most_reviews">Most Reviews</option>
            <option value="highest_rated">Highest Rated</option>
          </select>
          <div className="ml-auto">{renderPaginationControls('top')}</div>
        </div>

        {!!sourceStats && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold text-gray-700">Source Coverage</h3>
              <div className="text-xs text-gray-500">
                {sourceStats.generatedAt ? `Updated ${new Date(sourceStats.generatedAt).toLocaleTimeString()}` : 'Updated just now'}
                {sourceStats.fromCache ? ' (cache)' : ' (live)'}
                {sourceStats.stale ? ' - stale' : ''}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">Domestic</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sourceStats.domesticByPlatform || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([platform, count]) => (
                      <span key={`dom-${platform}`} className="px-2 py-1 rounded bg-blue-50 text-blue-800 text-xs border border-blue-200">
                        {platform}: {count}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">International</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sourceStats.internationalByPlatform || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([platform, count]) => (
                      <span key={`intl-${platform}`} className="px-2 py-1 rounded bg-blue-50 text-blue-800 text-xs border border-blue-200">
                        {platform}: {count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Local Inventory</h2>
            <span className="text-sm text-gray-500">{pagination?.sections?.localInventory?.total ?? localProducts.length} items</span>
          </div>
          <ProductGrid
            products={localProducts}
            loading={loading}
            onAddToCart={handleAddToCart}
            columns={4}
          />
        </section>

        <section className="mb-10 rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-800">Domestic Sellers</h2>
              <p className="text-xs text-blue-700">Bangladesh platforms and local marketplaces</p>
            </div>
            <span className="text-sm text-gray-500">{pagination?.sections?.domesticSellers?.total ?? domesticProducts.length} items</span>
          </div>
          <ProductGrid products={domesticProducts} loading={loading} columns={4} />
        </section>

        <section className="mb-10 rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-800">International Sellers</h2>
              <p className="text-xs text-blue-700">Cross-border global marketplaces</p>
            </div>
            <span className="text-sm text-gray-500">{pagination?.sections?.internationalSellers?.total ?? internationalProducts.length} items</span>
          </div>
          <ProductGrid products={internationalProducts} loading={loading} columns={4} />
        </section>

        <div className="mb-10 flex justify-center">
          {renderPaginationControls('bottom')}
        </div>

        {!loading && localProducts.length === 0 && domesticProducts.length === 0 && internationalProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-4">No products found</p>
            <p className="text-gray-400">Try searching for different keywords</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
