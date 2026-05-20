import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface FavouritePlace {
  id:            number;
  nickname:      string;
  location_name: string;
  latitude:      string;
  longitude:     string;
  created_at:    string;
  updated_at:    string;
  user_id:       number;
}

export async function getFavouritePlaces(): Promise<FavouritePlace[]> {
  const res = await fetch(`${API_BASE}/saved-location`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch favourite places');
  const data = await res.json();
  return data.locations ?? [];
}

export async function createFavouritePlace(payload: {
  nickname:      string;
  location_name: string;
  latitude:      number;
  longitude:     number;
}): Promise<FavouritePlace> {
  const nick = payload.nickname.toLowerCase().trim();
  let url: string;
  let body: Record<string, unknown>;

  if (nick === 'home') {
    url  = `${API_BASE}/saved-location/home`;
    body = {
      location_name: payload.location_name,
      latitude:      payload.latitude,
      longitude:     payload.longitude,
    };
  } else if (nick === 'work') {
    url  = `${API_BASE}/saved-location/work`;
    body = {
      location_name: payload.location_name,
      latitude:      payload.latitude,
      longitude:     payload.longitude,
    };
  } else {
    url  = `${API_BASE}/saved-location/other`;
    body = {
      other_nickname: payload.nickname,
      location_name:  payload.location_name,
      latitude:       payload.latitude,
      longitude:      payload.longitude,
    };
  }

  const res = await fetch(url, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to save location');
  }
  const data = await res.json();
  return data.location ?? data.data ?? data;
}

export async function deleteFavouritePlace(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/saved-location/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to delete location');
  }
}
