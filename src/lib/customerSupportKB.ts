/**
 * Customer Support Knowledge Base
 * Free AI Agent with common FAQs and information
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export const SUPPORT_KB: FAQItem[] = [
  // ========== CASH ON DELIVERY (COD) ==========
  {
    id: 'cod-001',
    question: 'Is Cash on Delivery (COD) available?',
    answer: `Cash on Delivery (COD) is currently not available for all products. However, we're working to expand COD availability to more areas and sellers. 

Alternative payment methods available:
• Credit/Debit Card
• BKash Mobile Wallet
• Uddoktapay
• Stripe (International)

To check if COD is available for your area, please proceed to checkout and select your delivery location. Available payment methods will be shown based on your location.`,
    category: 'COD',
    keywords: ['cod', 'cash on delivery', 'payment', 'available', 'option'],
  },
  {
    id: 'cod-002',
    question: 'Why is COD not available in my area?',
    answer: `COD availability depends on:
1. **Delivery Partner** - Not all logistics partners support COD in every area
2. **Order Value** - Very high-value orders may not be eligible for COD
3. **Product Type** - Some product categories have restricted payment methods
4. **Merchant Settings** - Individual sellers can disable COD for their products

We recommend using other payment methods like BKash or card payments which are available in more areas. This also helps us expedite your order faster!`,
    category: 'COD',
    keywords: ['cod unavailable', 'not available', 'area', 'location', 'delivery'],
  },
  {
    id: 'cod-003',
    question: 'Can I request COD for my order?',
    answer: `You cannot manually enable COD, but here's what you can do:

1. **Check at Checkout** - COD may become available if you choose a different delivery area or change your order
2. **Contact Support** - If COD is essential for you, contact our support team with your order details and preferred area
3. **Try Alternative Methods** - Mobile wallets like BKash are instant and secure
4. **Place Multiple Orders** - Sometimes COD is available for smaller orders

Our team is continuously expanding COD coverage. We'll notify you once it's available in your area!`,
    category: 'COD',
    keywords: ['request', 'cod', 'enable', 'ask for'],
  },

  // ========== ORDERS ==========
  {
    id: 'order-001',
    question: 'How do I track my order?',
    answer: `To track your order:

1. **Go to Your Orders** - Log in and click "My Orders" or "Account"
2. **Find Your Order** - Look for the order you want to track
3. **View Tracking Details** - Click the order to see:
   - Current status (Pending, Processing, Shipped, Delivered)
   - Tracking number
   - Estimated delivery date
   - Courier/Delivery partner information

4. **Real-time Updates** - You'll receive SMS/Email updates as your order progresses

Can't find your order? Reply to this chat with your **Order Number** (starts with ORD-) and I can help!`,
    category: 'ORDERS',
    keywords: ['track', 'order', 'status', 'tracking number', 'where is'],
  },
  {
    id: 'order-002',
    question: 'What are the order statuses?',
    answer: `Order statuses explained:

🔵 **PENDING** - Order received, processing your payment
⚙️ **PROCESSING** - Order confirmed, seller preparing your items
📦 **SHIPPED** - Items picked up by courier, on the way
✅ **DELIVERED** - Order reached your address
❌ **CANCELLED** - Order was cancelled (refund will be processed)
🔄 **RETURNED** - Item was returned for refund

**Timeline**: Most orders are delivered within 3-7 business days depending on your location.

Need help? Share your **Order Number** and we can check the exact status!`,
    category: 'ORDERS',
    keywords: ['status', 'pending', 'processing', 'shipped', 'delivered'],
  },
  {
    id: 'order-003',
    question: 'How long does delivery take?',
    answer: `Delivery time depends on your location:

📍 **Inside Dhaka**
• Standard Delivery: 1-2 business days
• Express Delivery: Same day (if ordered before 2 PM)

📍 **Outside Dhaka**
• Standard Delivery: 3-5 business days
• Express Delivery: 1-2 business days

**Factors affecting delivery**:
- Order processing time (0-24 hours)
- Courier availability
- Weather conditions
- Public holidays

You can choose delivery speed at checkout based on your location.`,
    category: 'ORDERS',
    keywords: ['delivery time', 'how long', 'when deliver', 'duration'],
  },

  // ========== RETURNS & REFUNDS ==========
  {
    id: 'return-001',
    question: 'How do I return a product?',
    answer: `Our return process is simple:

1. **Check Eligibility** - Product must be:
   - Returned within 7 days of delivery
   - In original condition and packaging
   - Unused and unwashed

2. **Initiate Return** - Go to "My Orders" → Select the order → Click "Return"

3. **Choose Return Reason** - Select from available reasons:
   - Wrong item delivered
   - Item defective/damaged
   - Changed mind
   - Size/color doesn't fit

4. **Schedule Pickup** - A courier will collect your item from your address

5. **Return Processing** - Once received and verified, refund is processed

**Refund Time**: 5-7 business days after return is approved

Can't process return online? Chat with us directly with your **Order Number**.`,
    category: 'RETURNS',
    keywords: ['return', 'refund', 'exchange', 'damage', 'wrong item'],
  },
  {
    id: 'return-002',
    question: 'What is your return policy?',
    answer: `**GlobalMarketHub Return Policy**

✅ **RETURNABLE**:
- Most items within 7 days of delivery
- Original packaging intact
- Product unused/unworn
- With receipt/order proof

❌ **NON-RETURNABLE**:
- Items purchased as "Final Sale"
- Customized/personalized items
- Electronics (once opened)
- Fashion items (if washed/worn)
- Digital products

**Return Process**:
1. Request return in "My Orders" within 7 days
2. We arrange free pickup from your address
3. Verify condition at our warehouse
4. Approve and process refund

**Refund Method**: Original payment method used for purchase

Have questions about a specific item? Tell us the **Order Number** and **Product Name**!`,
    category: 'RETURNS',
    keywords: ['return policy', 'can i return', 'returnable', 'conditions'],
  },

  // ========== PAYMENT ==========
  {
    id: 'payment-001',
    question: 'What payment methods do you accept?',
    answer: `We accept multiple secure payment methods:

💳 **Card Payments**
- Visa, MasterCard, American Express
- Both local and international cards

📱 **Mobile Wallets**
- BKash (Send Money & Menu option)
- Nagad
- Rocket

🏦 **Online Payment Gateways**
- Uddoktapay
- Stripe (International)

💰 **Cash on Delivery** (Limited areas)
- Available in select locations
- Check at checkout

**Security**: All payments are encrypted and PCI-DSS compliant. Your card details are never stored on our servers.`,
    category: 'PAYMENT',
    keywords: ['payment', 'method', 'card', 'bkash', 'accept'],
  },
  {
    id: 'payment-002',
    question: 'Is my payment secure?',
    answer: `Yes! Your payment is completely secure:

🔒 **Security Features**:
- SSL Encryption (256-bit)
- PCI-DSS Compliance Level 1
- No card details stored on our servers
- Tokenized transactions for repeat payments
- Fraud detection systems

✅ **Your Information**:
- Card numbers never visible in plain text
- Processed through secure payment gateways
- Your data is never shared with 3rd parties
- 24/7 fraud monitoring

💡 **Pro Tips**:
- Use strong passwords
- Don't share OTP with anyone
- Check your bank statements regularly
- Report suspicious activity immediately

Have concerns? Contact our security team anytime!`,
    category: 'PAYMENT',
    keywords: ['secure', 'safety', 'fraud', 'ssl', 'protection'],
  },

  // ========== ACCOUNT & GENERAL ==========
  {
    id: 'account-001',
    question: 'How do I create an account?',
    answer: `Creating an account is quick and easy:

1. **Click "Sign Up"** on our homepage
2. **Enter Your Details**:
   - Email address
   - Phone number
   - First & Last name
   - Password (strong password recommended)
3. **Verify Email** - Click the verification link sent to your email
4. **Verify Phone** - Enter the OTP sent to your phone
5. **Done!** - You can now browse and shop

**Benefits of an Account**:
✓ Faster checkout
✓ Track order status
✓ Save multiple addresses
✓ Wishlist & favorites
✓ Order history
✓ Exclusive deals & offers

You can also checkout as a guest without creating an account!`,
    category: 'ACCOUNT',
    keywords: ['account', 'sign up', 'register', 'create account'],
  },
  {
    id: 'account-002',
    question: 'How do I reset my password?',
    answer: `Forgot your password? No problem!

1. **Go to Login Page** - Click "Sign In"
2. **Click "Forgot Password"** - Below the login button
3. **Enter Your Email** - The email used for your account
4. **Check Your Email** - We'll send a password reset link
5. **Click the Link** - Valid for 24 hours
6. **Create New Password** - Strong password recommended
7. **Log In** - Use your new password

**Password Tips**:
- At least 8 characters
- Mix of uppercase and lowercase
- Include numbers and symbols
- Don't use common words or birthdates

Still having trouble? Reply with your email and we'll help!`,
    category: 'ACCOUNT',
    keywords: ['password', 'reset', 'forgot', 'login', 'change password'],
  },
  {
    id: 'general-001',
    question: 'How can I contact customer support?',
    answer: `We're here to help! Contact us in multiple ways:

💬 **Chat Support** (24/7)
- Use this chat window (available right now!)
- Instant response to common queries
- AI agent + human support

📞 **Phone Support**
- Call: +880-1913-512342
- Hours: 10 AM - 6 PM (Sunday - Thursday)
- 2 PM - 8 PM on Fridays

📧 **Email Support**
- support@globalmarkethub.com
- Response within 24 hours

🏢 **Visit Our Office**
- Email us for address
- By appointment preferred

**For Quick Help**:
- Share your **Order Number** (ORD-XXXXXX)
- Mention the **issue**
- Describe what you need help with

We typically resolve issues within 24 hours!`,
    category: 'GENERAL',
    keywords: ['contact', 'support', 'help', 'customer service', 'reach'],
  },
  {
    id: 'general-002',
    question: 'Do you have a mobile app?',
    answer: `Yes! Download our mobile app for better shopping experience:

📱 **iOS**
- Available on Apple App Store
- iOS 12.0 or higher required

🤖 **Android**
- Available on Google Play Store
- Android 6.0 or higher required

**App Benefits**:
✓ Faster browsing & loading
✓ Push notifications for offers
✓ One-tap checkout
✓ Better product search
✓ Wishlist sync
✓ Exclusive app-only deals

**App Features**:
- Real-time order tracking
- Instant notifications
- Easy returns process
- In-app chat support
- Saved payment methods

Search for "GlobalMarketHub" in your app store!`,
    category: 'GENERAL',
    keywords: ['app', 'mobile', 'ios', 'android', 'download'],
  },
];

/**
 * Find relevant FAQ items based on user query
 */
