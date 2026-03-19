import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [coupon, campaigns] = await Promise.all([
      prisma.marketingCoupon.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.marketingCampaign.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      coupon: coupon
        ? {
            id: coupon.id,
            code: coupon.code,
            discount: Number(coupon.discount),
            minOrder: Number(coupon.minOrder),
            expires: new Date(coupon.expiresAt).toLocaleDateString(),
            status: 'Active',
          }
        : null,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        badge: campaign.badge,
        discountText: campaign.discountText,
        startsAt: new Date(campaign.startsAt).toLocaleDateString(),
        endsAt: new Date(campaign.endsAt).toLocaleDateString(),
        status: 'Active',
      })),
    });
  } catch (error) {
    console.error('Marketing active GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing data' }, { status: 500 });
  }
}
