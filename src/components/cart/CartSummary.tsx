import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const LOCAL_TAX_RATE = 0;
const IMPORTED_TAX_RATE = 0.08;

const SHIPPING_MATRIX: Record<string, Record<string, number>> = {
  'inside-dhaka': { standard: 60, express: 120 },
  'outside-dhaka': { standard: 120, express: 180 },
};

interface CartItem {
  id: string;
  product: {
    id: string;
    title: string;
    mainImage: string;
    currentPrice: number;
    variantLabel?: string;
    sourceType?: 'LOCAL' | 'IMPORTED';
  };
  variantLabel?: string;
  quantity: number;
  priceSnapshot: number;
}

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  onRemoveItem?: (cartItemId: string) => void;
  onUpdateQuantity?: (cartItemId: string, quantity: number) => void;
  onCheckout?: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  subtotal,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}) => {
  const importedSubtotal = items.reduce((sum, item) => {
    const lineTotal = Number(item.priceSnapshot) * Number(item.quantity || 1);
    return item.product?.sourceType === 'IMPORTED' ? sum + lineTotal : sum;
  }, 0);

  const localSubtotal = Math.max(0, subtotal - importedSubtotal);
  const localTax = localSubtotal * LOCAL_TAX_RATE;
  const importedTax = importedSubtotal * IMPORTED_TAX_RATE;
  const tax = localTax + importedTax;

  const shipping = items.length > 0
    ? (SHIPPING_MATRIX['inside-dhaka']?.standard ?? 100)
    : 0;

  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link href="/products" className="text-emerald-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {/* Items List */}
      <div className="divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex gap-4">
            {/* Product Image */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={item.product.mainImage}
                alt={item.product.title}
                fill
                className="object-cover rounded"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <Link
                href={`/product/${item.product.id}`}
                className="font-semibold hover:text-emerald-600 line-clamp-2"
              >
                {item.product.title}
              </Link>
              <p className="text-emerge-600 font-bold mt-1">
                ৳{item.priceSnapshot.toLocaleString()}
              </p>
              {(item.variantLabel || item.product?.variantLabel) && (
                <p className="text-xs text-gray-500 mt-1">
                  Variant: {item.variantLabel || item.product.variantLabel}
                </p>
              )}
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Item Total */}
            <div className="text-right w-20">
              <p className="font-bold text-lg">
                ৳{(item.priceSnapshot * item.quantity).toLocaleString()}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemoveItem?.(item.id)}
              className="text-red-500 hover:bg-red-50 p-2 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax (Imported 8%):</span>
          <span>৳{tax.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping:</span>
          <span>৳{shipping.toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span className="text-emerald-600">৳{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={() => onCheckout?.()}
        className="w-full bg-emerald-600 text-white py-3 hover:bg-emerald-700 transition-colors font-semibold"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};
