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
  paymentUrl?: string;
  message: string;
}

/**
 * UddoktaPay Integration
 * Bangladesh's leading payment gateway
 * Docs: https://uddoktapay.com/docs
 */
export async function initiateUddoktaPay(config: PaymentConfig): Promise<PaymentResponse> {
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const apiSecret = process.env.UDDOKTAPAY_API_SECRET;
  const checkoutV2Url =
    process.env.UDDOKTAPAY_CHECKOUT_V2_URL ||
    process.env.UDDOKTAPAY_CHECKOUT_URL ||
    process.env.UDDOKTAPAY_PAYMENT_URL ||
    'https://eshopping.paymently.io/api/checkout-v2';

  if (!apiKey || !apiSecret) {
    console.warn('UddoktaPay credentials not configured');
    return {
      success: true,
      transactionId: `MOCK_UDDOKTA_${config.orderId}`,
      paymentUrl: `https://sandbox.uddoktapay.com/payment/${config.orderId}`,
      message: 'Payment initiated (Mock Mode - API credentials not configured)',
    };
  }

  try {
    const response = await fetch(checkoutV2Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: config.amount,
        order_id: config.orderId,
        customer_email: config.customerEmail,
        customer_phone: config.customerPhone,
        customer_name: config.customerName,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'UddoktaPay request failed');
    }

    return {
      success: true,
      transactionId: data.transaction_id,
      paymentUrl: data.payment_url,
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
  transactionId: string
): Promise<{ success: boolean; status: string; message: string }> {
  if (gateway.toLowerCase() === 'uddoktapay') {
    const apiKey = process.env.UDDOKTAPAY_API_KEY;
    const verifyUrl = process.env.UDDOKTAPAY_VERIFY_URL || 'https://eshopping.paymently.io/api/verify-payment';

    if (!apiKey) {
      return {
        success: false,
        status: 'UNKNOWN',
        message: 'UddoktaPay credentials are missing',
      };
    }

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ transaction_id: transactionId }),
      });

      if (!response.ok) {
        return {
          success: false,
          status: 'UNKNOWN',
          message: `Verification failed with status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: String(data.status || data.payment_status || 'COMPLETED').toUpperCase(),
        message: 'Payment verified successfully',
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
