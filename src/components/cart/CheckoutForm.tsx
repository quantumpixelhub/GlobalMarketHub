import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Smartphone,
  WalletCards,
} from 'lucide-react';

const PAYMENT_LOGO_URLS: Record<string, string> = {
  bkash: '/payment-logos/bkash.png',
  nagad: '/payment-logos/nagad.png',
};

interface Address {
  id: string;
  label: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  isDefault: boolean;
}

interface CheckoutFormProps {
  addresses: Address[];
  loading?: boolean;
  onSelectAddress?: (addressId: string) => void;
  onPaymentMethodChange?: (method: string) => void;
  initialDeliveryArea?: string;
  initialDeliverySpeed?: string;
  onDeliveryOptionsChange?: (options: { deliveryArea: string; deliverySpeed: string }) => void;
  onSubmit?: (data: any) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  addresses,
  loading = false,
  onSelectAddress,
  onPaymentMethodChange,
  initialDeliveryArea = 'inside-dhaka',
  initialDeliverySpeed = 'standard',
  onDeliveryOptionsChange,
  onSubmit,
}) => {
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [deliveryArea, setDeliveryArea] = useState(initialDeliveryArea);
  const [deliverySpeed, setDeliverySpeed] = useState(initialDeliverySpeed);
  const [logoLoadError, setLogoLoadError] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    onDeliveryOptionsChange?.({ deliveryArea, deliverySpeed });
  }, [deliveryArea, deliverySpeed, onDeliveryOptionsChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      addressId: selectedAddress,
      paymentMethod,
      deliveryArea,
      deliverySpeed,
    });
  };

  const renderPaymentIcon = (methodId: string) => {
    const logoUrl = PAYMENT_LOGO_URLS[methodId];
    if (logoUrl && !logoLoadError[methodId]) {
      return (
        <img
          src={logoUrl}
          alt={`${methodId} logo`}
          className="w-5 h-5 object-contain"
          onError={() => setLogoLoadError((prev) => ({ ...prev, [methodId]: true }))}
        />
      );
    }

    switch (methodId) {
      case 'bkash':
        return <Smartphone size={20} className="text-pink-600" />;
      case 'nagad':
        return <WalletCards size={20} className="text-amber-600" />;
      case 'stripe':
        return <CreditCard size={20} className="text-indigo-600" />;
      default:
        return <CreditCard size={20} className="text-gray-600" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
      {/* Delivery Options - PROMOTED TO TOP */}
      <div className="border-2 border-rose-200 bg-rose-50 rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          🚚 Delivery Options
          <span className="text-sm font-normal text-gray-600">(Required)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">📍 Delivery Area</label>
            <select
              value={deliveryArea}
              onChange={(e) => setDeliveryArea(e.target.value)}
              className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-600 focus:outline-none"
            >
              <option value="inside-dhaka">🏙️ Inside Dhaka</option>
              <option value="outside-dhaka">🚗 Outside Dhaka</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">⚡ Delivery Speed</label>
            <select
              value={deliverySpeed}
              onChange={(e) => setDeliverySpeed(e.target.value)}
              className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-600 focus:outline-none"
            >
              <option value="standard">📦 Standard (2-4 days) - ৳60-120</option>
              <option value="express">⚡ Express (24-48 hours) - ৳120-180</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-rose-700 mt-3 flex items-center gap-1">
          ℹ️ Choose your delivery preference. Final charge will show in order summary.
        </p>
      </div>

      {/* Shipping Address */}
      <div>
        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
        {addresses.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">No shipping address</p>
              <p className="text-sm text-yellow-700">Please add a delivery address first</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`block p-4 border-2 rounded cursor-pointer transition ${
                  selectedAddress === address.id
                    ? 'border-rose-600 bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddress === address.id}
                    onChange={(e) => {
                      setSelectedAddress(e.target.value);
                      onSelectAddress?.(e.target.value);
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold">{address.label}</p>
                    <p className="text-sm text-gray-600">{address.address}</p>
                    <p className="text-sm text-gray-600">
                      {address.upazila}, {address.district}, {address.division}
                    </p>
                    {address.isDefault && (
                      <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded inline-block mt-2">
                        Default Address
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <h2 className="text-xl font-bold mb-1">Select Payment Method</h2>
        <p className="text-sm text-gray-500 mb-4">Choose a secure payment option to complete your order.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'bkash', name: 'bKash', note: 'Mobile wallet' },
            { id: 'nagad', name: 'Nagad', note: 'Mobile wallet' },
            { id: 'stripe', name: 'Credit/Debit Card', note: 'Visa, Mastercard, Amex' },
          ].map((method) => (
            <label
              key={method.id}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                paymentMethod === method.id
                  ? 'border-rose-600 bg-rose-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    onPaymentMethodChange?.(e.target.value);
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6">{renderPaymentIcon(method.id)}</span>
                    <span>{method.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{method.note}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {paymentMethod === 'bkash' && 'You will be redirected to bKash secure payment page after clicking Proceed to Pay.'}
          {paymentMethod === 'nagad' && 'You will be redirected to Nagad secure payment page after clicking Proceed to Pay.'}
          {paymentMethod === 'stripe' && 'Enter your card details securely on the next step via encrypted card checkout.'}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedAddress || loading}
        className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
      >
        {loading ? 'Processing...' : 'Proceed to Pay'}
      </button>

      {/* Info Box */}
      <div className="bg-rose-50 border border-rose-200 rounded p-4 flex gap-3">
        <CheckCircle className="text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-rose-900">Order protection</p>
          <p className="text-sm text-rose-800">All transactions are secure and encrypted</p>
        </div>
      </div>
    </form>
  );
};