export function findRelevantFAQs(query: string, limit: number = 3): FAQItem[] {
  const lowerQuery = query.toLowerCase();
  
  return SUPPORT_KB
    .map((faq) => {
      let score = 0;
      
      // Exact question match
      if (faq.question.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }
      
      // Keyword matches
      const matchedKeywords = faq.keywords.filter((kw) =>
        lowerQuery.includes(kw.toLowerCase())
      );
      score += matchedKeywords.length * 3;
      
      // Question word matches
      const queryWords = lowerQuery.split(/\s+/);
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      const commonWords = queryWords.filter((qw) =>
        questionWords.some((fw) => fw.includes(qw) || qw.includes(fw))
      );
      score += commonWords.length;
      
      return { faq, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ faq }) => faq);
}

/**
 * System prompt for the AI agent
 */
export const SUPPORT_SYSTEM_PROMPT = `You are GlobalMarketHub's friendly customer support AI assistant. Your role is to help customers with their orders, payments, returns, and general inquiries.

**Your Responsibilities**:
1. Answer common questions about orders, payments, delivery, and returns
2. Help customers track their orders by asking for their Order Number
3. Provide solutions to common problems
4. Escalate complex issues to human agents
5. Be empathetic and professional

**Guidelines**:
- Always be polite and respectful
- If you don't know the answer, say "Let me connect you to a human agent" 
- Use the provided knowledge base to answer questions
- Ask for Order Number when discussing specific orders
- Suggest available payment methods when customer mentions COD unavailability
- For urgent issues or complaints, offer to escalate to human support
- Keep responses concise but helpful
- Use emojis occasionally to be friendly but professional

**Available Information**:
- Order tracking and statuses
- Payment methods and security
- Return and refund policies
- Delivery times and areas
- COD availability
- Account management
- Contact information

Remember: You're a helpful assistant, not a human. If you can't help, don't hesitate to offer human support.`;

