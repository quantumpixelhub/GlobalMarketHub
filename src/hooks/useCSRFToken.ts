'use client';

import { useEffect, useState } from 'react';
import {
  getCSRFToken,
  invalidateCSRFToken,
  handleCSRFError,
} from '@/lib/csrfClient';

export interface UseCSRFTokenProps {
  onTokenReady?: () => void;
  autoFetch?: boolean;
}

/**
 * React hook to manage CSRF tokens in components
 * Automatically fetches token on mount and provides utility functions
 */
export function useCSRFToken({
  onTokenReady,
  autoFetch = true,
}: UseCSRFTokenProps = {}) {
  const [token, setToken] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        setLoading(true);
        setError('');

        const { token: newToken, sessionId: newSessionId } =
          await getCSRFToken();

        if (!newToken || !newSessionId) {
          setError('Failed to load security token');
          console.warn('CSRF token fetch returned empty token');
        }

        setToken(newToken);
        setSessionId(newSessionId);
        onTokenReady?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch CSRF token';
        setError(errorMessage);
        console.error('CSRF token fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [autoFetch, onTokenReady]);

  /**
   * Refresh token when needed (e.g., after validation error)
   */
  const refreshToken = async () => {
    try {
      setLoading(true);
      invalidateCSRFToken();
      const { token: newToken, sessionId: newSessionId } =
        await getCSRFToken();
      setToken(newToken);
      setSessionId(newSessionId);
      setError('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh token';
      setError(errorMessage);
      console.error('Token refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Invalidate token (use on logout)
   */
  const clearToken = () => {
    invalidateCSRFToken();
    setToken('');
    setSessionId('');
    setError('');
  };

  /**
   * Handle 403 CSRF errors and refresh if needed
   */
  const handleError = async (response: Response): Promise<boolean> => {
    const wasStale = await handleCSRFError(response);
    if (wasStale) {
      await refreshToken();
    }
    return wasStale;
  };

  /**
   * Get token data as object (for form submission)
   */
  const getTokenData = () => ({
    _csrf: token,
    _session_id: sessionId,
  });

  /**
   * Get token as headers object (for fetch requests)
   */
  const getTokenHeaders = () => ({
    'X-CSRF-Token': token,
    'X-Session-Id': sessionId,
  });

  return {
    token,
    sessionId,
    loading,
    error,
    refreshToken,
    clearToken,
    handleError,
    getTokenData,
    getTokenHeaders,
    ready: !loading && !!token,
  };
}
