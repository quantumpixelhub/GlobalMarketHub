// Email Notification Service
// Uses EmailJS for sending emails without backend SMTP server
// Free tier: 200 emails/month

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderAmount: number,
  orderItems: Array<{ title: string; quantity: number; price: number }>
): Promise<{ success: boolean; message: string }> {
  const emailServiceId = process.env.EMAILJS_SERVICE_ID;
  const emailTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!emailServiceId || !emailTemplateId || !emailPublicKey) {
    console.warn('EmailJS credentials not configured - skipping email');
    return {
      success: true,
      message: 'Email service not configured (skipped)',
    };
  }

  const itemsHTML = orderItems
    .map(
      (item) =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price.toLocaleString()}</td>
    </tr>`
    )
    .join('');

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Order Confirmation</h1>
          
          <p>Hi ${customerName},</p>
          
          <p>Thank you for your order! We've received your order and it's being prepared.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total Amount:</strong> ৳${orderAmount.toLocaleString()}</p>
            <p><strong>Status:</strong> <span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px;">Confirmed</span></p>
          </div>
          
          <h3>Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Product</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db;">Qty</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">You can track your order status by logging into your account at GlobalMarketHub.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            GlobalMarketHub | Bangladesh E-Commerce Platform<br>
            Contact: support@globalmarkethub.com
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: emailServiceId,
        template_id: emailTemplateId,
        user_id: emailPublicKey,
        template_params: {
          to_email: customerEmail,
          to_name: customerName,
          subject: `Order Confirmation - ${orderNumber}`,
          html_message: htmlContent,
        },
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Order confirmation email sent',
      };
    } else {
      throw new Error('EmailJS send failed');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotificationEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string
): Promise<{ success: boolean; message: string }> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Your Order is on the Way!</h1>
          
          <p>Hi ${customerName},</p>
          
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Shipping Details</h2>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Status:</strong> <span style="background-color: #dbeafe; color: #0c4a6e; padding: 4px 8px; border-radius: 4px;">In Transit</span></p>
          </div>
          
          <p>You can track your package using the tracking number above on our website or the courier's app.</p>
          
          <p>Expected delivery: 3-7 business days</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            GlobalMarketHub | Bangladesh E-Commerce Platform
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const emailServiceId = process.env.EMAILJS_SERVICE_ID;
    const emailTemplateId = process.env.EMAILJS_TEMPLATE_ID;
    const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!emailServiceId || !emailTemplateId || !emailPublicKey) {
      return {
        success: true,
        message: 'Email service not configured (skipped)',
      };
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: emailServiceId,
        template_id: emailTemplateId,
        user_id: emailPublicKey,
        template_params: {
          to_email: customerEmail,
          to_name: customerName,
          subject: `Shipping Notification - ${orderNumber}`,
          html_message: htmlContent,
        },
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Shipping notification sent',
      };
    } else {
      throw new Error('EmailJS send failed');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Error sending email`,
    };
  }
}

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(
  customerEmail: string,
  customerName: string,
  productTitle: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Share Your Experience</h1>
          
          <p>Hi ${customerName},</p>
          
          <p>We hope you're happy with your recent purchase of <strong>${productTitle}</strong>!</p>
          
          <p>We'd love to hear your thoughts and read your review. Your feedback helps us improve our products and helps other customers make informed decisions.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/product/${productId}#reviews" 
               style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Write a Review
            </a>
          </div>
          
          <p>Thank you for shopping with us!</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            GlobalMarketHub | Bangladesh E-Commerce Platform
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const emailServiceId = process.env.EMAILJS_SERVICE_ID;
    const emailTemplateId = process.env.EMAILJS_TEMPLATE_ID;
    const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!emailServiceId || !emailTemplateId || !emailPublicKey) {
      return {
        success: true,
        message: 'Email service not configured (skipped)',
      };
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: emailServiceId,
        template_id: emailTemplateId,
        user_id: emailPublicKey,
        template_params: {
          to_email: customerEmail,
          to_name: customerName,
          subject: `We'd love your review for ${productTitle}`,
          html_message: htmlContent,
        },
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Review request email sent',
      };
    } else {
      throw new Error('EmailJS send failed');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Error sending email`,
    };
  }
}
