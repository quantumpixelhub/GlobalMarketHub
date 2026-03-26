import { getOrCreateClientSessionId } from '@/lib/clientSession';

export type RankingMetricContext = {
  experimentKey: string;
  variant: 'A' | 'B';
  endpoint: string;
  query?: string;
  categoryId?: string;
  sortMode?: string;
  resultCount?: number;
};

export function trackRankingClick(context: RankingMetricContext, productId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    experimentKey: context.experimentKey,
    variant: context.variant,
    eventType: 'click',
    endpoint: context.endpoint,
    query: context.query,
    categoryId: context.categoryId,
    sortMode: context.sortMode,
    resultCount: context.resultCount,
    productId,
    sessionId: getOrCreateClientSessionId(),
    metadata: {
      source: 'product_card_click',
      timestamp: new Date().toISOString(),
    },
  };

  const url = '/api/ranking/metrics';
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    // Ignore and fallback to fetch.
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Metrics failures should not impact product navigation.
  });
}
