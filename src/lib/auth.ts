import type { AuthResponse, UserRole } from '@/types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function saveSession(response: AuthResponse): void {
  if (typeof window === 'undefined') return;
  if (!response?.token || (response.role !== 'user' && response.role !== 'driver')) {
    // Refuse to write a half-baked session — would otherwise produce
    // `commuter_token=undefined` cookies and break middleware routing.
    throw new Error('Invalid auth response: missing token or role');
  }
  localStorage.setItem('commuter_token', response.token);
  localStorage.setItem('commuter_role', response.role);
  localStorage.setItem('commuter_name', response.name ?? '');
  localStorage.setItem('commuter_user_id', String(response.userId ?? ''));
  const maxAge = 7 * 24 * 60 * 60;
  // Persist token + role as cookies so the middleware (server-side) can read them.
  // Mark Secure on HTTPS only, so local http dev still works.
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `commuter_token=${response.token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `commuter_role=${response.role}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_token');
}

export function getRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_role') as UserRole | null;
}

export function getName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_name');
}

/** Returns the current user's numeric ID, or null if not in session. */
export function getUserId(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('commuter_user_id');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('commuter_token');
  localStorage.removeItem('commuter_role');
  localStorage.removeItem('commuter_name');
  localStorage.removeItem('commuter_user_id');
  document.cookie = 'commuter_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'commuter_role=; path=/; max-age=0; SameSite=Lax';
}

export async function logout(): Promise<void> {
  const token = getToken();
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    await fetch(`${API_BASE}/api/logout`, {
      method: 'POST',
      headers,
    });
  } catch {
    // Ignore errors on logout API call
  } finally {
    clearSession();
  }
}

// Legacy aliases used by older driver portal code
export const setToken = (token: string) => localStorage.setItem('commuter_token', token);
export const clearToken = clearSession;
