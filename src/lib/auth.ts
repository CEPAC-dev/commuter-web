import type { AuthResponse, UserRole } from '@/types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function saveSession(response: AuthResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('commuter_token', response.token);
  localStorage.setItem('commuter_role', response.role);
  localStorage.setItem('commuter_name', response.name);
  const maxAge = 7 * 24 * 60 * 60;
  // Persist token + role as cookies so the middleware (server-side) can read them
  document.cookie = `commuter_token=${response.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `commuter_role=${response.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
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

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('commuter_token');
  localStorage.removeItem('commuter_role');
  localStorage.removeItem('commuter_name');
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
