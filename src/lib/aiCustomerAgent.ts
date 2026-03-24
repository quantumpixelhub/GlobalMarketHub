/**
 * Free AI Agent for Customer Support
 * Uses Hugging Face Inference API (Free Tier)
 * No API key required for basic usage
 */

import {
  SUPPORT_SYSTEM_PROMPT,
  findRelevantFAQs,
  categorizeMessage,
  analyzeSentiment,
} from './customerSupportKB';

export interface AIAgentResponse {
  message: string;
  category: string;
  sentiment: string;
  escalateToHuman: boolean;
  escalationReason?: string;
  suggestedFAQs?: Array<{ question: string; answer: string }>;
}

function isAnalyticsQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('most sold') ||
    lower.includes('best sold') ||
    lower.includes('best selling') ||
    lower.includes('top selling') ||
    lower.includes('highest selling') ||
    lower.includes('sales report') ||
    lower.includes('last week')
  );
}

/**
 * Main function to get AI response
 * This uses a combination of:
 * 1. Knowledge base matching
 * 2. Simple pattern recognition
 * 3. Free LLM fallback (if available)
 */
export async function getAIResponse(userMessage: string): Promise<AIAgentResponse> {
  try {
    if (isAnalyticsQuestion(userMessage)) {
      return {
        message:
          "This looks like a business analytics question. I can help with customer support topics, but for 'most sold last week' please check Admin > Analytics in your dashboard. If you want, I can help you find order status, payment, return, or delivery details.",
        category: 'ANALYTICS_REQUEST',
        sentiment: 'NEUTRAL',
        escalateToHuman: false,
      };
    }

    // Step 1: Categorize the message
    const category = categorizeMessage(userMessage);
    const sentiment = analyzeSentiment(userMessage);

    // Step 2: Find relevant FAQs
    const relevantFAQs = findRelevantFAQs(userMessage, 2);

    // Step 3: Determine if escalation needed
    const shouldEscalate =
      sentiment === 'NEGATIVE' ||
      userMessage.length > 500 ||
      userMessage.includes('urgent') ||
      userMessage.includes('escalate') ||
      category === 'COMPLAINT';

    // Step 4: Generate response
    let responseMessage = '';

    if (relevantFAQs.length > 0) {
      // We found relevant FAQs - provide them
      responseMessage = generateKBResponse(userMessage, relevantFAQs, sentiment);
    } else {
      // No direct match - use free LLM or fallback
      responseMessage = await generateLLMResponse(userMessage, category, sentiment);
    }

    return {
      message: responseMessage,
      category,
      sentiment,
      escalateToHuman: shouldEscalate,
      escalationReason: shouldEscalate
        ? sentiment === 'NEGATIVE'
          ? 'Customer seems upset, connecting to human agent'
          : 'Complex query, connecting to human agent for better assistance'
        : undefined,
      suggestedFAQs:
        relevantFAQs.length > 0
          ? relevantFAQs.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            }))
          : undefined,
    };
  } catch (error) {
    console.error('AI Agent Error:', error);
    return {
      message:
        "I apologize for the technical difficulty. Let me connect you with our human support team who can better assist you.",
      category: 'GENERAL',
      sentiment: 'NEUTRAL',
      escalateToHuman: true,
      escalationReason: 'Technical error - connecting to human agent',
    };
  }
}

/**
 * Generate response from knowledge base
 */
function generateKBResponse(
  userMessage: string,
  faqs: Array<{ question: string; answer: string; category: string; id: string }>,
  sentiment: string
): string {
  let response = '';

  // Friendly greeting based on sentiment
  if (sentiment === 'POSITIVE') {
    response += "That's great to hear! 😊 ";
  } else if (sentiment === 'NEGATIVE') {
    response += "I understand your concern. 😔 Let me help! ";
  } else {
    response += 'Great question! ';
  }

  // Add main answer from top FAQ
  response += faqs[0].answer;

  // Add follow-up suggestions
  if (faqs.length > 1) {
    response += `\n\n**Related question that might help:**\n${faqs[1].question}\n${faqs[1].answer}`;
  }

  // Add call to action
  if (
    userMessage.toLowerCase().includes('order number') ||
    userMessage.toLowerCase().includes('track')
  ) {
    response += "\n\n💡 **To help better, please share your Order Number** (starts with ORD-XXXXXX)";
  }

  response += '\n\nIs there anything else I can help you with?';

  return response;
}

/**
 * Generate response using free LLM (Hugging Face)
 * This is a simplified version using pattern matching
 * For production, you'd integrate with actual free LLM API
 */
