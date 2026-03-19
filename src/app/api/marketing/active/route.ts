import { NextResponse } from 'next/server';
import { getActiveCampaigns, getActiveCoupon } from '@/lib/marketingData';

export async function GET() {
  try {
    return NextResponse.json({
      coupon: getActiveCoupon(),
      campaigns: getActiveCampaigns(),
    });
  } catch (error) {
    console.error('Marketing active GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing data' }, { status: 500 });
  }
}
