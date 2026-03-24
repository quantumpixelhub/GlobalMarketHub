import { redirect } from 'next/navigation';

interface CallbackPageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

function asSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export default function PaymentCallbackPage({ searchParams }: CallbackPageProps) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const single = asSingle(value);
    if (single) {
      params.set(key, single);
    }
  }

  const qs = params.toString();
  redirect(`/api/payment/callback${qs ? `?${qs}` : ''}`);
}
