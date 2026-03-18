export interface GuestCartProduct {
  id: string;
  title: string;
  mainImage: string;
  currentPrice: number;
}

export interface GuestCartItem {
  id: string;
  product: GuestCartProduct;
  productId: string;
  quantity: number;
  priceSnapshot: number;
}

export interface GuestCartSummary {
  cartId: string;
  items: GuestCartItem[];
  subtotal: number;
  itemCount: number;
  totalQuantity: number;
}

const GUEST_CART_KEY = 'guest_cart_v1';

function readGuestCartItems(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCartItems(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function getGuestCartSummary(): GuestCartSummary {
  const items = readGuestCartItems();
  const subtotal = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);

  return {
    cartId: 'guest-cart',
    items,
    subtotal,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function addToGuestCart(product: GuestCartProduct, quantity: number = 1): GuestCartSummary {
  const items = readGuestCartItems();
  const existing = items.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: `guest-item-${product.id}-${Date.now()}`,
      product,
      productId: product.id,
      quantity,
      priceSnapshot: product.currentPrice,
    });
  }

  writeGuestCartItems(items);
  return getGuestCartSummary();
}

export function updateGuestCartItemQuantity(cartItemId: string, quantity: number): GuestCartSummary {
  const items = readGuestCartItems();
  const updated = items.map((item) =>
    item.id === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item
  );

  writeGuestCartItems(updated);
  return getGuestCartSummary();
}

export function removeFromGuestCart(cartItemId: string): GuestCartSummary {
  const items = readGuestCartItems().filter((item) => item.id !== cartItemId);
  writeGuestCartItems(items);
  return getGuestCartSummary();
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}
