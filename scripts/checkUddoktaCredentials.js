const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const cwd = process.cwd();
  const localPath = path.join(cwd, '.env.local');
  const envPath = path.join(cwd, '.env');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }

  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
  }
}

function pickFirst(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizeBaseUrl(rawUrl) {
  const normalized = String(rawUrl || '').replace(/\/+$/, '');
  if (!normalized) return '';
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

function resolveCheckoutUrl() {
  const explicit = pickFirst(
    process.env.UDDOKTAPAY_CHECKOUT_V2_URL,
    process.env.UDDOKTAPAY_CHECKOUT_URL,
    process.env.UDDOKTAPAY_PAYMENT_URL
  );

  if (explicit) return explicit;

  const apiBase = normalizeBaseUrl(
    pickFirst(process.env.UDDOKTAPAY_API_URL, 'https://sandbox.uddoktapay.com/api')
  );

  return apiBase ? `${apiBase}/checkout-v2` : '';
}

function resolveVerifyUrl() {
  const explicit = pickFirst(process.env.UDDOKTAPAY_VERIFY_URL);
  if (explicit) return explicit;

  const apiBase = normalizeBaseUrl(
    pickFirst(process.env.UDDOKTAPAY_API_URL, 'https://sandbox.uddoktapay.com/api')
  );

  return apiBase ? `${apiBase}/verify-payment` : '';
}

function getCredentialStatus() {
  const apiKey = pickFirst(process.env.UDDOKTAPAY_API_KEY);
  const apiSecret = pickFirst(process.env.UDDOKTAPAY_API_SECRET);
  const merchantId = pickFirst(process.env.UDDOKTAPAY_MERCHANT_ID);
  const appUrl = pickFirst(process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL);
  const checkoutUrl = resolveCheckoutUrl();
  const verifyUrl = resolveVerifyUrl();

  const required = {
    UDDOKTAPAY_API_KEY: Boolean(apiKey),
    UDDOKTAPAY_CHECKOUT_URL: Boolean(checkoutUrl),
    UDDOKTAPAY_VERIFY_URL: Boolean(verifyUrl),
    NEXT_PUBLIC_APP_URL_OR_SITE_URL: Boolean(appUrl),
  };

  const optional = {
    UDDOKTAPAY_API_SECRET: Boolean(apiSecret),
    UDDOKTAPAY_MERCHANT_ID: Boolean(merchantId),
  };

  return {
    required,
    optional,
    checkoutUrlHost: checkoutUrl ? new URL(checkoutUrl).host : '',
    verifyUrlHost: verifyUrl ? new URL(verifyUrl).host : '',
    appUrl,
    apiKey,
    checkoutUrl,
  };
}

async function runProbe(status) {
  const txn = `probe-${Date.now()}`;
  const payload = {
    full_name: 'GMH Credential Probe',
    email: 'probe@gmh.local',
    amount: '10',
    payment_method: 'bkash',
    paymentMethod: 'bkash',
    method: 'bkash',
    metadata: {
      internal_txn: txn,
      order_id: txn,
      selected_method: 'bkash',
      provider_gateway: 'uddoktapay',
    },
    redirect_url: `${status.appUrl}/api/payment/callback?internal_txn=${encodeURIComponent(txn)}&gateway=uddoktapay`,
    return_type: 'GET',
    cancel_url: `${status.appUrl}/payment/failure?reason=cancelled_by_user`,
    webhook_url: `${status.appUrl}/api/payment/callback`,
  };

  const response = await fetch(status.checkoutUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'RT-UDDOKTAPAY-API-KEY': status.apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      statusCode: response.status,
      message: String(data?.message || `Checkout probe failed with status ${response.status}`),
    };
  }

  const paymentUrl = pickFirst(
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

  const invoiceId = pickFirst(
    data?.invoice_id,
    data?.data?.invoice_id,
    data?.result?.invoice_id,
    data?.transaction_id,
    data?.trx_id,
    data?.id,
    data?.payment_id
  );

  return {
    ok: Boolean(paymentUrl),
    hasPaymentUrl: Boolean(paymentUrl),
    paymentUrlHost: paymentUrl ? new URL(paymentUrl).host : '',
    hasInvoiceId: Boolean(invoiceId),
  };
}

async function main() {
  loadEnv();

  const shouldProbe = process.argv.includes('--probe');
  const status = getCredentialStatus();

  const requiredReady = Object.values(status.required).every(Boolean);

  const output = {
    required: status.required,
    optional: status.optional,
    checkoutUrlHost: status.checkoutUrlHost,
    verifyUrlHost: status.verifyUrlHost,
    appUrlConfigured: Boolean(status.appUrl),
    readyForCheckout: requiredReady,
  };

  if (shouldProbe && requiredReady) {
    output.probe = await runProbe(status);
    output.readyForLiveRedirect = Boolean(output.probe?.ok);
  } else {
    output.probe = shouldProbe ? { ok: false, skipped: true, reason: 'missing_required_configuration' } : undefined;
    output.readyForLiveRedirect = false;
  }

  console.log(JSON.stringify(output, null, 2));

  if (!requiredReady || (shouldProbe && !output.probe?.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Uddokta credential check failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
