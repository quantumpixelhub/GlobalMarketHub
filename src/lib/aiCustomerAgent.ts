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
import {
  getTopSellingProducts,
  getTopSellingProductsOverall,
  formatProductsForChat,
  detectTimePeriod,
  extractCategory,
} from './salesAnalytics';
import { getCommerceInsightResponse } from './commerceInsights';

export interface AIAgentResponse {
  message: string;
  category: string;
  sentiment: string;
  escalateToHuman: boolean;
  escalationReason?: string;
  suggestedFAQs?: Array<{ question: string; answer: string }>;
}

type OpenDomainIntent =
  | 'PRODUCT_RECOMMENDATION'
  | 'SALES_ANALYTICS'
  | 'ORDER_CANCELLATION'
  | 'WARRANTY'
  | 'PRICING'
  | 'PRODUCT_INQUIRY'
  | 'COUPON_INQUIRY'
  | 'DELIVERY_INQUIRY'
  | 'PAYMENT_INQUIRY'
  | 'UNKNOWN';

function detectOpenDomainIntent(message: string): OpenDomainIntent {
  const lower = message.toLowerCase();

  // COUPON INQUIRY
  if (
    lower.includes('coupon') ||
    lower.includes('discount') ||
    lower.includes('promo') ||
    lower.includes('offer') ||
    lower.includes('code') ||
    lower.includes('deal') ||
    lower.includes('sale')
  ) {
    return 'COUPON_INQUIRY';
  }

  // DELIVERY INQUIRY
  if (
    lower.includes('delivery') ||
    lower.includes('charge') ||
    lower.includes('shipping') ||
    lower.includes('area') ||
    lower.includes('location') ||
    lower.includes('address') ||
    lower.includes('how long')
  ) {
    return 'DELIVERY_INQUIRY';
  }

  // PAYMENT INQUIRY
  if (
    lower.includes('payment') ||
    lower.includes('bkash') ||
    lower.includes('card') ||
    lower.includes('security') ||
    lower.includes('how to pay') ||
    lower.includes('which method')
  ) {
    return 'PAYMENT_INQUIRY';
  }

  // PRODUCT INQUIRY (do you have X, available, sell)
  if (
    (lower.includes('do you') && lower.includes('have')) ||
    (lower.includes('do you') && lower.includes('sell')) ||
    lower.includes('available') ||
    lower.includes('in stock') ||
    lower.includes('brand') ||
    lower.includes('category')
  ) {
    return 'PRODUCT_INQUIRY';
  }

  // PRODUCT RECOMMENDATION
  if (
    lower.includes('recommend') ||
    lower.includes('suggest') ||
    lower.includes('best product') ||
    lower.includes('which product')
  ) {
    return 'PRODUCT_RECOMMENDATION';
  }

  // SALES ANALYTICS
  if (
    lower.includes('most sold') ||
    lower.includes('top sold') ||
    lower.includes('best selling') ||
    lower.includes('top selling') ||
    lower.includes('sales report')
  ) {
    return 'SALES_ANALYTICS';
  }

  // ORDER CANCELLATION
  if (
    lower.includes('cancel order') ||
    lower.includes('order cancel') ||
    lower.includes('cancel my order')
  ) {
    return 'ORDER_CANCELLATION';
  }

  // WARRANTY
  if (lower.includes('warranty') || lower.includes('guarantee')) {
    return 'WARRANTY';
  }

  // PRICING
  if (
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('cheap') ||
    lower.includes('expensive')
  ) {
    return 'PRICING';
  }

  return 'UNKNOWN';
}

