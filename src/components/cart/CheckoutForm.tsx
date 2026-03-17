import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

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
  onSubmit?: (data: any) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  addresses,
  loading = false,
  onSelectAddress,
  onPaymentMethodChange,
  onSubmit,
}) => {
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('uddoktapay');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      addressId: selectedAddress,
      paymentMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
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
                    ? 'border-emerald-600 bg-emerald-50'
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
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded inline-block mt-2">
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
        <h2 className="text-xl font-bold mb-4">Payment Method</h2>
        <div className="space-y-3">
          {[
            { id: 'uddoktapay', name: 'UddoktaPay', icon: '💳' },
            { id: 'bkash', name: 'bKash', icon: '📱' },
            { id: 'nagad', name: 'Nagad', icon: '📱' },
            { id: 'stripe', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'cod', name: 'Cash on Delivery', icon: '🚚' },
          ].map((method) => (
            <label
              key={method.id}
              className={`block p-4 border-2 rounded cursor-pointer transition ${
                paymentMethod === method.id
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    onPaymentMethodChange?.(e.target.value);
                  }}
                />
                <span className="text-xl">{method.icon}</span>
                <span className="font-semibold">{method.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedAddress || loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3">
        <CheckCircle className="text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-900">Order protection</p>
          <p className="text-sm text-blue-800">All transactions are secure and encrypted</p>
        </div>
      </div>
    </form>
  );
};
