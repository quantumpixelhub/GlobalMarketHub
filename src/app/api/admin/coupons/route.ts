import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

const couponStatusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'EXPIRED'> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Expired: 'EXPIRED',
};

const reverseCouponStatusMap: Record<string, 'Active' | 'Inactive' | 'Expired'> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired',
};

const formatCoupon = (coupon: any) => ({
  id: coupon.id,
  code: coupon.code,
  discount: Number(coupon.discount),
  minOrder: Number(coupon.minOrder),
  usage: { used: coupon.usedCount, total: coupon.totalUsage },
  expires: new Date(coupon.expiresAt).toLocaleDateString(),
  status: reverseCouponStatusMap[coupon.status] || 'Inactive',
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

    const coupons = await prisma.marketingCoupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons: coupons.map(formatCoupon) });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
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
    const coupon = await prisma.marketingCoupon.create({
      data: {
        code: String(body.code || '').toUpperCase(),
        discount: Number(body.discount || 0),
        minOrder: Number(body.minOrder || 0),
        totalUsage: Number(body.totalUsage || 100),
        expiresAt: body.expires ? new Date(body.expires) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: couponStatusMap[body.status] || 'ACTIVE',
      },
    });

    return NextResponse.json({ coupon: formatCoupon(coupon) }, { status: 201 });
  } catch (error) {
    console.error('Admin coupons POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
