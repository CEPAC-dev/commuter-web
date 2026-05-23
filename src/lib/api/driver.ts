import type { DriverCycleRequest, DriverProfile } from '@/types/driver';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('driver_token') ?? '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchRequests(): Promise<DriverCycleRequest[]> {
  return request<DriverCycleRequest[]>('/api/driver/requests');
}

export async function fetchRequest(id: string): Promise<DriverCycleRequest> {
  return request<DriverCycleRequest>(`/api/driver/requests/${id}`);
}

export async function acceptRequest(id: string): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/accept`, { method: 'POST' });
}

export async function rejectRequest(id: string): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/reject`, { method: 'POST' });
}

export async function raiseRequestPrice(id: string, newPrice: number): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/raise`, {
    method: 'POST',
    body: JSON.stringify({ newPrice }),
  });
}

export async function fetchProfile(): Promise<DriverProfile> {
  return request<DriverProfile>('/api/driver/profile');
}

export async function updateProfile(data: Partial<DriverProfile>): Promise<DriverProfile> {
  return request<DriverProfile>('/api/driver/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadDocument(fieldName: string, file: File): Promise<void> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/driver/documents/${fieldName}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Upload failed with status ${res.status}`);
  }
}

export async function fetchWallet(): Promise<{ balance: number; transactions: unknown[] }> {
  return request<{ balance: number; transactions: unknown[] }>('/api/driver/wallet');
}

// ─────────────────────────────────────────────────────────────────────────────
// New flexible driver API — uses the shared `call` client. Backend-agnostic.
// Use this for any NEW code. Legacy helpers above stay for back-compat.
// ─────────────────────────────────────────────────────────────────────────────

import { call } from './client';

const driverApi = {
  // Profile
  getProfile:           ()                                   => call('driver/profile'),
  updateProfile:        (data: Record<string, unknown>)      => call('driver/profile', { method: 'PATCH', body: data }),

  // Documents (multipart)
  uploadDocument:       (field: string, file: File) => {
    const fd = new FormData();
    fd.append(field, file);
    return call(`driver/documents/${field}`, { method: 'POST', body: fd });
  },

  // Requests
  getAvailableRequests: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params) : '';
    return call(`driver/requests${q}`);
  },
  getRequestDetail:     (id: string)                         => call(`driver/requests/${id}`),
  acceptRequest:        (id: string)                         => call(`driver/requests/${id}/accept`, { method: 'POST' }),
  rejectRequest:        (id: string)                         => call(`driver/requests/${id}/reject`, { method: 'POST' }),
  raisePrice:           (id: string, price: number)          => call(`driver/requests/${id}/raise`, { method: 'POST', body: { new_price: price } }),

  // Cycles
  getCycles:            ()                                   => call('driver/cycles'),
  cancelCycle:          (id: string)                         => call(`driver/cycles/${id}/cancel`, { method: 'POST' }),

  // Trip
  getTodayTrip:         ()                                   => call('driver/trip/today'),
  startTrip:            (id: string)                         => call(`driver/trip/${id}/start`, { method: 'POST' }),
  updateLocation:       (id: string, lat: number, lng: number, heading: number) =>
    call(`driver/trip/${id}/location`, {
      method: 'PATCH',
      body:   { driver_lat: lat, driver_lng: lng, driver_heading: heading },
    }),
  confirmPickup:        (tripId: string, stopId: string, code: string) =>
    call(`driver/trip/${tripId}/stops/${stopId}/pickup`, { method: 'POST', body: { code } }),
  markNoShow:           (tripId: string, stopId: string) =>
    call(`driver/trip/${tripId}/stops/${stopId}/no-show`, { method: 'POST' }),
  confirmDropoff:       (tripId: string, stopId: string) =>
    call(`driver/trip/${tripId}/stops/${stopId}/dropoff`, { method: 'POST' }),
  ratePassengers:       (tripId: string, ratings: { passenger_id: string; is_positive: boolean }[]) =>
    call(`driver/trip/${tripId}/rate`, { method: 'POST', body: { ratings } }),

  // Wallet
  getWallet:            ()                                   => call('driver/wallet'),
  withdraw:             (amount: number)                     => call('driver/wallet/withdraw', { method: 'POST', body: { amount } }),

  // Chat
  getChatList:          (tripId: string)                     => call(`trips/${tripId}/chat`),
  getChat:              (tripId: string, passengerId: string) => call(`trips/${tripId}/chat/${passengerId}`),
  sendChat:             (tripId: string, passengerId: string, text: string) =>
    call(`trips/${tripId}/chat/${passengerId}`, { method: 'POST', body: { text } }),

  // Notifications
  getNotifications:     ()                                   => call('driver/notifications'),
};

export default driverApi;
