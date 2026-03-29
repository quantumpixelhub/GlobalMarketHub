'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Clock3, RefreshCw } from 'lucide-react';

type VerificationState = 'checking' | 'pending' | 'success' | 'failed' | 'error';

export default function PaymentPendingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get('orderId') || '';
  const transactionId = searchParams.get('transactionId') || '';

  const [state, setState] = useState<VerificationState>('checking');
  const [message, setMessage] = useState('Checking your payment confirmation...');

  const maxAttempts = 36;
  const pollIntervalMs = 5000;

  const canPoll = useMemo(() => Boolean(transactionId), [transactionId]);

  useEffect(() => {
    if (!canPoll) {
      setState('error');
      setMessage('Transaction ID missing. Please contact support with your order number.');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const verifyOnce = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) {
            setState('error');
            setMessage('Please log in again to verify payment status.');
          }
          return;
        }

        const response = await fetch(`/api/payments?transactionId=${encodeURIComponent(transactionId)}&verify=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (!cancelled && (response.status === 401 || response.status === 403)) {
            setState('error');
            setMessage('Authorization failed while verifying payment. Please sign in and check again.');
            return;
          }
          throw new Error('Verification request failed');
        }

        const data = await response.json();
        const txStatus = String(data?.transaction?.status || 'PENDING').toUpperCase();
        const orderPaymentStatus = String(data?.transaction?.order?.paymentStatus || 'PENDING').toUpperCase();

        if (txStatus === 'SUCCESS' || orderPaymentStatus === 'SUCCESS') {
          if (cancelled) return;
          setState('success');
          setMessage('Payment confirmed. Redirecting to confirmation page...');
          router.replace(`/payment/success?orderId=${encodeURIComponent(orderId)}&transactionId=${encodeURIComponent(transactionId)}`);
          return;
        }

        if (txStatus === 'FAILED' || orderPaymentStatus === 'FAILED') {
          if (cancelled) return;
          setState('failed');
          setMessage('Payment failed or was cancelled. Redirecting...');
          router.replace('/payment/failure?reason=payment_verification_failed');
          return;
        }

        if (!cancelled) {
          setState('pending');
          setMessage('Waiting for gateway confirmation. This usually takes a few seconds...');
        }
      } catch {
        if (!cancelled) {
          setState('pending');
          setMessage('Gateway confirmation is still in progress. Please keep this page open.');
        }
      }
    };

    verifyOnce();

    const interval = setInterval(() => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (!cancelled) {
          setState('error');
          setMessage('Verification is taking longer than expected. Please refresh or check your orders page.');
        }
        return;
      }

      verifyOnce();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [canPoll, orderId, router, transactionId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            {(state === 'checking' || state === 'pending') && <Loader2 className="h-14 w-14 text-teal-500 animate-spin" />}
            {state === 'error' && <RefreshCw className="h-14 w-14 text-red-500" />}
            {state === 'failed' && <Clock3 className="h-14 w-14 text-red-500" />}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification In Progress</h1>
          <p className="text-gray-600 mb-4">{message}</p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 text-left text-sm text-teal-900">
            <p><span className="font-semibold">Order ID:</span> {orderId || 'N/A'}</p>
            <p className="break-all"><span className="font-semibold">Transaction ID:</span> {transactionId || 'N/A'}</p>
          </div>

          <div className="space-y-3">
            <Link
              href={orderId ? `/account/orders/${orderId}` : '/account'}
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Check Order Status
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
