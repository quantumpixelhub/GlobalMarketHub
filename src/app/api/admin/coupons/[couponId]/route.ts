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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { couponId } = await params;
    const body = await request.json();
    const updated = await prisma.marketingCoupon.update({
      where: { id: couponId },
      data: {
        ...(body.code !== undefined && { code: String(body.code).toUpperCase() }),
        ...(body.discount !== undefined && { discount: Number(body.discount) }),
        ...(body.minOrder !== undefined && { minOrder: Number(body.minOrder) }),
        ...(body.totalUsage !== undefined && { totalUsage: Number(body.totalUsage) }),
        ...(body.expires !== undefined && { expiresAt: new Date(body.expires) }),
        ...(body.status !== undefined && { status: couponStatusMap[body.status] || 'ACTIVE' }),
      },
    });

    return NextResponse.json({ coupon: formatCoupon(updated) });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { couponId } = await params;
    await prisma.marketingCoupon.delete({ where: { id: couponId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
