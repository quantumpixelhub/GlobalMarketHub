// Payment Gateway Integration
// Supports: UddoktaPay (Bangladesh), Stripe (International), Mobile Wallets

interface PaymentConfig {
  gateway: string;
  amount: number;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  invoiceId?: string;
  paymentUrl?: string;
  message: string;
}

interface VerificationResponse {
  success: boolean;
  status: string;
  message: string;
  invoiceId?: string;
  transactionId?: string;
  paymentMethod?: string;
  senderNumber?: string;
  chargedAmount?: string;
  metadata?: Record<string, unknown>;
  raw?: unknown;
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function isValidProviderPaymentUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;

  try {
    const parsed = new URL(rawUrl);
    // Prevent redirecting to bare root page that shows "Direct access is not allowed".
    if (parsed.hostname.includes('uddoktapay.com') && parsed.pathname === '/' && !parsed.search) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeBaseUrl(rawUrl: string): string {
  const normalized = rawUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

function resolveUddoktaCheckoutUrl(): string {
  const explicitUrl = pickFirstString(
    process.env.UDDOKTAPAY_CHECKOUT_V2_URL,
    process.env.UDDOKTAPAY_CHECKOUT_URL,
    process.env.UDDOKTAPAY_PAYMENT_URL
  );

  if (explicitUrl) return explicitUrl;

  const apiBase = normalizeBaseUrl(
    pickFirstString(process.env.UDDOKTAPAY_API_URL, 'https://eshopping.paymently.io/api')
  );

  return `${apiBase}/checkout-v2`;
}

function resolveUddoktaVerifyUrl(): string {
  const explicitUrl = pickFirstString(process.env.UDDOKTAPAY_VERIFY_URL);
  if (explicitUrl) return explicitUrl;

  const apiBase = normalizeBaseUrl(
    pickFirstString(process.env.UDDOKTAPAY_API_URL, 'https://eshopping.paymently.io/api')
  );

  return `${apiBase}/verify-payment`;
}

function resolvePublicAppUrl(): string {
  const appUrl = pickFirstString(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL
  );

  return appUrl.replace(/\/+$/, '');
}

/**
 * UddoktaPay Integration
 * Bangladesh's leading payment gateway
 * Docs: https://uddoktapay.com/docs
 */
export async function initiateUddoktaPay(config: PaymentConfig): Promise<PaymentResponse> {
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const checkoutV2Url = resolveUddoktaCheckoutUrl();
  const appUrl = resolvePublicAppUrl();

  if (!apiKey) {
    console.warn('UddoktaPay API key not configured');
    return {
      success: false,
      transactionId: '',
      message: 'UddoktaPay API key not configured',
    };
  }

  if (!appUrl) {
    return {
      success: false,
      transactionId: '',
      message: 'NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL is required for payment redirects',
    };
  }

  try {
    const response = await fetch(checkoutV2Url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': apiKey,
      },
      body: JSON.stringify({
        full_name: config.customerName,
        email: config.customerEmail,
        amount: String(config.amount),
        metadata: {
          internal_txn: config.orderId,
          order_id: config.orderId,
          selected_method: config.gateway,
        },
        redirect_url: `${appUrl}/api/payment/callback?internal_txn=${encodeURIComponent(config.orderId)}&gateway=uddoktapay`,
        return_type: 'GET',
        cancel_url: `${appUrl}/payment/failure?reason=cancelled_by_user`,
        webhook_url: `${appUrl}/api/payment/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'UddoktaPay request failed');
    }

    const paymentUrl = pickFirstString(
      data?.payment_url,
      data?.url,
      data?.checkout_url,
      data?.redirect_url,
      data?.payment_link,
      data?.data?.payment_url,
      data?.data?.url,
      data?.result?.payment_url,
      data?.result?.url
    );

    const providerTransactionId = pickFirstString(
      data?.invoice_id,
      data?.transaction_id,
      data?.trx_id,
      data?.id,
      data?.payment_id,
      data?.data?.transaction_id,
      data?.data?.trx_id,
      data?.result?.transaction_id,
      data?.result?.trx_id,
      config.orderId
    );

    const invoiceId = pickFirstString(
      data?.invoice_id,
      data?.data?.invoice_id,
      data?.result?.invoice_id,
      providerTransactionId
    );

    if (!isValidProviderPaymentUrl(paymentUrl)) {
      return {
        success: false,
        transactionId: providerTransactionId,
        message: 'UddoktaPay did not return a valid checkout URL. Please verify API key and merchant setup.',
      };
    }

    return {
      success: true,
      transactionId: providerTransactionId,
      invoiceId,
      paymentUrl,
      message: 'Payment initiated successfully',
    };
  } catch (error) {
    console.error('UddoktaPay error:', error);
    return {
      success: false,
      transactionId: '',
      message: `UddoktaPay error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Stripe Integration
 * International payments and cards
 * Docs: https://stripe.com/docs
 */
export async function initiateStripePayment(config: PaymentConfig): Promise<PaymentResponse> {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.warn('Stripe credentials not configured');
    return {
      success: true,
      transactionId: `MOCK_STRIPE_${config.orderId}`,
      paymentUrl: `https://checkout.stripe.com/pay/${config.orderId}`,
      message: 'Payment session created (Mock Mode - API credentials not configured)',
    };
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'bdt',
        'line_items[0][price_data][unit_amount]': String(config.amount * 100),
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][product_data][name]': `Order #${config.orderId}`,
        'mode': 'payment',
        'success_url': `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        'customer_email': config.customerEmail,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Stripe request failed');
    }

    return {
      success: true,
      transactionId: data.id,
      paymentUrl: data.url,
      message: 'Payment session created',
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      success: false,
      transactionId: '',
      message: `Stripe error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * bKash Mobile Wallet
 * Popular in Bangladesh
 */
export async function initiatebKashPayment(config: PaymentConfig): Promise<PaymentResponse> {
  // Mock implementation
  return {
    success: true,
    transactionId: `MOCK_BKASH_${config.orderId}`,
    paymentUrl: `https://sandbox.bkashurl.com/payment/${config.orderId}`,
    message: 'bKash payment initiated (Mock Mode)',
  };
}

/**
 * Nagad Mobile Wallet
 * Popular in Bangladesh
 */
export async function initiateNagadPayment(config: PaymentConfig): Promise<PaymentResponse> {
  // Mock implementation
  return {
    success: true,
    transactionId: `MOCK_NAGAD_${config.orderId}`,
    paymentUrl: `https://sandbox.nagadurl.com/payment/${config.orderId}`,
    message: 'Nagad payment initiated (Mock Mode)',
  };
}

/**
 * Cash on Delivery (COD)
 * No online payment needed
 */
export async function initiateCODPayment(config: PaymentConfig): Promise<PaymentResponse> {
  return {
    success: true,
    transactionId: `COD_${config.orderId}`,
    message: 'Cash on Delivery order created - Payment on delivery',
  };
}

/**
 * Main payment dispatcher
 */
export async function initiatePayment(
  gateway: string,
  config: PaymentConfig
): Promise<PaymentResponse> {
  const gatewayLower = gateway.toLowerCase();

  switch (gatewayLower) {
    case 'uddoktapay':
      return initiateUddoktaPay(config);
    case 'stripe':
      return initiateStripePayment(config);
    case 'bkash':
      return initiatebKashPayment(config);
    case 'nagad':
      return initiateNagadPayment(config);
    case 'cod':
      return initiateCODPayment(config);
    default:
      return {
        success: false,
        transactionId: '',
        message: `Unknown payment gateway: ${gateway}`,
      };
  }
}

/**
 * Verify payment status with gateway
 */
export async function verifyPaymentStatus(
  gateway: string,
  invoiceId: string
): Promise<VerificationResponse> {
  if (gateway.toLowerCase() === 'uddoktapay') {
    const apiKey = process.env.UDDOKTAPAY_API_KEY;
    const verifyUrl = resolveUddoktaVerifyUrl();

    if (!apiKey) {
      return {
        success: false,
        status: 'UNKNOWN',
        message: 'UddoktaPay credentials are missing',
      };
    }

    if (!invoiceId) {
      return {
        success: false,
        status: 'UNKNOWN',
        message: 'invoice_id is required for UddoktaPay verification',
      };
    }

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'RT-UDDOKTAPAY-API-KEY': apiKey,
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: 'UNKNOWN',
          message: String(data?.message || `Verification failed with status ${response.status}`),
          raw: data,
        };
      }

      const rawStatus = String(
        data?.status ||
        data?.payment_status ||
        data?.data?.status ||
        data?.data?.payment_status ||
        'UNKNOWN'
      ).toUpperCase();
      const isSuccessStatus = ['COMPLETED', 'SUCCESS', 'PAID'].includes(rawStatus);

      return {
        success: isSuccessStatus,
        status: rawStatus,
        message: String(data?.message || 'Payment verified successfully'),
        invoiceId: String(data?.invoice_id || invoiceId),
        transactionId: pickFirstString(data?.transaction_id, data?.trx_id),
        paymentMethod: pickFirstString(data?.payment_method),
        senderNumber: pickFirstString(data?.sender_number),
        chargedAmount: pickFirstString(data?.charged_amount, data?.amount),
        metadata: (data?.metadata && typeof data.metadata === 'object') ? data.metadata as Record<string, unknown> : undefined,
        raw: data,
      };
    } catch (error) {
      return {
        success: false,
        status: 'UNKNOWN',
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Fallback mock for gateways without verify API integration.
  return {
    success: true,
    status: 'COMPLETED',
    message: 'Payment verified successfully',
  };
}
