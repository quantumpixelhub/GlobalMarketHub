import { NextRequest, NextResponse } from 'next/server';
import { getFrequentlyBoughtTogether, getSimilarProducts } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

function parseLimit(value: string | null, fallback: number, min = 1, max = 20) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const similarLimit = parseLimit(searchParams.get('similarLimit'), 8);
    const fbtLimit = parseLimit(searchParams.get('fbtLimit'), 6);

    const [similarProducts, frequentlyBoughtTogether] = await Promise.all([
      getSimilarProducts(productId, similarLimit),
      getFrequentlyBoughtTogether(productId, fbtLimit),
    ]);

    return NextResponse.json(
      {
        productId,
        similarProducts,
        frequentlyBoughtTogether,
        counts: {
          similarProducts: similarProducts.length,
          frequentlyBoughtTogether: frequentlyBoughtTogether.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
