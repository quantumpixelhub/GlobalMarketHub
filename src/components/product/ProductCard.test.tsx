import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductCard } from '@/components/product/ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    currentPrice: 1000,
    originalPrice: 1500,
    mainImage: '/test-image.jpg',
    rating: 4.5,
    reviewCount: 10,
    stock: 5,
    isFeatured: false,
    seller: { storeName: 'Test Seller' },
  };

  it('renders product title', () => {
    render(
      <ProductCard
        {...mockProduct}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('displays current price', () => {
    render(
      <ProductCard
        {...mockProduct}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    expect(screen.getByText(/৳1,000/)).toBeInTheDocument();
  });

  it('shows discount badge when on sale', () => {
    render(
      <ProductCard
        {...mockProduct}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    // Should show 33% discount (1500 - 1000) / 1500
    expect(screen.getByText(/-33%/)).toBeInTheDocument();
  });

  it('displays seller name', () => {
    render(
      <ProductCard
        {...mockProduct}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    expect(screen.getByText('Test Seller')).toBeInTheDocument();
  });

  it('shows in stock status', () => {
    render(
      <ProductCard
        {...mockProduct}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    expect(screen.getByText('In stock')).toBeInTheDocument();
  });

  it('shows out of stock status when stock is 0', () => {
    render(
      <ProductCard
        {...mockProduct}
        stock={0}
        onAddToCart={() => {}}
        onAddToWishlist={() => {}}
      />
    );
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
});
