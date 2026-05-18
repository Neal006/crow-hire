const USER_ID_KEY = 'crow-user-id';
const SESSION_PREFIX = 'crow-session-';
const TEMPLATE_PREFIX = 'crow-template-';
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const HARD_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `u-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getLocalSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}-${getUserId()}`;
}

export function checkSessionExpired(sessionId: string): {
  expired: boolean;
  reason: 'inactivity' | 'hard' | null;
} {
  if (typeof window === 'undefined') return { expired: false, reason: null };
  const key = getLocalSessionKey(sessionId);
  const raw = localStorage.getItem(key);
  if (!raw) return { expired: false, reason: null };
  try {
    const state = JSON.parse(raw);
    const now = Date.now();
    const lastMsg = state.messages?.[state.messages.length - 1]?.timestamp || state.messages?.[0]?.timestamp || now;
    if (now - lastMsg > INACTIVITY_MS) return { expired: true, reason: 'inactivity' };
    const created = state.messages?.[0]?.timestamp || now;
    if (now - created > HARD_EXPIRY_MS) return { expired: true, reason: 'hard' };
    return { expired: false, reason: null };
  } catch {
    return { expired: false, reason: null };
  }
}

export function clearExpiredSessions() {
  if (typeof window === 'undefined') return;
  const userId = getUserId();
  const now = Date.now();
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`${SESSION_PREFIX}`) || !key.endsWith(`-${userId}`)) continue;
    try {
      const state = JSON.parse(localStorage.getItem(key) || '{}');
      const lastMsg = state.messages?.[state.messages.length - 1]?.timestamp || state.messages?.[0]?.timestamp || now;
      const created = state.messages?.[0]?.timestamp || now;
      if (now - lastMsg > INACTIVITY_MS || now - created > HARD_EXPIRY_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

export function getSessionState(sessionId: string): unknown | null {
  if (typeof window === 'undefined') return null;
  clearExpiredSessions();
  const key = getLocalSessionKey(sessionId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSessionState(sessionId: string, state: unknown) {
  if (typeof window === 'undefined') return;
  const key = getLocalSessionKey(sessionId);
  localStorage.setItem(key, JSON.stringify(state));
}