function generateGeneralIntentResponse(userMessage: string): string {
  const intent = detectOpenDomainIntent(userMessage);
  const lowerMsg = userMessage.toLowerCase();

  if (intent === 'COUPON_INQUIRY') {
    return `Great question! Yes, we have lots of coupons and discounts! 🎉

**Current Offers**:
• **New User**: 20% off first purchase (max 500 TK)
• **Flash Sales**: Up to 70% off on select items
• **Category Deals**: Regular discounts on Electronics, Fashion, Beauty
• **Seasonal Sales**: Festival & holiday promotions

**How to Find & Use Coupons**:
1. Check **Homepage** - See all active deals
2. Browse **Categories** - Category-specific discounts
3. Enter **Coupon Code** at checkout if you have one
4. Get **Notifications** - Subscribe to alerts for flash sales

**Tips**:
✓ New users get automatic 20% discount
✓ Free delivery on orders above 500 TK
✓ Bundle items to get better deals
✓ Check app for exclusive offers

Want to apply a specific coupon code? Share it and I'll help! 😊`;
  }

  if (intent === 'DELIVERY_INQUIRY') {
    return `Good question! Let me help with delivery information. 📦

**Delivery Times**:
🏙️ **Inside Dhaka**
- Standard: 1-2 business days
- Express: Same-day (if ordered before 2 PM)

🗺️ **Outside Dhaka**
- Standard: 3-5 business days
- Express: 1-2 business days

**Delivery Charges**:
💰 **Free Delivery**: Orders above 500 TK (Dhaka)
💰 **Charged Delivery**: 50-199 TK based on location & speed

**Coverage**:
✅ All districts in Bangladesh
✅ Major cities + growing to remote areas
✅ Check at checkout if we deliver to you

**To Check Delivery to Your Area**:
1. Add items to cart
2. Go to **Checkout**
3. Enter your address
4. System shows delivery options & cost

Do you want to know delivery charges to a specific area? Tell me your location! 📍`;
  }

  if (intent === 'PAYMENT_INQUIRY') {
    return `Perfect! I can help with payment information. 💳

**Payment Methods We Accept**:
💳 **Card Payments** - Visa, MasterCard, Amex (local & international)
📱 **Mobile Wallets** - BKash, Nagad, Rocket
🏦 **Online Gateways** - Uddoktapay, Stripe
💰 **Cash on Delivery** - Available in select areas

**Which Method to Choose**:
- **Fastest**: Mobile wallets (BKash, Nagad)
- **Safest**: Card or Uddoktapay
- **Convenient**: Whatever you prefer!
- **Limited**: COD only available in some areas

**All Payments Are Secure** 🔒
✓ SSL 256-bit encryption
✓ PCI-DSS compliant
✓ Your card data never stored
✓ Fraud protection 24/7

**Can't Use COD?**
If COD isn't available in your area, BKash is a great alternative - instant, secure, and widely used!

Is there a specific payment method you have questions about? Let me know! 😊`;
  }

  if (intent === 'PRODUCT_INQUIRY') {
    // Extract what product they're asking about
    const productMatch = lowerMsg.match(/(?:do you.*?have|do you.*?sell|available)\s+([a-z\s]+)(?:\?|$)/);
    const product = productMatch ? productMatch[1].trim() : 'products';
    
    return `Great question about ${product}! 🛍️

**Yes, we likely have ${product} in stock!** Here's how to find it:

**Search Method** 🔍
1. Click the **Search Bar** at the top
2. Type "${product}" or the specific brand
3. Hit Enter to see all options
4. Filter by price, brand, seller rating

**Browse by Category** 📂
1. Click **Menu** (three lines)
2. Select relevant category
3. Browse similar items
4. Check **prices & reviews**

**What You'll Find**:
✓ Multiple sellers (compare prices!)
✓ Customer ratings & reviews
✓ Real product images
✓ Detailed specifications
✓ Similar recommendations

**Pro Tips**:
💡 Read customer reviews carefully
💡 Compare different sellers' prices
💡 Check stock status before ordering
💡 Use coupons for better deals

Looking for something specific in ${product}? I can help guide you! What brand or feature are you looking for?`;
  }

  if (intent === 'PRODUCT_RECOMMENDATION') {
    return `I'd love to help you find the perfect product! 🎯

To give you the best recommendation, please tell me:

1. **What type of product?**
   - Electronics (phone, laptop, earbuds, etc.)
   - Fashion (clothes, shoes, accessories)
   - Beauty (skincare, haircare, cosmetics)
   - Home & Living (furniture, kitchen, decor)
   - Other?

2. **Your Budget Range?** 
   - Under 5,000 TK
   - 5K-15K TK
   - 15K-50K TK
   - 50K+ TK
   - No budget limit

3. **Brand Preference?** (Optional)
   - Any brand
   - Specific brand preference

Once you share these details, I can guide you to the best options with top ratings and best prices! 😊`;
  }

  if (intent === 'SALES_ANALYTICS') {
    return `That's a great question! I can help you find popular products. 🔥

**What would you like to know?**
- Most sold products overall?
- Most sold in a specific category (Electronics, Fashion, Beauty, Home)?
- Trending products this month?

Tell me what interests you, and I'll show you our bestsellers! 🛍️`;
  }

  if (intent === 'ORDER_CANCELLATION') {
    return `You can cancel an order before shipment. Here's how:

**Steps to Cancel**:
1. Go to **My Orders**
2. Find the order you want to cancel
3. Click **Cancel** button (if available)
4. Choose cancellation reason
5. Confirm cancellation

⏱️ **Important**: Cancellation must be done BEFORE order ships. Once shipped, you'll need to return instead.

**Refund Process**:
✓ Instant if payment not processed yet
✓ 2-3 days if payment already taken
✓ Refunded to original payment method

**Can't See Cancel Button?**
Your order may already be shipped. In that case, you can **Return** the item instead!

**Share Your Order Number** and I can check the current status:
- Is it still pending? (Can cancel)
- Already shipped? (Can return instead)

What's your Order Number? (ORD-XXXXXX) 📦`;
  }

  if (intent === 'WARRANTY') {
    return `Warranty depends on product category and seller policy.

**Typical Coverage**:
📱 **Electronics**: 1-2 year manufacturer warranty
👕 **Fashion**: No warranty (return within 7 days if defective)
💄 **Beauty**: No warranty (return if damaged)
🏠 **Home**: 1 year warranty (varies by item)

**To Check Warranty for Your Product**:
1. View the **product page**
2. Scroll to **Warranty & Support**
3. Check seller's specific warranty terms
4. Look for "Warranty" tag

**Claim Warranty**:
1. Go to **My Orders**
2. Open the order
3. Provide **Order Number** + **Purchase Date**
4. Describe the issue
5. Submit warranty claim

**What Warranty Covers**:
✓ Manufacturing defects
✓ Malfunctioning parts
✓ Dead on arrival (DOA)

**What It Doesn't Cover**:
✗ Physical damage from user
✗ Water damage
✗ Normal wear & tear

Please share your **Order Number** and **Product Name** to check warranty details! 😊`;
  }

  if (intent === 'PRICING') {
    return `I can help with pricing questions! 💰

**Our Pricing**:
✓ Fixed prices - not negotiable
✓ Compare sellers - same product may vary slightly
✓ Prices shown at checkout include all charges
✓ No hidden fees

**Ways to Save Money**:
1. **Use Coupons** - Apply promo codes
2. **Flash Sales** - Limited-time discounts throughout day
3. **Category Deals** - Regular discounts on specific categories
4. **Seasonal Sales** - Big discounts during festivals
5. **Bundle Items** - Get free delivery on orders 500 TK+
6. **New User Offer** - 20% off first purchase

**Price Comparison**:
- Multiple sellers sell same products
- Prices may differ slightly
- Choose by: price + seller rating + delivery speed
- All sellers are verified

**Price Drops**:
- Products go on sale periodically
- Add to **Wishlist** to track price changes
- Get notified when item is cheaper

Looking for a specific product? I can help you find the best deal! What are you interested in? 🛍️`;
  }

  // Fallback for truly unknown questions
  return `Thanks for your question! I want to give you the right answer. 😊

I can help with:
✓ **Products** - Search, availability, categories, brands
✓ **Coupons** - Current offers, how to use codes
✓ **Delivery** - Times, charges, areas we cover
✓ **Payments** - Methods, security, COD info
✓ **Orders** - Track, cancel, change address
✓ **Returns** - How to return, refund timeline
✓ **Account** - Login, signup, password reset

What would you like help with today?`;
}

function isAnalyticsQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('most sold') ||
    lower.includes('best sold') ||
    lower.includes('best selling') ||
    lower.includes('top selling') ||
    lower.includes('highest selling') ||
    lower.includes('sales') ||
    lower.includes('popular') ||
    lower.includes('trending') ||
    lower.includes('which.*is most sold') ||
    lower.includes('last week') ||
    lower.includes('last month') ||
    lower.includes('last 30 days')
  );
}

/**
 * Main function to get AI response
 * This uses a combination of:
 * 1. Knowledge base matching
 * 2. Simple pattern recognition
 * 3. Real sales data for product recommendations
 * 4. Free LLM fallback (if available)
 */
export async function getAIResponse(userMessage: string): Promise<AIAgentResponse> {
  try {
    // Priority path: live commerce data for product/payment/delivery/marketing/top-list questions
    const commerceInsight = await getCommerceInsightResponse(userMessage);
    if (commerceInsight) {
      return {
        message: commerceInsight.message,
        category: commerceInsight.topic,
        sentiment: 'NEUTRAL',
        escalateToHuman: false,
      };
    }

    // Special handling for sales/analytics queries - fetch real data
    if (isAnalyticsQuestion(userMessage)) {
      const category = extractCategory(userMessage);
      const days = detectTimePeriod(userMessage);

      let topProducts;
      if (category) {
        topProducts = await getTopSellingProducts(category, days, 5);
      } else {
        topProducts = await getTopSellingProductsOverall(days, 5);
      }

      const responseMessage = formatProductsForChat(topProducts);

      return {
        message: responseMessage,
        category: 'SALES_INQUIRY',
        sentiment: 'NEUTRAL',
        escalateToHuman: false,
      };
    }

    // Step 1: Categorize the message
    const category = categorizeMessage(userMessage);
    const sentiment = analyzeSentiment(userMessage);

    // Step 2: Check for open-domain intents FIRST
    // This handles product questions, pricing, warranty, etc.
    const openDomainIntent = detectOpenDomainIntent(userMessage);
    if (openDomainIntent !== 'UNKNOWN') {
      // We detected a specific intent - respond to it directly
      const intentResponse = generateGeneralIntentResponse(userMessage);
      return {
        message: intentResponse,
        category: openDomainIntent,
        sentiment,
        escalateToHuman: false,
      };
    }

    // Step 3: Find relevant FAQs (only if no open-domain intent matched)
    const relevantFAQs = findRelevantFAQs(userMessage, 2);
    const lowerMessage = userMessage.toLowerCase();
    const hasDirectKeywordMatch =
      relevantFAQs.length > 0
        ? relevantFAQs[0].keywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))
        : false;

    // Step 4: Determine if escalation needed
    const shouldEscalate =
      sentiment === 'NEGATIVE' ||
      userMessage.length > 500 ||
      userMessage.includes('urgent') ||
      userMessage.includes('escalate') ||
      category === 'COMPLAINT';

    // Step 5: Generate response
    let responseMessage = '';

    if (relevantFAQs.length > 0 && (category !== 'GENERAL' || hasDirectKeywordMatch)) {
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
    response += generateGeneralIntentResponse(userMessage);
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
