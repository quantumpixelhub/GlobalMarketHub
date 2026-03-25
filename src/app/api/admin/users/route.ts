import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

const permissionKeys = [
  'canUseAdminPanel',
  'manageDashboard',
  'manageProducts',
  'manageOrders',
  'manageCategories',
  'manageCampaigns',
  'manageCoupons',
  'manageUsers',
  'manageReviews',
  'manageMedia',
  'manageNotifications',
  'managePayments',
  'manageSettings',
] as const;

type PermissionKey = (typeof permissionKeys)[number];
type PermissionPayload = Partial<Record<PermissionKey, boolean>>;

function sanitizePermissions(input: unknown): PermissionPayload {
  if (!input || typeof input !== 'object') return {};
  const raw = input as Record<string, unknown>;
  const parsed: PermissionPayload = {};
  for (const key of permissionKeys) {
    if (typeof raw[key] === 'boolean') {
      parsed[key] = raw[key] as boolean;
    }
  }
  return parsed;
}

function fullAccessPermissions(): Record<PermissionKey, boolean> {
  return permissionKeys.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<PermissionKey, boolean>);
}

async function authorizeAdmin(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success || !auth.data?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.data.userId as string },
    select: {
      id: true,
      role: true,
      adminPermission: {
        select: {
          manageUsers: true,
        },
      },
    },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Backward compatibility: old admins without explicit permission row remain super admins.
  if (user.adminPermission && !user.adminPermission.manageUsers) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          adminPermission: {
            select: {
              canUseAdminPanel: true,
              manageDashboard: true,
              manageProducts: true,
              manageOrders: true,
              manageCategories: true,
              manageCampaigns: true,
              manageCoupons: true,
              manageUsers: true,
              manageReviews: true,
              manageMedia: true,
              manageNotifications: true,
              managePayments: true,
              manageSettings: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const userId = String(body?.userId || '');
    const role = typeof body?.role === 'string' ? body.role.toUpperCase() : undefined;
    const permissions = sanitizePermissions(body?.permissions);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'You cannot change your own role or permissions' }, { status: 400 });
    }

    const nextRole = role && ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(role)
      ? role
      : targetUser.role;

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: nextRole as any,
      },
    });

    if (Object.keys(permissions).length > 0 || role === 'ADMIN') {
      const defaultPermissions = nextRole === 'ADMIN' || nextRole === 'SUPER_ADMIN'
        ? fullAccessPermissions()
        : {};

      const mergedPermissions = {
        ...defaultPermissions,
        ...permissions,
      };

      await prisma.adminPermission.upsert({
        where: { userId },
        update: mergedPermissions,
        create: {
          userId,
          ...mergedPermissions,
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        adminPermission: {
          select: {
            canUseAdminPanel: true,
            manageDashboard: true,
            manageProducts: true,
            manageOrders: true,
            manageCategories: true,
            manageCampaigns: true,
            manageCoupons: true,
            manageUsers: true,
            manageReviews: true,
            manageMedia: true,
            manageNotifications: true,
            managePayments: true,
            manageSettings: true,
          },
        },
      },
    });

    return NextResponse.json({ message: 'User updated', user: updated });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await authorizeAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = String(searchParams.get('userId') || '');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
