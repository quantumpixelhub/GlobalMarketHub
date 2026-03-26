import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const EVENT_TYPES = {
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_CLICK: 'PRODUCT_CLICK',
  ADD_TO_CART: 'ADD_TO_CART',
  PURCHASE: 'PURCHASE',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface TrackEventInput {
  eventType: EventType;
  userId?: string | null;
  sessionId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  cartId?: string | null;
  orderId?: string | null;
  quantity?: number | null;
  unitPrice?: number | string | Prisma.Decimal | null;
  totalValue?: number | string | Prisma.Decimal | null;
  query?: string | null;
  source?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function toDecimal(value?: number | string | Prisma.Decimal | null) {
  if (value === undefined || value === null) return undefined;
  return new Prisma.Decimal(value);
}

export async function trackEvent(input: TrackEventInput) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "UserEvent" (
        "id", "eventType", "userId", "sessionId", "productId", "categoryId", "cartId", "orderId",
        "quantity", "unitPrice", "totalValue", "query", "source", "metadata", "ipAddress", "userAgent"
      )
      VALUES (
        ${`evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`},
        ${input.eventType}::"EventType",
        ${input.userId || null},
        ${input.sessionId || null},
        ${input.productId || null},
        ${input.categoryId || null},
        ${input.cartId || null},
        ${input.orderId || null},
        ${input.quantity ?? null},
        ${toDecimal(input.unitPrice) || null},
        ${toDecimal(input.totalValue) || null},
        ${input.query || null},
        ${input.source || null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
        ${input.ipAddress || null},
        ${input.userAgent || null}
      )
    `;
  } catch (error) {
    // Analytics must not break checkout/search flows.
    console.error('Event tracking failed:', error);
  }
}

export function getClientIp(userAgentHeaders: Headers) {
  const forwarded = userAgentHeaders.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;

  const realIp = userAgentHeaders.get('x-real-ip');
  return realIp || null;
}
