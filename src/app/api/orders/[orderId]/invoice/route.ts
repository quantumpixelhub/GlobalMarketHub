import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function currency(value: number): string {
  return `BDT ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: Date): string {
  try {
    return new Date(value).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

function getShippingText(shippingAddress: unknown): string {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return 'Address unavailable';
  }

  const data = shippingAddress as Record<string, unknown>;
  const name = `${String(data.firstName || '').trim()} ${String(data.lastName || '').trim()}`.trim();
  const addressParts = [
    String(data.address || '').trim(),
    String(data.upazila || '').trim(),
    String(data.district || '').trim(),
    String(data.division || '').trim(),
    String(data.postCode || '').trim(),
  ].filter(Boolean);
  const phone = String(data.phone || '').trim();

  return [name, ...addressParts, phone ? `Phone: ${phone}` : ''].filter(Boolean).join('<br/>');
}

export async function GET(request: NextRequest, context: { params: { orderId: string } }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String(auth.data?.userId || '');
    const orderId = String(context.params.orderId || '').trim();
    const shouldDownload = new URL(request.url).searchParams.get('download') === '1';

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
        payment: {
          select: {
            gatewayName: true,
            gatewayTransactionId: true,
            status: true,
            completedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = order.items
      .map((item) => {
        const unitPrice = Number(item.price);
        const lineTotal = unitPrice * item.quantity;
        return `
          <tr>
            <td style=\"padding:10px;border-bottom:1px solid #eee;\">${escapeHtml(item.product?.title || 'Product')}</td>
            <td style=\"padding:10px;border-bottom:1px solid #eee;text-align:center;\">${item.quantity}</td>
            <td style=\"padding:10px;border-bottom:1px solid #eee;text-align:right;\">${escapeHtml(currency(unitPrice))}</td>
            <td style=\"padding:10px;border-bottom:1px solid #eee;text-align:right;\">${escapeHtml(currency(lineTotal))}</td>
          </tr>
        `;
      })
      .join('');

    const invoiceHtml = `
<!doctype html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>Invoice ${escapeHtml(order.orderNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #222; margin: 24px; }
      .wrap { max-width: 860px; margin: 0 auto; }
      h1 { margin: 0 0 8px; }
      .muted { color: #666; }
      .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 10px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
      .totals { margin-top: 12px; width: 320px; margin-left: auto; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
      .grand { font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px; }
      .actions { margin: 20px 0; }
      .btn { display: inline-block; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; text-decoration: none; color: #111; }
      @media print { .actions { display: none; } }
    </style>
  </head>
  <body>
    <div class=\"wrap\">
      <div class=\"card\">
        <h1>GlobalMarketHub Invoice</h1>
        <div class=\"muted\">Order No: ${escapeHtml(order.orderNumber)}</div>
        <div class=\"muted\">Date: ${escapeHtml(formatDate(order.createdAt))}</div>
      </div>

      <div class=\"card\">
        <h3 style=\"margin-top:0;\">Billing & Shipping</h3>
        <div>${getShippingText(order.shippingAddress)}</div>
      </div>

      <div class=\"card\">
        <h3 style=\"margin-top:0;\">Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style=\"text-align:center;\">Qty</th>
              <th style=\"text-align:right;\">Unit Price</th>
              <th style=\"text-align:right;\">Line Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class=\"totals\">
          <div><span>Subtotal</span><span>${escapeHtml(currency(Number(order.subtotal)))}</span></div>
          <div><span>Tax</span><span>${escapeHtml(currency(Number(order.tax)))}</span></div>
          <div><span>Shipping</span><span>${escapeHtml(currency(Number(order.shipping)))}</span></div>
          <div class=\"grand\"><span>Total</span><span>${escapeHtml(currency(Number(order.totalAmount)))}</span></div>
        </div>
      </div>

      <div class=\"card\">
        <h3 style=\"margin-top:0;\">Payment</h3>
        <div>Method: ${escapeHtml(order.payment?.gatewayName || order.paymentMethod || 'N/A')}</div>
        <div>Status: ${escapeHtml(order.paymentStatus)}</div>
        <div>Reference: ${escapeHtml(order.payment?.gatewayTransactionId || order.payment?.status || 'N/A')}</div>
      </div>

      <div class=\"actions\">
        <button class=\"btn\" onclick=\"window.print()\">Download / Print Invoice</button>
      </div>
    </div>
  </body>
</html>
`;

    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    if (shouldDownload) {
      headers.set('Content-Disposition', `attachment; filename=\"invoice-${order.orderNumber}.html\"`);
    }

    return new NextResponse(invoiceHtml, { status: 200, headers });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
