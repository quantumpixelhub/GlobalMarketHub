import DOMPurify from 'dompurify';

/**
 * Sanitization configuration for different content types
 */
const SANITIZATION_CONFIG = {
  // Strict: for product descriptions, reviews - allow basic formatting
  strict: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    KEEP_CONTENT: true,
  },
  // Default: for user-generated content - minimal HTML
  default: {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // Plain text: no HTML allowed
  plaintext: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Raw HTML/text content from user input
 * @param type - Type of content ('strict', 'default', or 'plaintext')
 * @returns Sanitized safe HTML string
 */
export function sanitizeHtml(
  dirty: string,
  type: 'strict' | 'default' | 'plaintext' = 'default'
): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const config = SANITIZATION_CONFIG[type];
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text (strip all HTML)
 * @param text - Text content from user input
 * @returns Plain text without HTML
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize review content (title + text)
 * @param review - Review object with title and content
 * @returns Sanitized review
 */
export function sanitizeReview(review: {
  title: string;
  content: string;
}): {
  title: string;
  content: string;
} {
  return {
    title: sanitizeText(review.title),
    content: sanitizeHtml(review.content, 'default'),
  };
}

/**
 * Sanitize product data
 * @param product - Product object with description
 * @returns Sanitized product
 */
export function sanitizeProduct(product: {
  title: string;
  description: string;
}): {
  title: string;
  description: string;
} {
  return {
    title: sanitizeText(product.title),
    description: sanitizeHtml(product.description, 'strict'),
  };
}

/**
 * Sanitize user profile data
 * @param profile - Profile object with name and bio
 * @returns Sanitized profile
 */
export function sanitizeProfile(profile: {
  firstName: string;
  lastName: string;
  bio?: string;
}): {
  firstName: string;
  lastName: string;
  bio?: string;
} {
  return {
    firstName: sanitizeText(profile.firstName),
    lastName: sanitizeText(profile.lastName),
    bio: profile.bio ? sanitizeHtml(profile.bio, 'default') : undefined,
  };
}

/**
 * Sanitize array of URLs (e.g., image URLs in reviews)
 * @param urls - Array of URLs
 * @returns Sanitized URLs
 */
export function sanitizeUrls(urls: string[]): string[] {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls
    .filter((url) => typeof url === 'string' && url.trim().length > 0)
    .map((url) => {
      try {
        // Validate URL format
        new URL(url);
        // Only allow https URLs for security
        const parsed = new URL(url);
        if (!parsed.protocol.startsWith('https')) {
          return '';
        }
        return parsed.toString();
      } catch {
        return '';
      }
    })
    .filter((url) => url.length > 0);
}

/**
 * Sanitize order/address data
 * @param data - Address data object
 * @returns Sanitized address data
 */
export function sanitizeAddress(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  postCode?: string;
}): typeof data {
  return {
    firstName: sanitizeText(data.firstName),
    lastName: sanitizeText(data.lastName),
    phone: sanitizeText(data.phone),
    email: sanitizeText(data.email),
    address: sanitizeText(data.address),
    division: data.division ? sanitizeText(data.division) : undefined,
    district: data.district ? sanitizeText(data.district) : undefined,
    upazila: data.upazila ? sanitizeText(data.upazila) : undefined,
    postCode: data.postCode ? sanitizeText(data.postCode) : undefined,
  };
}

/**
 * Check if string contains potential XSS patterns (pre-sanitization check)
 * @param str - String to check
 * @returns true if potential XSS detected
 */
export function hasXssPatterns(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /eval\(/gi,
    /expression\(/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(str));
}

/**
 * Validate and sanitize email addresses
 * @param email - Email address to validate
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = sanitizeText(email).toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize and validate phone numbers (Bangladesh format)
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except leading +
  const sanitized = phone.replace(/[^\d+]/g, '').trim();

  // Bangladesh phone regex: +8801XXXXXXXXX or 01XXXXXXXXX
  const phoneRegex = /^\+?880\d{9,10}$/;
  if (!phoneRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Deep sanitize an object recursively
 * @param obj - Object to sanitize
 * @param type - Type of sanitization to apply
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  type: 'strict' | 'default' | 'plaintext' = 'default'
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value, type);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, type);
    }
  }

  return sanitized as T;
}