async function generateLLMResponse(
  userMessage: string,
  category: string,
  sentiment: string
): Promise<string> {
  if (isAnalyticsQuestion(userMessage)) {
    return "I cannot access business sales analytics from this customer support chat. For 'most sold in last week', open Admin > Analytics. I can still help with orders, returns, delivery, and payment questions here.";
  }

  // Try to use Hugging Face API if available
  try {
    const response = await callFreeHuggingFaceAPI(userMessage);
    if (response) {
      return response;
    }
  } catch (error) {
    console.log('LLM API not available, using fallback response');
  }

  // Fallback: Pattern-based response
  return generateFallbackResponse(userMessage, category, sentiment);
}

/**
 * Call free Hugging Face Inference API
 * No API key needed for basic usage (rate limited)
 */
async function callFreeHuggingFaceAPI(userMessage: string): Promise<string | null> {
  try {
    // Using Hugging Face's free inference API
    // Model: Mistral-7B or similar open source model
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_API_KEY || ''}` },
      method: 'POST',
      body: JSON.stringify({
        inputs: `${SUPPORT_SYSTEM_PROMPT}\n\nCustomer: ${userMessage}\n\nSupport Agent:`,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.7,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const text = result[0]?.generated_text || '';

      // Extract only the agent's response part
      const agentResponse = text.split('Support Agent:')[1]?.trim() || '';
      return agentResponse.substring(0, 500); // Limit length
    }
  } catch (error) {
    // API unavailable or rate limited - that's okay, return null to fallback
    return null;
  }

  return null;
}

/**
 * Fallback response generator (works without API)
 */
function generateFallbackResponse(userMessage: string, category: string, sentiment: string): string {
  const lowerMsg = userMessage.toLowerCase();

  // Empathy opening
  let response = sentiment === 'NEGATIVE' ? "I understand your concern. " : "Thanks for reaching out! ";

  // Category-specific responses
  if (category === 'COD_QUESTION') {
    response += `Today, COD isn't available everywhere, but we're expanding it. 
    
Quick alternatives:
🏦 Mobile wallets (BKash, Nagad) - Instant & Secure
💳 Card payments - Faster processing
📲 All methods are secure and verified

You can check COD availability at checkout for your area. Would you like to know more about other payment options?`;
  } else if (category === 'ORDER_INQUIRY') {
    if (lowerMsg.includes('order number') || lowerMsg.includes('track')) {
      response += `To help track your order, please provide:

📦 Your Order Number (starts with ORD-)
📍 Or your email address

Once you share that, I can give you:
✓ Current status
✓ Tracking number
✓ Estimated delivery date
✓ Courier details

Please share your Order Number and I'll look it up for you!`;
    } else {
      response += `Orders typically take:
• **Inside Dhaka**: 1-2 days (standard) or same-day (express)
• **Outside Dhaka**: 3-5 days (standard) or 1-2 days (express)

To check YOUR order status, please share your **Order Number** (ORD-XXXXX).`;
    }
  } else if (category === 'RETURN_REQUEST') {
    response += `Returns are easy within 7 days of delivery!

**Process**:
1. Go to "My Orders"
2. Click "Return" on the item
3. Select reason
4. We arrange free pickup
5. Get refund after verification

**What we accept**:
✓ Unused, original condition
✓ Packaging intact
✓ Within 7 days

Share your Order Number and I can guide you through the exact process!`;
  } else if (category === 'COMPLAINT') {
    response += `I'm sorry you're experiencing an issue. Let me connect you with our support team who can better assist.

**In the meantime, please provide**:
📦 Order Number (if order-related)
📝 Description of the issue
✉️ Your contact email/phone

Our human team typically responds within 1-2 hours. We'll resolve this for you!`;
  } else {
    response += `I'm here to help! I can assist with:
✅ Order tracking
✅ Payment methods
✅ Returns & refunds
✅ Delivery times
✅ COD availability
✅ Account & login

What would you like help with?`;
  }

  response += '\n\n📞 Or reach our human agents: support@globalmarkethub.com';

  return response;
}

/**
 * Extract order number from message
 */
export function extractOrderNumber(message: string): string | null {
  const match = message.match(/ORD-[\w]+/i);
  return match ? match[0] : null;
}

/**
 * Simple bot response for ultra-fast replies
 */
export function getQuickResponse(userMessage: string): string | null {
  const lowerMsg = userMessage.toLowerCase();

  // Quick responses for common greetings
  if (lowerMsg.match(/^(hi|hello|hey|assalam|asda)/)) {
    return "👋 Hello! Welcome to GlobalMarketHub support! How can I help you today?";
  }

  if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
    return "You're welcome! Happy shopping with GlobalMarketHub! 😊";
  }

  if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye')) {
    return "Goodbye! Have a great day! 👋";
  }

  return null;
}
