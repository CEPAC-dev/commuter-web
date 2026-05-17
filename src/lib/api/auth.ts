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
  return res.json();
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
  const res = await fetch(`${API_BASE}/user/profile`, {
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
  };
  return profile;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/profile`, {
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
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error(err.message ?? 'Reset failed');
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
