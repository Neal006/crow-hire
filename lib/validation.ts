const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function isPrivateIp(url: string): boolean {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url.replace(/^https?:\/\//, '').split('/')[0];
  }
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname));
}

export function isValidUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes(' ') || trimmed.includes('\n')) return false;
  try {
    const url = new URL(trimmed);
    return url.hostname.includes('.') && url.hostname.length > 3;
  } catch {
    // Try with https:// prefix
    try {
      const url = new URL(`https://${trimmed}`);
      return url.hostname.includes('.') && url.hostname.length > 3;
    } catch {
      return false;
    }
  }
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const RATE_KEY = 'crow-rate-limit';
const MAX_SESSIONS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

export interface RateStatus {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(): RateStatus {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: MAX_SESSIONS_PER_HOUR, resetAt: Date.now() + HOUR_MS };
  }
  const raw = localStorage.getItem(RATE_KEY);
  const now = Date.now();
  const entries: number[] = raw ? JSON.parse(raw) : [];
  const recent = entries.filter((t) => now - t < HOUR_MS);
  const allowed = recent.length < MAX_SESSIONS_PER_HOUR;
  const resetAt = recent.length > 0 ? recent[0] + HOUR_MS : now + HOUR_MS;
  return {
    allowed,
    remaining: Math.max(0, MAX_SESSIONS_PER_HOUR - recent.length),
    resetAt,
  };
}

export function recordSessionStart() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(RATE_KEY);
  const now = Date.now();
  const entries: number[] = raw ? JSON.parse(raw) : [];
  entries.push(now);
  localStorage.setItem(RATE_KEY, JSON.stringify(entries));
}

export function checkMessageLimit(sessionId: string): { allowed: boolean; remaining: number } {
  if (typeof window === 'undefined') return { allowed: true, remaining: 50 };
  const key = `crow-session-${sessionId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { allowed: true, remaining: 50 };
  try {
    const state = JSON.parse(raw);
    const count = (state.messages?.length || 0);
    return { allowed: count < 50, remaining: Math.max(0, 50 - count) };
  } catch {
    return { allowed: true, remaining: 50 };
  }
}
