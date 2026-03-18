import Link from 'next/link';
import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import { CheckCircle2 } from 'lucide-react';

interface PaymentMockPageProps {
  searchParams?: {
    transactionId?: string;
    gateway?: string;
    amount?: string;
  };
}

export default function MockPaymentPage({ searchParams }: PaymentMockPageProps) {
  const transactionId = searchParams?.transactionId || 'N/A';
  const gateway = searchParams?.gateway || 'gateway';
  const amount = searchParams?.amount || '0';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={56} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Initiated</h1>
          <p className="text-gray-600 mb-8">
            Demo mode: payment has been initiated successfully.
          </p>

          <div className="text-left bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 mb-8">
            <p className="text-sm text-gray-700"><span className="font-semibold">Gateway:</span> {gateway}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Transaction ID:</span> {transactionId}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Amount:</span> ৳{Number(amount).toLocaleString()}</p>
          </div>

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
              View Account
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
