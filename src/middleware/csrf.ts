import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF token store
 * In production, use Redis or session storage
 */
const csrfTokens = new Map<string, { token: string; expiry: number }>();

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store CSRF token
 */
export function storeCsrfToken(sessionId: string, token: string): void {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  csrfTokens.set(sessionId, { token, expiry });
}

/**
 * Retrieve and validate CSRF token
 */
export function validateCsrfToken(
  sessionId: string,
  providedToken: string
): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check expiry
  if (Date.now() > stored.expiry) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Verify token matches
  return stored.token === providedToken;
}

/**
 * Get session ID from request (from cookie or header)
 */
export function getSessionId(request: NextRequest): string | null {
  // Try to get from Authorization header or session cookie
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    return sessionCookie;
  }

  return null;
}

/**
 * CSRF Protection middleware for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return null; // CSRF not needed for GET requests
  }

  // Skip CSRF check for public endpoints (e.g., webhook endpoints)
  const publicEndpoints = [
    '/api/webhooks/',
    '/api/public/',
  ];

  const pathname = request.nextUrl.pathname;
  if (publicEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    return null;
  }

  const sessionId = getSessionId(request);

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Session required for state-changing requests' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const csrfToken = body._csrf || body.csrfToken || request.headers.get('x-csrf-token');

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token missing', message: 'CSRF token is required for this operation' },
        { status: 403 }
      );
    }

    if (!validateCsrfToken(sessionId, csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', message: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    // Token is valid, allow request to proceed
    return null;
  } catch (error) {
    // If body is not JSON, try to get token from header
    const csrfToken = request.headers.get('x-csrf-token');

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token missing', message: 'CSRF token is required for this operation' },
        { status: 403 }
      );
    }

    if (!validateCsrfToken(sessionId, csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', message: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    return null;
  }
}

/**
 * Cleanup expired CSRF tokens (call periodically)
 */
export function cleanupCsrfTokens(): number {
  const now = Date.now();
  let count = 0;

  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expiry) {
      csrfTokens.delete(sessionId);
      count++;
    }
  }

  return count;
}

// Auto cleanup every 1 hour
if (typeof globalThis !== 'undefined') {
  (globalThis as any).csrfCleanup ||= setInterval(cleanupCsrfTokens, 60 * 60 * 1000);
}

/**
 * Utility to add CSRF token to response for forms
 */
export function addCsrfTokenToResponse(
  response: NextResponse,
  sessionId: string,
  token: string
): NextResponse {
  storeCsrfToken(sessionId, token);
  response.headers.set('X-CSRF-Token', token);
  return response;
}
