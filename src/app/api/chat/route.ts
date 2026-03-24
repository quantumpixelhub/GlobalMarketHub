import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { getAIResponse, getQuickResponse, extractOrderNumber } from '@/lib/aiCustomerAgent';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const body = await request.json();
    const { message, orderId, guestEmail } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Determine user context
    let userId: string | null = null;
    if (auth.success) {
      userId = auth.data?.userId as string;
    }

    // Check for quick response (instant response for greetings)
    const quickResponse = getQuickResponse(message);
    if (quickResponse) {
      // Save message to database
      await saveMessage(userId, null, message, quickResponse, 'GENERAL', 'NEUTRAL', false);

      return NextResponse.json(
        {
          reply: quickResponse,
          category: 'GENERAL',
          sentiment: 'NEUTRAL',
          escalateToHuman: false,
          quickReply: true,
        },
        { status: 200 }
      );
    }

    // Get AI response (uses KB and optional LLM)
    const aiResponse = await getAIResponse(message);

    // Extract order number if present
    const extractedOrderNumber = extractOrderNumber(message);

    // Save message to database
    const savedMessage = await saveMessage(
      userId,
      extractedOrderNumber || orderId || null,
      message,
      aiResponse.message,
      aiResponse.category,
      aiResponse.sentiment,
      aiResponse.escalateToHuman,
      guestEmail
    );

    return NextResponse.json(
      {
        reply: aiResponse.message,
        category: aiResponse.category,
        sentiment: aiResponse.sentiment,
        escalateToHuman: aiResponse.escalateToHuman,
        escalationReason: aiResponse.escalationReason,
        suggestedFAQs: aiResponse.suggestedFAQs,
        messageId: savedMessage.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process your message',
        reply: 'Sorry, I encountered an error. Let me connect you with our support team.',
        escalateToHuman: true,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve chat history
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const messages = await prisma.customerMessage.findMany({
      where: {
        userId,
        ...(orderId && { orderId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to save message
 */
async function saveMessage(
  userId: string | null,
  orderId: string | null,
  userMessage: string,
  agentResponse: string,
  messageType: string,
  sentiment: string,
  escalatedToHuman: boolean,
  guestEmail?: string
) {
  try {
    const message = await prisma.customerMessage.create({
      data: {
        userId,
        orderId,
        userMessage,
        agentResponse,
        messageType,
        sentiment,
        status: escalatedToHuman ? 'ESCALATED' : 'OPEN',
        escalatedToHuman,
        category: messageType,
      },
    });

    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}
