import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ApiPassenger {
  id:       number;
  name:     string;
  phone:    string;
  age:      number;
  gender:   'male' | 'female';
  relation: string;
}

export interface PassengerPreferences {
  id?:                           number;
  passenger_id?:                 number;
  gender_preference:             'male' | 'female' | 'any';
  smoking_allowed:               boolean;
  interaction_level:             'quiet' | 'normal' | 'talkative';
  children_allowed:              boolean;
  music_preference:              'no_music' | 'low' | 'normal';
  seat_preference:               'front' | 'back' | 'any';
  walking_distance_preference:   'no_walk' | 'less_than_5_min' | '5_to_10_min' | 'more_than_10_min';
  air_conditioning_preference:   'not_important' | 'preferred' | 'mandatory';
}

export async function getPassengers(): Promise<ApiPassenger[]> {
  const res = await fetch(`${API_BASE}/user/passengers`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch passengers');
  const data = await res.json();
  return data.data ?? [];
}

export async function getPassenger(id: number): Promise<ApiPassenger> {
  const res = await fetch(`${API_BASE}/user/passengers/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch passenger');
  const data = await res.json();
  return data.data;
}

export async function createPassenger(
  payload: Omit<ApiPassenger, 'id'>,
): Promise<ApiPassenger> {
  const res = await fetch(`${API_BASE}/user/passengers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to create passenger');
  }
  const data = await res.json();
  return data.data;
}

export async function updatePassenger(
  id: number,
  payload: Partial<Omit<ApiPassenger, 'id'>>,
): Promise<ApiPassenger> {
  const res = await fetch(`${API_BASE}/user/passengers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to update passenger');
  }
  const data = await res.json();
  return data.data;
}

export async function deletePassenger(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/user/passengers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to delete passenger');
  }
}

export async function getPassengerPreferences(
  passengerId: number,
): Promise<PassengerPreferences | null> {
  const res = await fetch(`${API_BASE}/preferences/user/passengers/${passengerId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch preferences');
  const data = await res.json();
  return data.data ?? null;
}

export async function savePassengerPreferences(
  passengerId: number,
  payload: Omit<PassengerPreferences, 'id' | 'passenger_id'>,
): Promise<PassengerPreferences> {
  const res = await fetch(`${API_BASE}/preferences/user/passengers/${passengerId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to save preferences');
  }
  const data = await res.json();
  return data.data;
}
