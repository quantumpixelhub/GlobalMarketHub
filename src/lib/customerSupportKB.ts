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
  // ========== COUPONS & OFFERS ==========
  {
    id: 'coupon-001',
    question: 'Are there any coupons available right now?',
    answer: `Yes! We always have exciting discounts and coupons available! 🎉

**Current Offers**:
- **New User Coupon**: 20% off on first purchase (max 500 TK)
- **Festival Sales**: Check our seasonal campaigns for up to 70% discount
- **Cart Coupons**: Apply discount codes at checkout
- **Category Deals**: Electronics, Fashion, Beauty on sale regularly
- **Flash Sales**: Limited-time offers (check daily!)

**How to Find Coupons**:
1. Check the **Homepage** - Banners show active deals
2. **Category Pages** - Browse discounts by type
3. **My Account** - View personalized offers
4. **Email/SMS** - Subscribe for exclusive deals
5. **App Notifications** - Get alerts for flash sales

**How to Apply**:
1. Add items to your cart
2. Go to checkout
3. Paste the coupon code
4. Discount applies automatically

Have a specific coupon code? Paste it and I'll help verify!`,
    category: 'OFFERS',
    keywords: ['coupon', 'discount', 'promo', 'code', 'offer', 'deal', 'sale'],
  },
  {
    id: 'coupon-002',
    question: 'How do I use a coupon code?',
    answer: `Using a coupon is simple! Follow these steps:

1. **Add Items** - Browse and add products to your cart
2. **Go to Cart** - Click the shopping cart icon
3. **Review Items** - Make sure everything is correct
4. **Enter Code** - Look for "Coupon Code" or "Promo Code" field
5. **Paste Code** - Enter your coupon code exactly as shown
6. **Apply** - Click "Apply" button
7. **Confirm** - Check if discount is applied
8. **Proceed** - Continue to payment

**Common Issues**:
- **Code Not Working**: Might be expired or have restrictions
- **Minimum Amount**: Some coupons require minimum purchase
- **Usage Limit**: Coupon might have limited uses
- **Category Specific**: Some codes only work on certain products

Can't apply your code? Share it with me and I'll help troubleshoot!`,
    category: 'OFFERS',
    keywords: ['coupon code', 'apply', 'promo', 'discount', 'how to use'],
  },
  {
    id: 'coupon-003',
    question: 'What is your return discount policy?',
    answer: `**Discount & Sale Items Return Policy**:

✅ **SALE ITEMS CAN BE RETURNED** within 7 days if:
- Product is unused/unworn
- Original packaging intact
- No signs of wear or use
- Purchased as sale/discount item

⚠️ **"Final Sale" Items**:
- Marked as "Non-Returnable" or "Final Sale"
- Cannot be returned under any circumstances
- Check product details before purchase

**Refund on Discounted Items**:
- Refunded at the price you paid (with discount)
- Not refunded at original price
- Example: Bought for 500 TK (after 50% off), refund is 500 TK

**To Check if Item is Returnable**:
1. Go to product page
2. Scroll to "Return Policy" section
3. It will clearly state if returnable

Can't find return status? Share your **Order Number** and **Product Name**!`,
    category: 'OFFERS',
    keywords: ['sale', 'discount', 'final sale', 'return', 'refund'],
  },

  // ========== PRODUCTS & CATEGORIES ==========
  {
    id: 'product-001',
    question: 'How do I search for products?',
    answer: `Finding products on GlobalMarketHub is easy! Here are multiple ways:

🔍 **Search Bar**
1. Click the search icon at the top
2. Type product name, category, or brand
3. Press Enter or click search
4. Browse results

📂 **Browse by Category**
1. Click **Menu** icon (three horizontal lines)
2. Select category (Electronics, Fashion, Beauty, etc.)
3. Filter by price, brand, ratings
4. Click product to view details

⭐ **Filter Options**
- **Price Range** - Set your budget
- **Brand** - Choose specific brands
- **Ratings** - Only show highly rated items
- **Availability** - In stock only
- **Seller** - Filter by trusted sellers

💡 **Advanced Tips**:
- Use specific terms: "Samsung Galaxy A12" instead of "phone"
- Check customer reviews and ratings
- Compare prices across sellers
- Look for verified seller badges

Can't find what you're looking for? Describe the product and I'll help!`,
    category: 'PRODUCTS',
    keywords: ['search', 'product', 'find', 'category', 'browse'],
  },
  {
    id: 'product-002',
    question: 'Are product prices negotiable?',
    answer: `**Price Policy at GlobalMarketHub**:

❌ **Fixed Prices**
- All listed prices are fixed and final
- Not negotiable through chat or support
- Same price for all customers

✅ **Ways to Get Better Prices**:
- **Use Coupons** - Apply discount codes for savings
- **Flash Sales** - Limited-time discounts throughout the day
- **Seasonal Sales** - Big discounts during festivals
- **Category Deals** - Regular discounts on specific categories
- **New User Offer** - 20% discount on first purchase
- **Compare Sellers** - Same product may be cheaper from different sellers

**Price Comparison**:
- Multiple sellers sell the same product
- Prices vary slightly between sellers
- Click different seller options to compare
- Choose based on price + seller rating + delivery speed

**Price Drops**:
- Products may go on sale after being listed
- You can add to **Wishlist** to track price changes
- Get notified when price drops

Looking for a specific product? I can help you find the best deal!`,
    category: 'PRODUCTS',
    keywords: ['price', 'cost', 'negotiate', 'discount', 'cheaper'],
  },
  {
    id: 'product-003',
    question: 'What brands and categories do you offer?',
    answer: `GlobalMarketHub offers a wide range of products! Here's what we have:

📱 **Electronics**
- Smartphones & Accessories
- Laptops & Computers
- Tablets & E-readers
- Audio & Speakers
- Smart Home Devices

👗 **Fashion**
- Men's Clothing
- Women's Clothing
- Shoes & Footwear
- Accessories
- Designer Brands

💄 **Beauty & Personal Care**
- Skincare Products
- Haircare & Cosmetics
- Fragrances
- Health & Wellness
- Personal Hygiene

🏠 **Home & Living**
- Furniture
- Kitchen Appliances
- Bedding & Decor
- Lighting
- Organization

🎮 **Books & Media**
- Books & E-books
- Educational Materials
- Movies & Music
- Gaming Products

**Popular Brands**:
Samsung, Apple, Sony, HP, Lenovo, Nike, Adidas, L'Oreal, Philips, and 1000+ more!

**Browse Now**:
1. Click **Categories** in the menu
2. Select what interests you
3. Filter by brand if needed
4. Compare and add to cart

Looking for something specific? Tell me the product type!`,
    category: 'PRODUCTS',
    keywords: ['brand', 'category', 'products', 'available', 'offer', 'sell'],
  },

  // ========== DELIVERY & LOGISTICS ==========
  {
    id: 'delivery-001',
    question: 'Do you deliver to my area?',
    answer: `We deliver to most areas in Bangladesh! To check if we deliver to you:

**Check Delivery Availability**:
1. Add an item to cart
2. Go to **Checkout**
3. Enter your delivery address
4. System shows if delivery is available
5. Choose delivery speed (Standard or Express)

📍 **Our Coverage**:
✅ **All Dhaka Districts** - Dhaka, Narayanganj, Gazipur, Tangail
✅ **Major Cities** - Chittagong, Sylhet, Khulna, Rajshahi, Barisal
✅ **Growing Coverage** - We're expanding to more areas monthly

⚠️ **Remote Areas**:
- Some remote areas may take 5-7 days
- May have higher delivery charges
- Alternative: Ship to nearest city address

**Delivery Options**:
- **Standard**: 1-2 days (Dhaka), 3-5 days (Other areas)
- **Express**: Same-day (Dhaka if ordered before 2 PM), Next-day (other areas)

**Track Your Delivery**:
- Real-time tracking available
- SMS/Email updates sent automatically
- Contact courier directly for urgent issues

Your area not showing up? Contact support and we'll check what's possible!`,
    category: 'DELIVERY',
    keywords: ['delivery', 'area', 'location', 'ship', 'available'],
  },
  {
    id: 'delivery-002',
    question: 'What is the delivery charge?',
    answer: `**Delivery Charges Explained**:

📊 **Standard Delivery** (1-2 days from Dhaka)
- **Inside Dhaka**: Free delivery on orders above 500 TK (50 TK under 500 TK)
- **Outside Dhaka**: 50-150 TK depending on distance

⚡ **Express Delivery** (Same-day or next-day)
- **Dhaka Express**: 99 TK (if ordered before 2 PM)
- **Same-City Express**: 149 TK
- **Cross-District Express**: 199 TK

**Free Delivery**:
✓ Orders above 500 TK (Dhaka)
✓ Flash sale items (specific times)
✓ Promotional campaigns
✓ Bulk orders (seller dependent)

**How Charges Work**:
1. Add items to cart
2. Delivery cost shown at **Checkout**
3. Based on your address and delivery speed
4. Free shipping threshold: 500 TK

**Reduce Delivery Cost**:
- Bundle items to reach 500 TK threshold
- Use standard delivery when possible
- Look for free shipping promotions
- Check seller offers (some give free shipping)

Delivery charges seem high? Let me know your location and I can suggest options!`,
    category: 'DELIVERY',
    keywords: ['delivery charge', 'shipping', 'cost', 'free delivery', 'charge', 'fee'],
  },
  {
    id: 'delivery-003',
    question: 'Can I change my delivery address after placing order?',
    answer: `**Delivery Address Changes**:

⏱️ **Timing is Critical**:
- **Within 30 minutes**: Easy to change (order still processing)
- **30 min - 2 hours**: May be possible, but hurry!
- **After 2 hours**: Difficult (order likely already shipped)

**How to Change Address**:
1. Go to **My Orders**
2. Find your order
3. If still says "Pending", click **Edit Address**
4. Enter new address
5. Confirm change

⚠️ **Important**:
- Must change BEFORE order ships
- New address must be in delivery area
- Some sellers may not allow changes
- If too late, you'll need to return & reorder

**If Address Can't Be Changed**:
1. **Contact Support**: Provide your Order Number and new address
2. Ask if order can be **redirected** to new location
3. May need to pay additional delivery charge
4. Human team will help escalate

**Pro Tip**: Double-check delivery address BEFORE completing payment!

Need help changing your address? Share your **Order Number** and new location!`,
    category: 'DELIVERY',
    keywords: ['change', 'delivery', 'address', 'different', 'redirect'],
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

const QUERY_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'last',
  'me',
  'most',
  'of',
  'on',
  'or',
  'the',
  'this',
  'to',
  'was',
  'what',
  'which',
  'with',
]);

