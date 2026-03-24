'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';

export default function PaymentFailureClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Payment was declined. Please try again or contact support.';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Failure Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-8">Unfortunately, your payment could not be processed.</p>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-800 text-sm">
              {decodeURIComponent(reason)}
            </p>
          </div>

          {/* Common Reasons */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Common reasons for payment failure:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Insufficient funds in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Incorrect card or account details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Account or card has been blocked/disabled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Network connection issue during payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Transaction was cancelled by you</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Back to Shopping
            </Link>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Support Info */}
          <div className="bg-blue-50 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Need Help?
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              If you continue to experience issues, our support team is here to help.
            </p>
            <Link
              href="/support"
              className="inline-block font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Contact Support →
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Your selected items are still in your cart. You can complete the checkout whenever you're ready.
          </p>
        </div>
      </div>
    </div>
  );
}
