import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

const campaignStatusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'ENDED'> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Scheduled: 'SCHEDULED',
  Ended: 'ENDED',
};

const reverseCampaignStatusMap: Record<string, 'Active' | 'Inactive' | 'Scheduled' | 'Ended'> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SCHEDULED: 'Scheduled',
  ENDED: 'Ended',
};

const formatCampaign = (campaign: any) => ({
  id: campaign.id,
  name: campaign.name,
  description: campaign.description,
  badge: campaign.badge,
  discountText: campaign.discountText,
  startsAt: new Date(campaign.startsAt).toLocaleDateString(),
  endsAt: new Date(campaign.endsAt).toLocaleDateString(),
  status: reverseCampaignStatusMap[campaign.status] || 'Inactive',
});

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns: campaigns.map(formatCampaign) });
  } catch (error) {
    console.error('Admin campaigns GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
        badge: String(body.badge || 'Campaign').trim(),
        discountText: String(body.discountText || 'Special offer').trim(),
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: campaignStatusMap[body.status] || 'ACTIVE',
      },
    });

    return NextResponse.json({ campaign: formatCampaign(campaign) }, { status: 201 });
  } catch (error) {
    console.error('Admin campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
