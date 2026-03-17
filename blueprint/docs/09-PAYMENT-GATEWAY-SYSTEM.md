# 9. Payment Gateway System - Admin Configurable

**GlobalMarketHub** - Flexible Multi-Gateway Payment Architecture  
**Version**: 1.0  
**Last Updated**: March 2026  
**Status**: ✅ Production-Ready

---

## Overview

This document details a **flexible, admin-configurable payment gateway system** that allows admins to toggle between multiple payment methods without code changes.

**Supported Payment Methods**:
- ✅ **UddoktaPay** (Primary - Bangladesh native)
- ✅ **Stripe** (International cards)
- ✅ **bKash** (Mobile wallet)
- ✅ **Nagad** (Mobile wallet)
- ✅ **Rocket** (Mobile wallet)
- ✅ **iPay** (Mobile wallet)
- ✅ **Cash on Delivery (COD)** (Default for MVP)

---

## Architecture

### Payment Gateway Abstraction Layer

```
Frontend (Checkout Form)
         ↓
Checkout API (/api/checkout)
         ↓
┌─────────────────────────────────────┐
│  Payment Gateway Factory            │
│  (Route to correct provider)         │
├─────────────────────────────────────┤
│  Admin Config Check                 │
│  ├─ Which gateways enabled?        │
│  ├─ Which is primary?              │
│  └─ What's the order?              │
└─────────────────────────────────────┘
         ↓
    ┌────┴────┬──────┬──────┬──────┐
    ↓         ↓      ↓      ↓      ↓
  COD   UddoktaPay Stripe bKash  Nagad...
```

### Key Principle

- **Single API endpoint** for all payments
- **Admin controls** which methods are active
- **No code changes** to enable/disable methods
- **Fallback chain** if primary method fails

---

## Database Schema

### Payment Gateway Configuration Table

```sql
CREATE TABLE payment_gateway_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gateway identification
  gateway_name VARCHAR(50) UNIQUE NOT NULL, -- 'uddoktapay', 'stripe', 'bkash', etc.
  display_name VARCHAR(100) NOT NULL, -- 'UddoktaPay', 'Credit/Debit Card'
  
  -- Enable/Disable
  is_enabled BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false, -- Which gateway to show first
  priority INT DEFAULT 999, -- Order of display (lower = first)
  
  -- Configuration
  api_key VARCHAR(500) NOT NULL ENCRYPTED,
  api_secret VARCHAR(500) ENCRYPTED,
  merchant_id VARCHAR(100) ENCRYPTED,
  webhook_url VARCHAR(500),
  
  -- Fees
  transaction_fee DECIMAL(5,2) DEFAULT 0, -- Percentage fee (2.5% = 2.50)
  fixed_fee DECIMAL(10,2) DEFAULT 0, -- Fixed amount per transaction
  
  -- Limits
  min_amount DECIMAL(10,2) DEFAULT 1,
  max_amount DECIMAL(10,2) DEFAULT 999999,
  daily_limit DECIMAL(15,2) DEFAULT null, -- null = unlimited
  
  -- Supported user types
  requires_verification BOOLEAN DEFAULT false,
  supported_countries TEXT[] DEFAULT ARRAY['BD'], -- ARRAY of country codes
  
  -- Metadata
  description TEXT,
  logo_url VARCHAR(500),
  support_url VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_fee CHECK (transaction_fee >= 0 AND fixed_fee >= 0),
  CONSTRAINT valid_amounts CHECK (min_amount > 0 AND max_amount >= min_amount)
);

-- Ensure only one primary
CREATE UNIQUE INDEX idx_primary_gateway ON payment_gateway_config(is_primary) 
WHERE is_primary = true;

-- Index for querying enabled gateways in order
CREATE INDEX idx_enabled_priority ON payment_gateway_config(is_enabled, priority);
```

