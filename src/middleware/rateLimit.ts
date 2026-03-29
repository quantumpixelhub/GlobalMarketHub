import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed systems
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown'
  );
}

/**
 * Rate limit middleware
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the window
 */
export function createRateLimiter(
  windowMs: number,
  maxRequests: number
) {
  return async (request: NextRequest) => {
    const ip = getClientIp(request);
    const key = `${ip}-${request.nextUrl.pathname}`;
    const now = Date.now();

    // Get or initialize request count
    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Reset window
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, record);
    }

    // Increment count
    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Too many requests from this IP. Please try again after ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
          },
        }
      );
    }

    // Store updated record
    requestCounts.set(key, record);

    return null; // Request is allowed
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Auth endpoints: 5 attempts per 15 minutes
  auth: createRateLimiter(15 * 60 * 1000, 5),

  // Login specific: 5 attempts per 15 minutes
  login: createRateLimiter(15 * 60 * 1000, 5),

  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter(60 * 60 * 1000, 3),

  // Password change: 5 attempts per hour
  passwordChange: createRateLimiter(60 * 60 * 1000, 5),

  // General API: 30 requests per minute
  api: createRateLimiter(60 * 1000, 30),

  // Search: 60 requests per minute
  search: createRateLimiter(60 * 1000, 60),

  // Payment: 3 attempts per hour
  payment: createRateLimiter(60 * 60 * 1000, 3),

  // Strict for sensitive operations: 2 attempts per minute
  sensitive: createRateLimiter(60 * 1000, 2),
};

/**
 * Cleanup old entries (call periodically to prevent memory leaks)
 */
export function cleanupRateLimitCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime + 60000) {
      // Remove entries older than 1 minute past reset
      requestCounts.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Cleanup every 5 minutes
if (typeof globalThis !== 'undefined') {
  globalThis.rateLimitCleanup ||= setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
}

/**
 * Middleware wrapper to check rate limit and allow request to proceed if OK
 */
export async function withRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>
) {
  const response = await limiter(request);
  if (response) {
    return response; // Rate limit exceeded
  }
  return null; // Request allowed, continue processing
}
