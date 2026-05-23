// Single source of truth for client-side session storage.
// Writes to BOTH localStorage (read by client code) and cookie (read by middleware).

const KEYS = {
  token:    'commuter_token',
  role:     'commuter_role',
  name:     'commuter_name',
  id:       'commuter_user_id',
  userData: 'commuter_user_data',
} as const;

export interface StoredSession {
  token: string;
  role:  string;
  name:  string;
  id:    string;
}

export function saveSession(session: StoredSession): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(KEYS.token, session.token);
  localStorage.setItem(KEYS.role,  session.role);
  localStorage.setItem(KEYS.name,  session.name);
  localStorage.setItem(KEYS.id,    session.id);

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie =
    `${KEYS.token}=${encodeURIComponent(session.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie =
    `${KEYS.role}=${encodeURIComponent(session.role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function saveUserData(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEYS.userData, JSON.stringify(data)); } catch { /* quota */ }
}

export function getUserData(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.userData);
  if (!raw) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.token) ?? readCookie(KEYS.token);
}

export function getRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.role);
}

export function getName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.name);
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.id);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('commuter_email');
  document.cookie = `${KEYS.token}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${KEYS.role}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasValidSession(): boolean {
  const t = getToken();
  return Boolean(t && t !== 'undefined' && t !== 'null');
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