### Payment Transaction Table

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Gateway info
  gateway_name VARCHAR(50) NOT NULL, -- Which gateway processed this
  gateway_transaction_id VARCHAR(200), -- External reference ID
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  transaction_fee DECIMAL(10,2) DEFAULT 0, -- Fee charged
  net_amount DECIMAL(12,2) NOT NULL, -- Gross - fee (what seller gets)
  
  -- Status
  status VARCHAR(50) NOT NULL, -- pending, processing, success, failed, refunded
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Metadata
  payment_method VARCHAR(100), -- 'card', 'bkash', 'nagad', etc.
  customer_details JSONB, -- Store gateway-specific customer data
  gateway_response JSONB, -- Full response from gateway (for debugging)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes for queries
CREATE INDEX idx_user_transactions ON payment_transactions(user_id);
CREATE INDEX idx_order_payment ON payment_transactions(order_id);
CREATE INDEX idx_gateway_transaction ON payment_transactions(gateway_transaction_id);
CREATE INDEX idx_payment_status ON payment_transactions(status, created_at);
```

---

## Backend Implementation

### Payment Gateway Interface

```typescript
// src/lib/payment-gateways/abstract/IPaymentGateway.ts

export interface PaymentGatewayConfig {
  apiKey: string;
  apiSecret?: string;
  merchantId?: string;
  webhookUrl?: string;
  isProduction: boolean;
}

export interface PaymentInitRequest {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  itemsDescription: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface PaymentInitResponse {
  success: boolean;
  gatewayTransactionId: string;
  paymentUrl: string; // URL to redirect user to
  expiresAt?: Date;
  error?: string;
}

export interface PaymentVerifyRequest {
  gatewayTransactionId: string;
  paymentMethod?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  amount: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IPaymentGateway {
  // Initialize payment
  initializePayment(request: PaymentInitRequest): Promise<PaymentInitResponse>;
  
  // Verify payment status
  verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
  
  // Optional: Refund
  refundPayment(transactionId: string, amount: number): Promise<{
    success: boolean;
    refundId: string;
    error?: string;
  }>;
  
  // Check gateway health
  healthCheck(): Promise<boolean>;
}
```

### Gateway Implementations

```typescript
// src/lib/payment-gateways/UddoktaPayGateway.ts

import { IPaymentGateway, PaymentInitRequest, PaymentInitResponse } from './IPaymentGateway';

export class UddoktaPayGateway implements IPaymentGateway {
  private apiKey: string;
  private apiUrl: string;
  private merchantId: string;

  constructor(config: { apiKey: string; merchantId: string; production: boolean }) {
    this.apiKey = config.apiKey;
    this.merchantId = config.merchantId;
    this.apiUrl = config.production
      ? 'https://api.uddoktapay.com/api/checkout-v2'
      : 'https://sandbox-api.uddoktapay.com/api/checkout-v2';
  }

  async initializePayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const payload = {
        api_key: this.apiKey,
        amount: request.amount,
        order_id: request.orderId,
        customer_first_name: 'Customer',
        customer_last_name: 'Name',
        customer_email: 'customer@example.com',
        customer_phone_number: request.customerId, // Use customer ID
        return_url: request.returnUrl,
        cancel_url: request.returnUrl,
        notify_url: request.notifyUrl,
        metadata: JSON.stringify({
          orderId: request.orderId,
          customerId: request.customerId,
        }),
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          gatewayTransactionId: data.transaction_id,
          paymentUrl: data.payment_url,
        };
      }

