import Link from 'next/link';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={56} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isWalletMode ? 'Complete Your Payment' : 'Payment Initiated'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isWalletMode
              ? `Send payment from your ${gatewayDisplay} wallet to the merchant number below.`
              : 'Demo mode: payment has been initiated successfully.'}
          </p>

          <div className="text-left bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 mb-8">
            <p className="text-sm text-gray-700"><span className="font-semibold">Gateway:</span> {gatewayDisplay}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Transaction ID:</span> {transactionId}</p>
            {isWalletMode && <p className="text-sm text-gray-700"><span className="font-semibold">Order ID:</span> {orderId}</p>}
            <p className="text-sm text-gray-700"><span className="font-semibold">Amount:</span> ৳{Number(amount).toLocaleString()}</p>
            {isWalletMode && (
              <p className="text-sm text-gray-900 font-semibold">
                Merchant Wallet Number: {merchantNumber}
              </p>
            )}
          </div>

          {isWalletMode && (
            <div className="text-left bg-amber-50 rounded-lg border border-amber-200 p-4 mb-8">
              <p className="text-sm text-amber-900 font-semibold mb-2">How to pay</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-amber-900">
                <li>Open your {gatewayDisplay} app.</li>
                <li>Choose Send Money / Payment.</li>
                <li>Enter merchant number: {merchantNumber}.</li>
                <li>Enter exact amount: ৳{Number(amount).toLocaleString()}.</li>
                <li>Use reference: {transactionId} and confirm payment.</li>
              </ol>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
            >
              {isWalletMode ? 'I Have Paid' : 'View Account'}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