function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !QUERY_STOP_WORDS.has(token));
}

/**
 * Find relevant FAQ items based on user query
 */
export function findRelevantFAQs(query: string, limit: number = 3): FAQItem[] {
  const lowerQuery = query.toLowerCase();
  const queryTokens = normalizeTokens(query);
  
  return SUPPORT_KB
    .map((faq) => {
      let score = 0;
      let strongSignalCount = 0;
      
      // Exact question match
      if (faq.question.toLowerCase().includes(lowerQuery)) {
        score += 10;
        strongSignalCount += 1;
      }
      
      // Keyword matches
      const matchedKeywords = faq.keywords.filter((kw) =>
        lowerQuery.includes(kw.toLowerCase())
      );
      score += matchedKeywords.length * 3;
      strongSignalCount += matchedKeywords.length;
      
      // Question word matches
      const questionTokens = normalizeTokens(faq.question);
      const commonWords = queryTokens.filter((token) =>
        questionTokens.some((questionToken) =>
          questionToken.includes(token) || token.includes(questionToken)
        )
      );
      score += commonWords.length;

      // Keep category intent strong by rejecting weak/noisy overlaps.
      if (strongSignalCount === 0 && commonWords.length < 2) {
        score = 0;
      }
      
      return { faq, score, strongSignalCount, commonWordsCount: commonWords.length };
    })
    .filter(({ score, strongSignalCount, commonWordsCount }) => {
      if (score < 3) return false;
      if (strongSignalCount > 0) return true;
      return commonWordsCount >= 3;
    })
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
