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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { campaignId } = await params;
    const body = await request.json();
    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.badge !== undefined && { badge: body.badge }),
        ...(body.discountText !== undefined && { discountText: body.discountText }),
        ...(body.startsAt !== undefined && { startsAt: new Date(body.startsAt) }),
        ...(body.endsAt !== undefined && { endsAt: new Date(body.endsAt) }),
        ...(body.status !== undefined && { status: campaignStatusMap[body.status] || 'ACTIVE' }),
      },
    });

    return NextResponse.json({ campaign: formatCampaign(updated) });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    console.error('Admin campaigns PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { campaignId } = await params;
    await prisma.marketingCampaign.delete({ where: { id: campaignId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    console.error('Admin campaigns DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
