import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { EVENT_TYPES, EventType, getClientIp, trackEvent } from '@/lib/eventTracker';

const ALLOWED_EVENT_TYPES: EventType[] = [
  EVENT_TYPES.PRODUCT_CLICK,
  EVENT_TYPES.PRODUCT_VIEW,
  EVENT_TYPES.ADD_TO_CART,
  EVENT_TYPES.PURCHASE,
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventTypeRaw = String(body?.eventType || '').toUpperCase();

    if (!ALLOWED_EVENT_TYPES.includes(eventTypeRaw as EventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const auth = await authenticate(request);
    const quantity = body?.quantity !== undefined ? Number(body.quantity) : undefined;

    await trackEvent({
      eventType: eventTypeRaw as EventType,
      userId: auth.success ? String(auth.data?.userId || '') : undefined,
      sessionId: body?.sessionId ? String(body.sessionId) : request.headers.get('x-session-id'),
      productId: body?.productId ? String(body.productId) : undefined,
      categoryId: body?.categoryId ? String(body.categoryId) : undefined,
      cartId: body?.cartId ? String(body.cartId) : undefined,
      orderId: body?.orderId ? String(body.orderId) : undefined,
      quantity: Number.isFinite(quantity) && quantity && quantity > 0 ? quantity : undefined,
      unitPrice: body?.unitPrice,
      totalValue: body?.totalValue,
      query: body?.query ? String(body.query) : undefined,
      source: body?.source ? String(body.source) : 'events_api',
      metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Track event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
