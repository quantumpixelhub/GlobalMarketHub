export function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'gmh_session_id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(storageKey, generated);
  return generated;
}
