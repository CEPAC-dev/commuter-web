import type { AuthResponse, SignInPayload, UserSignupPayload } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signIn(payload: SignInPayload, role: 'user' | 'driver' = 'user'): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Sign in failed' }));
    throw new Error(err.message ?? 'Sign in failed');
  }
  const data = await res.json();
  // Map backend response { token, user: { id, name, ... } } → AuthResponse
  return {
    token:      data.token       ?? data.access_token ?? '',
    role,
    userId:     String(data.user?.id ?? ''),
    name:       data.user?.name  ?? data.name ?? '',
    isVerified: true,
    isApproved: true,
  };
}

export async function signUpUser(payload: UserSignupPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Signup failed' }));
    throw new Error(err.message ?? 'Signup failed');
  }
  const data = await res.json();
  // Map backend response { token, user: { id, name, ... } } → AuthResponse.
  // Always force role='user' here — this endpoint only registers users.
  return {
    token:      data.token       ?? data.access_token ?? '',
    role:       'user',
    userId:     String(data.user?.id ?? data.userId ?? ''),
    name:       data.user?.name  ?? data.name ?? payload.name,
    isVerified: Boolean(data.user?.email_verified_at ?? data.isVerified ?? false),
    isApproved: true,
  };
}

export async function signUpDriver(formData: FormData): Promise<{ message: string; userId: string }> {
  const res = await fetch(`${API_BASE}/signup/driver`, {
    method: 'POST',
    body: formData, // multipart — do NOT set Content-Type manually
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Driver signup failed' }));
    throw new Error(err.message ?? 'Driver signup failed');
  }
  return res.json();
}

export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/email/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to send OTP' }));
    throw new Error(err.message ?? 'Failed to send OTP');
  }
}

export async function verifyOtp(email: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/email/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Invalid or expired code' }));
    throw new Error(err.message ?? 'Invalid or expired code');
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to load profile' }));
    throw new Error(err.message ?? 'Failed to load profile');
  }
  const data = await res.json();
  // Normalise backend field names to our UserProfile shape
  const u = data.user ?? data;
  const profile: UserProfile = {
    id:              String(u.id ?? ''),
    name:            u.name ?? '',
    email:           u.email ?? '',
    phone:           u.phone ?? u.phone_number ?? '',
    gender:          u.gender ?? 'male',
    date_of_birth:   u.date_of_birth ?? u.dob ?? '',
    avatar_url:      u.avatar_url ?? null,
    joined_at:       u.joined_at ?? u.created_at ?? '',
    rating:          Number(u.rating ?? 5),
    total_cycles:    Number(u.total_cycles ?? 0),
    active_cycles:   Number(u.active_cycles ?? 0),
    wallet_balance:  Number(u.wallet_balance ?? 0),
    gender_pref:     u.gender_pref ?? 'mixed',
    walk_minutes:    ([0, 5, 10].includes(Number(u.walk_minutes)) ? Number(u.walk_minutes) : 0) as 0 | 5 | 10,
    seat_preference: u.seat_preference ?? 'any',
    saved_locations: u.saved_locations ?? [],
    whatsapp_number: u.whatsapp_number ?? '',
    province:        u.province ?? '',
    district:        u.district ?? '',
    sub_district:    u.sub_district ?? '',
    building:        u.building ?? '',
    street:          u.street ?? '',
    landmark:        u.landmark ?? '',
  };
  return profile;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message ?? 'Update failed');
  }
  return getUserProfile();
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
}

export async function verifyForgotOtp(email: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Invalid or expired code' }));
    throw new Error(err.message ?? 'Invalid or expired code');
  }
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
  password_confirmation: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password, password_confirmation }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error(err.message ?? 'Reset failed');
  }
}

export async function changePassword(
  current_password: string,
  password: string,
  password_confirmation: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/password/change`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ current_password, password, password_confirmation }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Password change failed' }));
    throw new Error(err.message ?? 'Password change failed');
  }
}

export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// New flexible auth API — uses the shared `call` client and the confirmed
// backend /register schema. Use this for any NEW code. Legacy helpers above
// stay for back-compat with existing call sites.
// ─────────────────────────────────────────────────────────────────────────────

import { call } from './client';

export interface RegisterPayload {
  role:                  'driver' | 'user';
  name:                  string;
  email:                 string;
  phone_number:          string;
  whatsapp_number?:      string;
  province:              string;
  gender:                'male' | 'female';
  birthdate:             string;          // "YYYY-MM-DD"
  district:              string;
  sub_district?:         string;
  building?:             string;
  street?:               string;
  landmark?:             string;
  password:              string;
  password_confirmation: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

// Response shapes are intentionally loose — adjust as backend confirms schema.
export interface AuthApiResponse {
  token?:        string;
  access_token?: string;
  role?:         string;
  user?: {
    id:    string | number;
    name:  string;
    email: string;
    role:  string;
  };
  message?: string;
}

export function extractToken(res: AuthApiResponse): string {
  return res.token ?? res.access_token ?? '';
}
export function extractRole(res: AuthApiResponse): string {
  return res.role ?? res.user?.role ?? '';
}
export function extractName(res: AuthApiResponse): string {
  return res.user?.name ?? '';
}
export function extractId(res: AuthApiResponse): string {
  return String(res.user?.id ?? '');
}

const authApi = {
  register: (payload: RegisterPayload) =>
    call<AuthApiResponse>('register', {
      method: 'POST',
      body:   payload as unknown as Record<string, unknown>,
      auth:   false,
    }),

  login: (payload: LoginPayload) =>
    call<AuthApiResponse>('login', {
      method: 'POST',
      body:   payload as unknown as Record<string, unknown>,
      auth:   false,
    }),

  logout: () => call<{ message: string }>('logout', { method: 'POST' }),

  refresh: () => call<AuthApiResponse>('auth/refresh', { method: 'POST' }),

  forgotPassword: (email: string) =>
    call<{ message: string }>('forgot-password', {
      method: 'POST',
      body:   { email },
      auth:   false,
    }),

  resetPassword: (payload: {
    token:                 string;
    email:                 string;
    password:              string;
    password_confirmation: string;
  }) =>
    call<{ message: string }>('reset-password', {
      method: 'POST',
      body:   payload as unknown as Record<string, unknown>,
      auth:   false,
    }),
};

export default authApi;

