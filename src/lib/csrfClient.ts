/**
 * CSRF Token Management for Frontend
 * Fetches, stores, and includes CSRF tokens in form submissions
 */

interface CSRFTokenResponse {
  token: string;
  sessionId: string;
}

// In-memory token cache (regenerate every 5 minutes for security)
let cachedToken: string | null = null;
let cachedSessionId: string | null = null;
let tokenExpiryTime: number = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key based on the current time window
 * Ensures tokens are refreshed periodically
 */
function shouldRefreshToken(): boolean {
  return !cachedToken || !cachedSessionId || Date.now() > tokenExpiryTime;
}

/**
 * Fetch fresh CSRF token from the server
 * Called on component mount or when token expires
 */
export async function getCSRFToken(): Promise<{
  token: string;
  sessionId: string;
}> {
  // Return cached token if still valid
  if (!shouldRefreshToken()) {
    return {
      token: cachedToken!,
      sessionId: cachedSessionId!,
    };
  }

  try {
    // Generate a unique session ID for this browser session
    const sessionId =
      typeof window !== 'undefined'
        ? localStorage.getItem('_csrf_session_id') ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : '';

    if (typeof window !== 'undefined') {
      localStorage.setItem('_csrf_session_id', sessionId);
    }

    // Fetch new token - this endpoint should be public (no auth required)
    // The token is retrieved from the X-CSRF-Token header in response
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      headers: {
        'X-Session-Id': sessionId,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies if using cookie-based CSRF
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }

    // Token can be in response body or header
    let token = response.headers.get('X-CSRF-Token');

    if (!token) {
      const data = (await response.json()) as CSRFTokenResponse;
      token = data.token;
    }

    if (!token) {
      throw new Error('No CSRF token received from server');
    }

    // Cache the token
    cachedToken = token;
    cachedSessionId = sessionId;
    tokenExpiryTime = Date.now() + TOKEN_CACHE_DURATION;

    return {
      token,
      sessionId,
    };
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Return empty token if fetch fails - server will validate
    return {
      token: '',
      sessionId: '',
    };
  }
}

/**
 * Invalidate current cached token (use after logout)
 */
export function invalidateCSRFToken(): void {
  cachedToken = null;
  cachedSessionId = null;
  tokenExpiryTime = 0;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('_csrf_session_id');
  }
}

/**
 * Prepare request headers with CSRF token
 * Use in fetch calls for state-changing requests
 */
export async function getCSRFHeaders(): Promise<Record<string, string>> {
  const { token, sessionId } = await getCSRFToken();

  return {
    'X-CSRF-Token': token,
    'X-Session-Id': sessionId,
    'Content-Type': 'application/json',
  };
}

/**
 * Add CSRF token to FormData (for file uploads)
 */
export async function addCSRFToFormData(formData: FormData): Promise<FormData> {
  const { token, sessionId } = await getCSRFToken();

  formData.append('_csrf', token);
  formData.append('_session_id', sessionId);

  return formData;
}

/**
 * Add CSRF token to JSON request body
 */
export async function addCSRFToBody(
  body: Record<string, any>
): Promise<Record<string, any>> {
  const { token, sessionId } = await getCSRFToken();

  return {
    ...body,
    _csrf: token,
    _session_id: sessionId,
  };
}

/**
 * Wrapper for fetch requests that automatically includes CSRF protection
 */
export async function secureFetch(
  url: string,
  options: RequestInit & {
    method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: Record<string, any>;
  } = {}
): Promise<Response> {
  const method = options.method || 'GET';

  // Only add CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const headers = await getCSRFHeaders();

    let bodyToSend: string | undefined;
    if (options.body && typeof options.body === 'object') {
      const bodyWithCsrf = await addCSRFToBody(options.body);
      bodyToSend = JSON.stringify(bodyWithCsrf);
    } else if (options.body && typeof options.body === 'string') {
      bodyToSend = options.body;
    }

    return fetch(url, {
      ...options,
      method,
      headers: {
        ...headers,
        ...options.headers,
      },
      body: bodyToSend,
      credentials: 'include',
    });
  }

  return fetch(url, options);
}

/**
 * Handle CSRF token validation errors
 * Returns true if error is CSRF-related
 */
export function isCSRFError(error: any): boolean {
  if (!error) return false;

  // Check for CSRF-specific error status codes
  if (error.status === 403) {
    const message = error.message || error.toString();
    if (
      message.includes('CSRF') ||
      message.includes('csrf') ||
      message.includes('token')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Handle CSRF errors in response
 * Refreshes token and returns true if token was stale
 */
export async function handleCSRFError(response: Response): Promise<boolean> {
  if (response.status === 403) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();

      if (
        data.error?.includes('CSRF') ||
        data.error?.includes('token') ||
        data.message?.includes('CSRF')
      ) {
        // Invalidate token and retry
        invalidateCSRFToken();
        return true;
      }
    }
  }

  return false;
}
