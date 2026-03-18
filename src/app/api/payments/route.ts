import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const { orderId, paymentMethod, isGuestCheckout } = await request.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: "Order ID and payment method are required" },
        { status: 400 }
      );
    }

    // Get order with owner
    const order = await prisma.order.findUnique({
      where: { id: orderId as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (auth.success) {
      const userId = auth.data?.userId as string;
      if (order.userId !== userId) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    } else if (!isGuestCheckout) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment gateway config
    const gateway = await prisma.paymentGatewayConfig.findUnique({
      where: { gatewayName: paymentMethod as string },
    });

    if (!gateway || !gateway.isEnabled) {
      return NextResponse.json(
        { error: "Payment method not available" },
        { status: 400 }
      );
    }

    // Create payment transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: orderId as string,
        userId: order.userId,
        gatewayName: paymentMethod as string,
        amount: order.totalAmount,
        currency: "BDT",
        status: "PENDING",
        transactionFee: gateway.transactionFee,
        netAmount: (order.totalAmount as any) - (gateway.transactionFee as any),
        paymentMethod: paymentMethod as string,
        customerDetails: {
          email: order.user?.email,
          phone: order.user?.phone,
        },
      },
    });

    // TODO: Integrate with actual payment gateway
    // For MVP, return mock response
    const mockPaymentUrl = `https://payment.${paymentMethod}.com/checkout?transactionId=${transaction.id}&amount=${order.totalAmount}`;

    return NextResponse.json(
      {
        message: "Payment initiated",
        transactionId: transaction.id,
        paymentUrl: mockPaymentUrl,
        amount: order.totalAmount,
        currency: "BDT",
        gateway: paymentMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Initiate payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        transaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
