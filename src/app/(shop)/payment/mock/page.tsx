import { Navigation } from '@/components/shared/Navigation';
import { Footer } from '@/components/shared/Footer';
import MockPaymentClient from './payment-client';

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
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation showCategoryLinks={false} />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <MockPaymentClient
          transactionId={searchParams?.transactionId || ''}
          gateway={String(searchParams?.gateway || 'bkash').toLowerCase()}
          initialAmount={searchParams?.amount || '0'}
        />
      </div>
      <Footer />
    </div>
  );
}
