import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { createCampaign, listCampaigns } from '@/lib/marketingData';

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

    return NextResponse.json({ campaigns: listCampaigns() });
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
    const campaign = createCampaign({
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
      badge: String(body.badge || 'Campaign').trim(),
      discountText: String(body.discountText || 'Special offer').trim(),
      startsAt: String(body.startsAt || new Date().toLocaleDateString()),
      endsAt: String(body.endsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()),
      status: body.status || 'Active',
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Admin campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
