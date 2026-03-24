import Link from 'next/link';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CheckCircle2, CreditCard, Smartphone, ShieldCheck } from 'lucide-react';

interface PaymentMockPageProps {
  searchParams?: {
    transactionId?: string;
    gateway?: string;
    amount?: string;
    orderId?: string;
    mode?: string;
    merchantNumber?: string;
    gatewayDisplay?: string;
  };
}

export default function MockPaymentPage({ searchParams }: PaymentMockPageProps) {
  const transactionId = searchParams?.transactionId || 'N/A';
  const gateway = searchParams?.gateway || 'gateway';
  const gatewayDisplay = searchParams?.gatewayDisplay || gateway;
  const amount = searchParams?.amount || '0';
  const orderId = searchParams?.orderId || 'N/A';
  const mode = searchParams?.mode || 'mock';
  const merchantNumber = searchParams?.merchantNumber || 'Not configured';
  const isWalletMode = mode === 'wallet';
  const amountNumber = Number(amount) || 0;

  const accentClass = isWalletMode
    ? 'bg-rose-600 text-white'
    : 'bg-sky-600 text-white';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`px-6 py-5 ${accentClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-90">Secure Checkout</p>
                  <h1 className="text-2xl font-bold mt-1">
                    {isWalletMode ? `Pay with ${gatewayDisplay}` : 'Card Payment'}
                  </h1>
                </div>
                {isWalletMode ? <Smartphone size={30} /> : <CreditCard size={30} />}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Amount to pay</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">৳{amountNumber.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Order ID: {orderId}</p>
              </div>

              {isWalletMode ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-rose-900 mb-2">Enter wallet PIN on your wallet app</p>
                  <p className="text-sm text-rose-800 mb-3">
                    Send payment from your {gatewayDisplay} account to merchant wallet number below.
                  </p>
                  <div className="bg-white border border-rose-200 rounded-lg p-3 space-y-1">
                    <p className="text-sm"><span className="font-semibold">Merchant Wallet:</span> {merchantNumber}</p>
                    <p className="text-sm"><span className="font-semibold">Transaction Ref:</span> {transactionId}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="font-semibold text-sky-900 mb-2">Card payment initiated</p>
                  <p className="text-sm text-sky-800">Use your card details in the secured card gateway screen to finish this payment.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
                >
                  Cancel
                </Link>
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  {isWalletMode ? 'I Have Paid' : 'Continue'}
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-blue-600" size={20} />
              <p className="font-semibold text-gray-900">Payment Summary</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gateway</span>
                <span className="font-semibold text-gray-900">{gatewayDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-semibold text-gray-900 text-right break-all">{transactionId}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-blue-700">৳{amountNumber.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5" />
                <p>All transactions are encrypted and tracked by order reference for secure verification.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