/**
 * Message categorization
 */
export function categorizeMessage(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (
    lowerMsg.includes('cod') ||
    lowerMsg.includes('cash') ||
    lowerMsg.includes('delivery payment')
  ) {
    return 'COD_QUESTION';
  }
  
  if (
    lowerMsg.includes('track') ||
    lowerMsg.includes('status') ||
    lowerMsg.includes('where') ||
    lowerMsg.includes('order')
  ) {
    return 'ORDER_INQUIRY';
  }
  
  if (
    lowerMsg.includes('return') ||
    lowerMsg.includes('refund') ||
    lowerMsg.includes('exchange') ||
    lowerMsg.includes('damaged') ||
    lowerMsg.includes('wrong')
  ) {
    return 'RETURN_REQUEST';
  }
  
  if (
    lowerMsg.includes('complaint') ||
    lowerMsg.includes('issue') ||
    lowerMsg.includes('problem') ||
    lowerMsg.includes('help')
  ) {
    return 'COMPLAINT';
  }
  
  return 'GENERAL';
}

/**
 * Sentiment analysis (simple)
 */
export function analyzeSentiment(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  const positiveWords = ['good', 'great', 'excellent', 'thanks', 'thank you', 'happy', 'love', 'perfect'];
  const negativeWords = [
    'bad',
    'awful',
    'terrible',
    'angry',
    'upset',
    'frustrated',
    'complaint',
    'problem',
    'issue',
    'damaged',
    'wrong',
    'not working',
  ];
  
  const posCount = positiveWords.filter((w) => lowerMsg.includes(w)).length;
  const negCount = negativeWords.filter((w) => lowerMsg.includes(w)).length;
  
  if (negCount > posCount) return 'NEGATIVE';
  if (posCount > negCount) return 'POSITIVE';
  return 'NEUTRAL';
}
