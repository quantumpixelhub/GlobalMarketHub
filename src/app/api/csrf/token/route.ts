import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, storeCsrfToken } from '@/middleware/csrf';

/**
 * GET /api/csrf/token
 * Public endpoint to generate and return CSRF tokens
 * Called by frontend on mount to get a token for form submission
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract session ID from header or generate new one
    const sessionId =
      request.headers.get('X-Session-Id') ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate token using the same utility as middleware
    const token = generateCsrfToken();
    
    // Store the token for later validation
    storeCsrfToken(sessionId, token);

    // Return token in both body and header for flexibility
    const response = NextResponse.json(
      {
        token,
        sessionId,
        expiresIn: 86400, // 24 hours in seconds
        message: 'CSRF token generated successfully',
      },
      { status: 200 }
    );

    // Also set token in response header for fetch API access
    response.headers.set('X-CSRF-Token', token);
    response.headers.set('X-Session-Id', sessionId);

    // Allow credentials to maintain session cookies if using them
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Set cache control to prevent caching of tokens
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * CORS preflight for token requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'OK' },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
      },
    }
  );
}
