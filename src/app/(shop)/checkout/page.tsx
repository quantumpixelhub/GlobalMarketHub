'use client';

import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CheckoutForm } from '@/components/cart/CheckoutForm';
import { clearGuestCart, getGuestCartSummary } from '@/lib/guestCart';
import { useToast } from '@/components/ui/ToastProvider';

interface UserAddress {
  id: string;
  label: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  isDefault: boolean;
}

interface CartSummary {
  cartId: string;
  subtotal: number;
  itemCount: number;
  items: any[];
  totalQuantity: number;
}

interface GuestCheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  postCode: string;
  paymentMethod: string;
}

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addresses?: UserAddress[];
}

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestCreateAccount, setGuestCreateAccount] = useState(true);
  const { showToast } = useToast();

  const [guestData, setGuestData] = useState<GuestCheckoutData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    division: '',
    district: '',
    upazila: '',
    address: '',
    postCode: '',
    paymentMethod: 'uddoktapay',
  });

  const [newAddressData, setNewAddressData] = useState({
    label: 'Home',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    division: '',
    district: '',
    upazila: '',
    address: '',
    postCode: '',
    paymentMethod: 'uddoktapay',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setIsGuestCheckout(true);
          setCart(getGuestCartSummary());
          return;
        }

        setIsGuestCheckout(false);

        const profileRes = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        const userProfile: ProfileData = profileData.user || {};
        setAddresses(userProfile.addresses || []);
        setNewAddressData((prev) => ({
          ...prev,
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
        }));

        const cartRes = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cartData = await cartRes.json();
        setCart(cartData);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartId: cart?.cartId,
          shippingAddressId: data.addressId,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        showToast(errorData.error || 'Failed to create order', 'error');
        return;
      }

      const orderData = await orderRes.json();

      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderData.order.id,
          paymentMethod: data.paymentMethod,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        showToast(errorData.error || 'Failed to initiate payment', 'error');
        return;
      }

      const paymentData = await paymentRes.json();
      window.location.href = paymentData.paymentUrl;
    } catch (error) {
      console.error('Error during checkout:', error);
      showToast('Error processing order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGuestCheckout: true,
          createAccount: guestCreateAccount,
          guestInfo: {
            ...guestData,
            label: 'Guest Address',
          },
          guestCartItems: cart.items.map((item) => ({
            productId: item.productId || item.product?.id,
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
          })),
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        showToast(errorData.error || 'Failed to create guest order', 'error');
        return;
      }

      const orderData = await orderRes.json();

      if (orderData?.token) {
        localStorage.setItem('token', orderData.token);
      }

      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orderData?.token ? { Authorization: `Bearer ${orderData.token}` } : {}),
        },
        body: JSON.stringify({
          isGuestCheckout: true,
          orderId: orderData.order.id,
          paymentMethod: guestData.paymentMethod,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        showToast(errorData.error || 'Failed to initiate payment', 'error');
        return;
      }

      const paymentData = await paymentRes.json();
      clearGuestCart();
      window.location.href = paymentData.paymentUrl;
    } catch (error) {
      console.error('Error during guest checkout:', error);
      showToast('Error processing guest checkout', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAddressAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const addressRes = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newAddressData,
          isDefault: true,
        }),
      });

      if (!addressRes.ok) {
        const errorData = await addressRes.json();
        showToast(errorData.error || 'Failed to save address', 'error');
        return;
      }

      const createdAddressData = await addressRes.json();
      const createdAddress = createdAddressData.address;
      setAddresses((prev) => [...prev, createdAddress]);

      await handleSubmit({
        addressId: createdAddress.id,
        paymentMethod: newAddressData.paymentMethod,
      });
    } catch (error) {
      console.error('Error creating address:', error);
      showToast('Failed to create address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {isGuestCheckout && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold text-blue-900">Guest Checkout</p>
            <p className="text-sm text-blue-800 mt-1">
              You can place this order without registration. Create an account later for saved addresses and easier reorders.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!isGuestCheckout ? (
              addresses.length > 0 ? (
                <CheckoutForm
                  addresses={addresses}
                  loading={submitting}
                  onSubmit={handleSubmit}
                />
              ) : (
                <form onSubmit={handleCreateAddressAndCheckout} className="bg-white rounded-lg p-6 space-y-5">
                  <h2 className="text-xl font-bold">Add Shipping Address</h2>
                  <p className="text-sm text-gray-600">No saved shipping address found. Add one to continue your order.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="First Name" value={newAddressData.firstName} onChange={(e) => setNewAddressData((prev) => ({ ...prev, firstName: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input required placeholder="Last Name" value={newAddressData.lastName} onChange={(e) => setNewAddressData((prev) => ({ ...prev, lastName: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="email" placeholder="Email" value={newAddressData.email} onChange={(e) => setNewAddressData((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input required placeholder="Phone" value={newAddressData.phone} onChange={(e) => setNewAddressData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>

                  <input required placeholder="Street Address" value={newAddressData.address} onChange={(e) => setNewAddressData((prev) => ({ ...prev, address: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required placeholder="Division" value={newAddressData.division} onChange={(e) => setNewAddressData((prev) => ({ ...prev, division: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input required placeholder="District" value={newAddressData.district} onChange={(e) => setNewAddressData((prev) => ({ ...prev, district: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input required placeholder="Upazila" value={newAddressData.upazila} onChange={(e) => setNewAddressData((prev) => ({ ...prev, upazila: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input placeholder="Post Code" value={newAddressData.postCode} onChange={(e) => setNewAddressData((prev) => ({ ...prev, postCode: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Payment Method</label>
                    <select value={newAddressData.paymentMethod} onChange={(e) => setNewAddressData((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="uddoktapay">UddoktaPay</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="stripe">Credit/Debit Card</option>
                    </select>
                  </div>

                  <button type="submit" disabled={submitting || !cart?.items?.length} className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 font-semibold">
                    {submitting ? 'Processing...' : 'Save Address and Continue to Payment'}
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleGuestCheckout} className="bg-white rounded-lg p-6 space-y-5">
                <h2 className="text-xl font-bold">Delivery Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="First Name"
                    value={guestData.firstName}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    required
                    placeholder="Last Name"
                    value={guestData.lastName}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={guestData.email}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    required
                    placeholder="Phone"
                    value={guestData.phone}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <input
                  required
                  placeholder="Street Address"
                  value={guestData.address}
                  onChange={(e) => setGuestData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    required
                    placeholder="Division"
                    value={guestData.division}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, division: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    required
                    placeholder="District"
                    value={guestData.district}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, district: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    required
                    placeholder="Upazila"
                    value={guestData.upazila}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, upazila: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    placeholder="Post Code"
                    value={guestData.postCode}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, postCode: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <select
                    value={guestData.paymentMethod}
                    onChange={(e) => setGuestData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="uddoktapay">UddoktaPay</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="stripe">Credit/Debit Card</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={guestCreateAccount}
                    onChange={(e) => setGuestCreateAccount(e.target.checked)}
                  />
                  Create an account automatically for easier next orders
                </label>

                <button
                  type="submit"
                  disabled={submitting || !cart?.items?.length}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 font-semibold"
                >
                  {submitting ? 'Processing...' : 'Place Order and Continue to Payment'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>৳{(cart?.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%):</span>
                <span>৳{((cart?.subtotal || 0) * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>৳100</span>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-emerald-600">
                ৳{((cart?.subtotal || 0) + (cart?.subtotal || 0) * 0.05 + 100).toLocaleString()}
              </span>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Items in cart: {cart?.totalQuantity || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