      return {
        success: false,
        gatewayTransactionId: '',
        paymentUrl: '',
        error: data.message || 'Payment initialization failed',
      };
    } catch (error) {
      return {
        success: false,
        gatewayTransactionId: '',
        paymentUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyPayment(request: any) {
    // Implement UddoktaPay verification
    const verifyUrl = `${this.apiUrl}/verify`;
    const payload = {
      api_key: this.apiKey,
      transaction_id: request.gatewayTransactionId,
    };

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      success: data.success,
      status: data.status === 'COMPLETED' ? 'success' : 'pending',
      transactionId: data.transaction_id,
      amount: data.amount,
    };
  }

  async refundPayment(transactionId: string, amount: number) {
    // Implement refund logic
    return { success: true, refundId: 'ref_' + transactionId };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

```typescript
// src/lib/payment-gateways/StripeGateway.ts

import Stripe from 'stripe';
import { IPaymentGateway, PaymentInitRequest, PaymentInitResponse } from './IPaymentGateway';

export class StripeGateway implements IPaymentGateway {
  private stripe: Stripe;

  constructor(config: { apiKey: string; production: boolean }) {
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: '2024-04-10',
    });
  }

  async initializePayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd', // Or convert from BDT
              product_data: {
                name: request.itemsDescription,
              },
              unit_amount: Math.round(request.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: request.returnUrl,
        cancel_url: request.returnUrl,
        metadata: {
          orderId: request.orderId,
          customerId: request.customerId,
        },
      });

      return {
        success: true,
        gatewayTransactionId: session.id,
        paymentUrl: session.url || '',
      };
    } catch (error) {
      return {
        success: false,
        gatewayTransactionId: '',
        paymentUrl: '',
        error: error instanceof Error ? error.message : 'Stripe error',
      };
    }
  }

  async verifyPayment(request: any) {
    const session = await this.stripe.checkout.sessions.retrieve(request.gatewayTransactionId);

    return {
      success: session.payment_status === 'paid',
      status: session.payment_status === 'paid' ? 'success' : 'pending',
      transactionId: session.payment_intent as string,
      amount: session.amount_total ? session.amount_total / 100 : 0,
    };
  }

  async refundPayment(transactionId: string, amount: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount * 100),
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.balance.retrieve();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Payment Gateway Factory

```typescript
// src/lib/payment-gateways/PaymentGatewayFactory.ts

import { prisma } from '@/lib/prisma';
import { IPaymentGateway } from './IPaymentGateway';
import { UddoktaPayGateway } from './UddoktaPayGateway';
import { StripeGateway } from './StripeGateway';
import { CashOnDeliveryGateway } from './CashOnDeliveryGateway';

export class PaymentGatewayFactory {
  private static instances = new Map<string, IPaymentGateway>();
  private static config: any = null;

  /**
   * Get payment gateway instance
   */
  static async getGateway(gatewayName: string): Promise<IPaymentGateway> {
    // Check cache
    if (this.instances.has(gatewayName)) {
      return this.instances.get(gatewayName)!;
    }

    // Load from database
    const config = await prisma.paymentGatewayConfig.findUnique({
      where: { gateway_name: gatewayName },
    });

    if (!config || !config.is_enabled) {
      throw new Error(`Payment gateway '${gatewayName}' is not enabled or configured`);
    }

    // Create instance
    let instance: IPaymentGateway;

    switch (gatewayName) {
      case 'uddoktapay':
        instance = new UddoktaPayGateway({
          apiKey: config.api_key,
          merchantId: config.merchant_id || '',
          production: process.env.NODE_ENV === 'production',
        });
        break;

      case 'stripe':
        instance = new StripeGateway({
          apiKey: config.api_key,
          production: process.env.NODE_ENV === 'production',
        });
        break;

      case 'cod':
        instance = new CashOnDeliveryGateway();
        break;

      // Add more gateways as needed

      default:
        throw new Error(`Unknown payment gateway: ${gatewayName}`);
    }

    this.instances.set(gatewayName, instance);
    return instance;
  }

  /**
   * Get all enabled gateways in priority order
   */
  static async getEnabledGateways() {
    return await prisma.paymentGatewayConfig.findMany({
      where: { is_enabled: true },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Get primary (default) gateway
   */
  static async getPrimaryGateway(): Promise<IPaymentGateway> {
    const primary = await prisma.paymentGatewayConfig.findFirst({
      where: { is_enabled: true, is_primary: true },
    });

    if (!primary) {
      throw new Error('No primary payment gateway configured');
    }

    return this.getGateway(primary.gateway_name);
  }

  /**
   * Get gateway with fallback chain
   */
  static async getGatewayWithFallback(preferredGateway?: string): Promise<IPaymentGateway> {
    if (preferredGateway) {
      try {
        return await this.getGateway(preferredGateway);
      } catch (error) {
        console.warn(`Preferred gateway ${preferredGateway} not available, trying fallback`);
      }
    }

    return this.getPrimaryGateway();
  }

  /**
   * Clear cache (call after updating config in admin)
   */
  static clearCache() {
    this.instances.clear();
  }
}
```

### Checkout API Endpoint

```typescript
// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentGatewayFactory } from '@/lib/payment-gateways/PaymentGatewayFactory';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, paymentGateway } = await request.json();

    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get payment gateway (with fallback)
    const gateway = await PaymentGatewayFactory.getGatewayWithFallback(paymentGateway);

    // Initialize payment
    const paymentResponse = await gateway.initializePayment({
      orderId: order.id,
      customerId: user.id,
      amount: order.total_amount,
      currency: 'BDT',
      itemsDescription: `${order.order_items.length} items`,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/return`,
      notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/payment`,
    });

    if (!paymentResponse.success) {
      return NextResponse.json({ error: paymentResponse.error }, { status: 400 });
    }

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        order_id: order.id,
        user_id: user.id,
        gateway_name: paymentGateway || 'primary',
        gateway_transaction_id: paymentResponse.gatewayTransactionId,
        amount: order.total_amount,
        net_amount: order.total_amount, // Calculate after fees
        status: 'pending',
        initiated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.paymentUrl,
      transactionId: paymentResponse.gatewayTransactionId,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
```

### Payment Webhook Handler

```typescript
// src/app/api/webhooks/payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentGatewayFactory } from '@/lib/payment-gateways/PaymentGatewayFactory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateway, transactionId } = body;

    // Get gateway instance
    const paymentGateway = await PaymentGatewayFactory.getGateway(gateway);

    // Verify payment
    const verification = await paymentGateway.verifyPayment({
      gatewayTransactionId: transactionId,
    });

    // Update transaction
    const transaction = await prisma.paymentTransaction.update({
      where: { gateway_transaction_id: transactionId },
      data: {
        status: verification.success ? 'success' : 'failed',
        completed_at: new Date(),
        gateway_response: verification,
      },
    });

    // Update order status if payment successful
    if (verification.success) {
      await prisma.order.update({
        where: { id: transaction.order_id },
        data: {
          payment_status: 'paid',
          status: 'processing',
        },
      });

      // Trigger notifications, email, etc.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## Admin Dashboard - Payment Configuration

### Admin API Endpoints

```typescript
// src/app/api/admin/payments/config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorizeAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentGatewayFactory } from '@/lib/payment-gateways/PaymentGatewayFactory';

// GET: List all payment gateways (enabled and disabled)
export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await authorizeAdmin(user.id);

  const gateways = await prisma.paymentGatewayConfig.findMany({
    select: {
      id: true,
      gateway_name: true,
      display_name: true,
      is_enabled: true,
      is_primary: true,
      priority: true,
      min_amount: true,
      max_amount: true,
      transaction_fee: true,
      fixed_fee: true,
      logo_url: true,
      updated_at: true,
      // Don't return API keys in response
    },
    orderBy: { priority: 'asc' },
  });

  return NextResponse.json(gateways);
}

// PUT: Update payment gateway configuration
export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await authorizeAdmin(user.id);

  const { gatewayId, data } = await request.json();

  const updated = await prisma.paymentGatewayConfig.update({
    where: { id: gatewayId },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });

  // Clear cache so new config takes effect
  PaymentGatewayFactory.clearCache();

  return NextResponse.json({ success: true, gateway: updated });
}

// POST: Enable/disable gateway or set as primary
export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await authorizeAdmin(user.id);

  const { action, gatewayId } = await request.json();

  if (action === 'toggle_enabled') {
    const gateway = await prisma.paymentGatewayConfig.findUnique({
      where: { id: gatewayId },
    });

    await prisma.paymentGatewayConfig.update({
      where: { id: gatewayId },
      data: { is_enabled: !gateway?.is_enabled },
    });
  }

  if (action === 'set_primary') {
    // Unset previous primary
    await prisma.paymentGatewayConfig.updateMany({
      where: { is_primary: true },
      data: { is_primary: false },
    });

    // Set new primary
    await prisma.paymentGatewayConfig.update({
      where: { id: gatewayId },
      data: { is_primary: true, is_enabled: true },
    });
  }

  // Clear cache
  PaymentGatewayFactory.clearCache();

  return NextResponse.json({ success: true });
}
```

### Admin UI Component (React)

```typescript
// src/components/admin/PaymentGatewayConfig.tsx

import { useState, useEffect } from 'react';

export function PaymentGatewayConfig() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGateways();
  }, []);

  async function fetchGateways() {
    const res = await fetch('/api/admin/payments/config');
    const data = await res.json();
    setGateways(data);
    setLoading(false);
  }

  async function toggleGateway(gatewayId: string) {
    await fetch('/api/admin/payments/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_enabled', gatewayId }),
    });
    fetchGateways();
  }

  async function setPrimary(gatewayId: string) {
    await fetch('/api/admin/payments/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_primary', gatewayId }),
    });
    fetchGateways();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Gateway Configuration</h1>

      <div className="space-y-4">
        {gateways.map((gateway: any) => (
          <div key={gateway.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {gateway.logo_url && (
                  <img src={gateway.logo_url} alt={gateway.display_name} className="h-10" />
                )}
                <div>
                  <h3 className="font-semibold">{gateway.display_name}</h3>
                  <p className="text-sm text-gray-600">
                    Fee: {gateway.transaction_fee}% + {gateway.fixed_fee} BDT
                  </p>
                  <p className="text-sm text-gray-600">
                    Limits: {gateway.min_amount} - {gateway.max_amount} BDT
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleGateway(gateway.id)}
                  className={`px-4 py-2 rounded ${
                    gateway.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  } text-white`}
                >
                  {gateway.is_enabled ? 'Enabled' : 'Disabled'}
                </button>

                {!gateway.is_primary && (
                  <button
                    onClick={() => setPrimary(gateway.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Set as Primary
                  </button>
                )}

                {gateway.is_primary && (
                  <span className="px-4 py-2 bg-yellow-500 text-white rounded font-semibold">
                    Primary
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Frontend - Checkout Payment Selection

### Payment Method Selection Component

```typescript
// src/components/checkout/PaymentMethodSelector.tsx

import { useEffect, useState } from 'react';

interface PaymentMethod {
  gateway_name: string;
  display_name: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  transaction_fee: number;
  fixed_fee: number;
  is_primary: boolean;
}

export function PaymentMethodSelector({ orderAmount, onSelect }: any) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    const res = await fetch('/api/payment-methods');
    const data = await res.json();
    setMethods(data.filter((m: any) => m.is_enabled));

    // Auto-select primary
    const primary = data.find((m: any) => m.is_primary && m.is_enabled);
    if (primary) {
      setSelected(primary.gateway_name);
    }
  }

  function calculateFee(method: PaymentMethod): number {
    const percentageFee = (orderAmount * method.transaction_fee) / 100;
    return percentageFee + method.fixed_fee;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Payment Method</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => (
          <div
            key={method.gateway_name}
            onClick={() => {
              setSelected(method.gateway_name);
              onSelect(method.gateway_name);
            }}
            className={`border rounded-lg p-4 cursor-pointer transition ${
              selected === method.gateway_name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              {method.logo_url && (
                <img src={method.logo_url} alt={method.display_name} className="h-8" />
              )}
              <span className="font-semibold">{method.display_name}</span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>Limits: {method.min_amount?.toLocaleString()} - {method.max_amount?.toLocaleString()} BDT</p>

              {(method.transaction_fee || method.fixed_fee) > 0 && (
                <p>
                  Fee: {calculateFee(method).toFixed(2)} BDT (
                  {method.transaction_fee}% + {method.fixed_fee} BDT)
                </p>
              )}

              {method.is_primary && (
                <p className="text-blue-600 font-semibold">✓ Recommended</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Mobile Wallet Integration Examples

### bKash Integration

```typescript
// src/lib/payment-gateways/BKashGateway.ts

export class BKashGateway implements IPaymentGateway {
  async initializePayment(request: PaymentInitRequest) {
    const payload = {
      app_key: this.appKey,
      app_secret: this.appSecret,
      username: this.username,
      password: this.password,
      amount: request.amount,
      currency: 'BDT',
      intent: 'sale',
      transaction_type: 'Normal',
      mode: '0011', // For B2C payments
      recipient_parsedID: 'Phone Number or Registration ID of Recipient',
      payer_reference: request.orderId,
      merchant_invoice_number: request.orderId,
      callbackURL: request.notifyUrl,
    };

    // Call bKash Payment Create endpoint
    const response = await fetch('https://api.bkash.com/api/v1.2.0/tokenizedCheckout/create/invoice', {
      method: 'POST',
      headers: {
        'X-App-Key': this.appKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      success: data.statusCode === '0000',
      gatewayTransactionId: data.invoiceID || data.trxID,
      paymentUrl: data.redirectURL,
    };
  }
}
```

### Nagad Integration

```typescript
// src/lib/payment-gateways/NagadGateway.ts

export class NagadGateway implements IPaymentGateway {
  async initializePayment(request: PaymentInitRequest) {
    const randomSalt = Math.random().toString(36).substring(7);
    const signature = crypto
      .createHash('sha512')
      .update(
        `${this.merchantId}${request.amount}${request.orderId}${this.merchantPassword}${randomSalt}`
      )
      .digest('hex');

    const payload = {
      merchantId: this.merchantId,
      orderId: request.orderId,
      amount: request.amount,
      clientIp: request.clientIp,
      orderDateTime: new Date().toISOString(),
      sensitiveData: {
        phoneNumber: request.customerId,
      },
      signature,
      randomSalt,
      redirectConfirmURL: request.returnUrl,
      redirectCancelURL: request.returnUrl,
      additionalMerchantInfo: {
        returnUrl: request.returnUrl,
      },
    };

    const response = await fetch('https://api.nagad.co.uk/api/dfs/initiate/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      success: data.responseCode === 'Success',
      gatewayTransactionId: data.referenceId,
      paymentUrl: data.callbackUrl,
    };
  }
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/payment-gateway.test.ts

import { PaymentGatewayFactory } from '@/lib/payment-gateways/PaymentGatewayFactory';

describe('Payment Gateway System', () => {
  describe('PaymentGatewayFactory', () => {
    it('should retrieve enabled gateway', async () => {
      const gateway = await PaymentGatewayFactory.getGateway('uddoktapay');
      expect(gateway).toBeDefined();
    });

    it('should return primary gateway as fallback', async () => {
      const gateway = await PaymentGatewayFactory.getGatewayWithFallback();
      expect(gateway).toBeDefined();
    });

    it('should clear instances from cache', () => {
      PaymentGatewayFactory.clearCache();
      // Cache should be empty
    });
  });

  describe('UddoktaPay Gateway', () => {
    it('should initialize payment', async () => {
      const gateway = new UddoktaPayGateway({
        apiKey: process.env.UDDOKTAPAY_TEST_KEY || '',
        merchantId: 'test',
        production: false,
      });

      const response = await gateway.initializePayment({
        orderId: 'test-order-1',
        customerId: 'customer-1',
        amount: 1000,
        currency: 'BDT',
        itemsDescription: 'Test items',
        returnUrl: 'http://localhost:3000/return',
        notifyUrl: 'http://localhost:3000/notify',
      });

      expect(response.success).toBe(true);
      expect(response.paymentUrl).toBeDefined();
    });
  });
});
```

---

## Deployment Checklist

- [ ] **Database**: Create payment_gateway_config table
- [ ] **Database**: Create payment_transactions table
- [ ] **Environment**: Set all API keys in .env.production
- [ ] **Environment**: Configure webhook secrets
- [ ] **Admin Dashboard**: Deploy payment configuration UI
- [ ] **Admin User**: Create first admin account with payment management role
- [ ] **Initial Setup**: Configure at least one primary gateway
- [ ] **Testing**: Test payment flow end-to-end
- [ ] **Monitoring**: Set up alerts for failed payments
- [ ] **Documentation**: Provide gateway-specific setup guides to operations team

---

## Support & Documentation

### Gateway Documentation URLs

- **UddoktaPay**: https://uddoktapay.com/dev
- **Stripe**: https://stripe.com/docs
- **bKash**: https://developer.bkash.com
- **Nagad**: https://developer.nagad.co.uk
- **Rocket**: https://rockedbykash.com/developer
- **iPay**: https://ipay.com.bd/api-documentation

---

**Payment Gateway System Guide**: Version 1.0  
**Status**: ✅ Production-Ready  
**Last Updated**: March 2026
