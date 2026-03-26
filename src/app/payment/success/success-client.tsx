'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader } from 'lucide-react';

interface OrderDetails {
  id: string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  shippingAddress: string;
}

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<'checking' | 'confirmed' | 'pending' | 'failed'>('checking');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (5s polling)

    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch order';
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const verifyPayment = async () => {
      if (!transactionId) {
        setVerificationState('confirmed');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setVerificationState('pending');
          return;
        }

        const verifyRes = await fetch(`/api/payments?transactionId=${encodeURIComponent(transactionId)}&verify=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!verifyRes.ok) {
          setVerificationState('pending');
          return;
        }

        const verifyData = await verifyRes.json();
        const txStatus = String(verifyData?.transaction?.status || 'PENDING').toUpperCase();
        const orderPaymentStatus = String(verifyData?.transaction?.order?.paymentStatus || 'PENDING').toUpperCase();

        if (txStatus === 'SUCCESS' || orderPaymentStatus === 'SUCCESS') {
          setVerificationState('confirmed');
          await fetchOrder();
          if (interval) {
            clearInterval(interval);
          }
          return;
        }

        if (txStatus === 'FAILED' || orderPaymentStatus === 'FAILED') {
          setVerificationState('failed');
          setError('Payment could not be confirmed. Please contact support with your transaction reference.');
          if (interval) {
            clearInterval(interval);
          }
          return;
        }

        setVerificationState('pending');
      } catch {
        setVerificationState('pending');
      }
    };

    fetchOrder();
    verifyPayment();

    interval = setInterval(() => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        if (interval) {
          clearInterval(interval);
        }
        return;
      }

      verifyPayment();
    }, 5000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [orderId, transactionId]);

  const handleInvoice = async (download: boolean) => {
    if (!orderId) return;

    try {
      setInvoiceLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please sign in again to access your invoice.');
      }

      const endpoint = `/api/orders/${orderId}/invoice${download ? '?download=1' : ''}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `invoice-${orderId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open invoice.';
      setError(message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">Thank you for your purchase. Your payment has been confirmed.</p>

          {verificationState === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-900 text-sm">Payment confirmation is syncing from gateway. This page updates automatically.</p>
            </div>
          )}

          {/* Order Details */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800 text-sm">
                {error} - Please contact support with your transaction ID: <span className="font-mono font-bold">{transactionId}</span>
              </p>
            </div>
          ) : order ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Order Number:</span>
                  <span className="text-gray-900 font-mono font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Amount Paid:</span>
                  <span className="text-gray-900 font-bold">৳ {order.totalAmount.toFixed(2)}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Transaction ID:</span>
                    <span className="text-gray-900 font-mono text-xs font-bold truncate">{transactionId}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-700 font-medium block mb-1">Shipping To:</span>
                  <span className="text-gray-600 text-sm line-clamp-2">{order.shippingAddress}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="text-left space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>You'll receive an order confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>We'll start preparing your order for shipment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>You can track your order in your account</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {orderId && (
              <button
                onClick={() => handleInvoice(true)}
                disabled={invoiceLoading}
                className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {invoiceLoading ? 'Preparing Invoice...' : 'Download Invoice'}
              </button>
            )}
            {orderId && (
              <button
                onClick={() => handleInvoice(false)}
                disabled={invoiceLoading}
                className="block w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold py-3 rounded-lg transition border border-emerald-200"
              >
                View Invoice
              </button>
            )}
            <Link
              href={`/account/orders/${orderId}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              View Order Details
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Need help?{' '}
            <Link href="/support" className="text-blue-600 hover:underline font-medium">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
