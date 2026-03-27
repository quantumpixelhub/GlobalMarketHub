'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

interface MockPaymentClientProps {
  transactionId: string;
  gateway: string;
  initialAmount: string;
}

interface AccountStatusResponse {
  transactionId: string;
  invoiceId: string;
  gateway: string;
  amount: number;
  hasSavedAccount: boolean;
  savedMobileMasked: string | null;
}

const logoByGateway: Record<string, string> = {
  bkash: '/payment-logos/bkash.png',
  nagad: '/payment-logos/nagad.png',
};

const titleByGateway: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
};

function maskMobile(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

function parseAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export default function MockPaymentClient({ transactionId, gateway, initialAmount }: MockPaymentClientProps) {
  const normalizedGateway = gateway === 'nagad' ? 'nagad' : 'bkash';
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [hasSavedAccount, setHasSavedAccount] = useState(false);
  const [savedMobileMasked, setSavedMobileMasked] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState(transactionId || 'N/A');
  const [amount, setAmount] = useState(parseAmount(initialAmount));
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const logoSrc = useMemo(() => logoByGateway[normalizedGateway] || logoByGateway.bkash, [normalizedGateway]);
  const gatewayTitle = useMemo(() => titleByGateway[normalizedGateway] || 'bKash', [normalizedGateway]);

  useEffect(() => {
    const run = async () => {
      if (!transactionId) {
        setError('Missing transaction ID. Please restart payment from checkout.');
        setLoadingAccount(false);
        return;
      }

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(
          `/api/payment/mock?transactionId=${encodeURIComponent(transactionId)}&gateway=${encodeURIComponent(normalizedGateway)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Failed to load account details.');
        }

        const data: AccountStatusResponse = await res.json();
        setHasSavedAccount(Boolean(data.hasSavedAccount));
        setSavedMobileMasked(data.savedMobileMasked || null);
        setInvoiceId(data.invoiceId || transactionId);
        setAmount(Number(data.amount) || parseAmount(initialAmount));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load payment details.');
      } finally {
        setLoadingAccount(false);
      }
    };

    run();
  }, [transactionId, normalizedGateway, initialAmount]);

  const validate = (): boolean => {
    if (!password || password.length < 4) {
      setError('Please enter your account password.');
      return false;
    }

    if (!hasSavedAccount) {
      const digits = mobileNumber.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 14) {
        setError('Please enter a valid mobile number.');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          transactionId,
          gateway: normalizedGateway,
          mobileNumber: hasSavedAccount ? undefined : mobileNumber,
          password,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Payment submission failed. Please try again.');
      }

      setIsSuccess(true);
      setSuccessMessage(data.message || 'Payment Successful');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAccount) {
    return <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-700">Loading payment details...</div>;
  }

  if (isSuccess) {
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-emerald-700">Payment Successful</h1>
        <p className="text-gray-700 mt-2">{successMessage}</p>
        <p className="text-sm text-gray-500 mt-3">Invoice ID: {invoiceId}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <img src={logoSrc} alt={`${gatewayTitle} logo`} className="h-10 w-10 object-contain" />
          <div>
            <p className="text-xs text-gray-500">Invoice ID</p>
            <p className="font-semibold text-gray-900 break-all">{invoiceId}</p>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 text-right min-w-[180px]">
          <p className="text-xs text-gray-500">Payable Amount</p>
          <p className="text-3xl font-bold text-gray-900">৳ {amount.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!hasSavedAccount && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Mobile Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder={`Enter ${gatewayTitle} mobile number`}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
              autoComplete="tel"
              required
            />
          </div>
        )}

        {hasSavedAccount && (
          <p className="text-sm text-gray-600">Saved account detected: {savedMobileMasked || maskMobile(mobileNumber)}</p>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter account password"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-rose-600 text-white py-3 font-semibold hover:bg-rose-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting Payment...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}
