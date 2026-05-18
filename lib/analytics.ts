export interface SessionMeta {
  sessionId: string;
  templateId: string;
  templateName: string;
  inputType: 'url' | 'spec' | 'template';
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  firstActionDone: boolean;
  hasErrors: boolean;
  userQueries: string[];
}

const INDEX_KEY = 'crow-sessions-index';

export function trackSession(meta: SessionMeta) {
  if (typeof window === 'undefined') return;
  const index = getSessionIndex();
  const existing = index.find((s) => s.sessionId === meta.sessionId);
  if (existing) {
    Object.assign(existing, meta);
  } else {
    index.push(meta);
  }
  // Keep only the 100 most recent sessions to prevent unbounded growth
  const trimmed = index
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, 100);
  localStorage.setItem(INDEX_KEY, JSON.stringify(trimmed));
}

export function getSessionIndex(): SessionMeta[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordSignup() {
  if (typeof window === 'undefined') return;
  const key = 'crow-signups';
  const raw = localStorage.getItem(key);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  localStorage.setItem(key, String(count + 1));
}

export function getSignupCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem('crow-signups');
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export function getRecentSessions(limit = 50): SessionMeta[] {
  return getSessionIndex()
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, limit);
}

export function getStats() {
  const sessions = getSessionIndex();
  const total = sessions.length;
  const avgMessages = total
    ? Math.round(sessions.reduce((s, m) => s + m.messageCount, 0) / total)
    : 0;
  const signups = getSignupCount();
  const conversion = total ? Math.round((signups / total) * 100) : 0;
  const byInput: Record<string, number> = {};
  for (const s of sessions) {
    byInput[s.inputType] = (byInput[s.inputType] || 0) + 1;
  }
  return { total, avgMessages, signups, conversion, byInput };
}

export function getCommonQueries(limit = 10): { query: string; count: number }[] {
  const sessions = getSessionIndex();
  const freq: Record<string, number> = {};
  for (const s of sessions) {
    for (const q of s.userQueries) {
      freq[q] = (freq[q] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
