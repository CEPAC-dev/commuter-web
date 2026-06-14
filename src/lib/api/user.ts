// User API module — flexible, backend-agnostic.
// Every call returns unknown until the backend schema is confirmed.

import { call, ApiError } from './client';
import type { CommutePreferences, UserProfile } from '@/types/user';

type ApiRecord = Record<string, unknown>;

const PROFILE_DEFAULTS: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  whatsapp_number: '',
  gender: '',
  date_of_birth: '',
  avatar_url: null,
  joined_at: '',
  rating: 0,
  total_cycles: 0,
  active_cycles: 0,
  wallet_balance: 0,
  saved_locations: [],
  gender_pref: 'mixed',
  walk_minutes: 0,
  seat_preference: 'any',
  province: '',
  district: '',
  sub_district: '',
  building: '',
  street: '',
  landmark: '',
};

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extractProfilePayload(payload: unknown): ApiRecord {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  return asRecord(data.user).id || asRecord(data.user).email
    ? asRecord(data.user)
    : asRecord(data.profile).id || asRecord(data.profile).email
      ? asRecord(data.profile)
      : Object.keys(data).length
        ? data
        : asRecord(root.user).id || asRecord(root.user).email
          ? asRecord(root.user)
          : asRecord(root.profile).id || asRecord(root.profile).email
            ? asRecord(root.profile)
            : root;
}

function buildProfileFromLocalStorage(): UserProfile {
  // Try the full user object stored at sign-in / sign-up first
  const stored = (typeof window !== 'undefined')
    ? (() => { try { return JSON.parse(localStorage.getItem('commuter_user_data') ?? 'null'); } catch { return null; } })()
    : null;

  if (stored && typeof stored === 'object') {
    // Merge with any individual keys for fields the server didn't return
    const merged = {
      ...stored,
      name:  stored.name  ?? (typeof window !== 'undefined' ? localStorage.getItem('commuter_name')  : null) ?? '',
      email: stored.email ?? (typeof window !== 'undefined' ? localStorage.getItem('commuter_email') : null) ?? '',
      id:    stored.id    ?? (typeof window !== 'undefined' ? localStorage.getItem('commuter_user_id') : null) ?? '',
    } as Record<string, unknown>;
    return normalizeUserProfile(merged);
  }

  // Minimal fallback from individual keys
  const name  = (typeof window !== 'undefined' ? localStorage.getItem('commuter_name')    : null) ?? '';
  const email = (typeof window !== 'undefined' ? localStorage.getItem('commuter_email')   : null) ?? '';
  const id    = (typeof window !== 'undefined' ? localStorage.getItem('commuter_user_id') : null) ?? '';
  return { ...PROFILE_DEFAULTS, id, name, email };
}

export function normalizeUserProfile(payload: unknown): UserProfile {
  const u = extractProfilePayload(payload);
  const gender = firstString(u.gender).toLowerCase();
  const seatPreference = firstString(u.seat_preference) || PROFILE_DEFAULTS.seat_preference;
  const genderPref = firstString(u.gender_pref);

  return {
    ...PROFILE_DEFAULTS,
    id: String(u.id ?? ''),
    name: firstString(u.name, u.full_name),
    email: firstString(u.email),
    phone: firstString(u.phone, u.phone_number, u.mobile),
    phone_number: firstString(u.phone_number, u.phone, u.mobile) || undefined,
    whatsapp_number: firstString(u.whatsapp_number, u.whatsapp, u.whatsappNumber),
    gender: gender === 'male' || gender === 'female' ? gender : '',
    date_of_birth: firstString(u.date_of_birth, u.birthdate, u.dob),
    avatar_url: firstString(u.avatar_url, u.avatar) || null,
    joined_at: firstString(u.joined_at, u.created_at, u.member_since),
    rating: toNumber(u.rating),
    total_cycles: toNumber(u.total_cycles),
    active_cycles: toNumber(u.active_cycles),
    wallet_balance: toNumber(u.wallet_balance),
    saved_locations: Array.isArray(u.saved_locations) ? u.saved_locations as UserProfile['saved_locations'] : [],
    gender_pref: (genderPref || PROFILE_DEFAULTS.gender_pref) as UserProfile['gender_pref'],
    walk_minutes: ([0, 5, 10].includes(toNumber(u.walk_minutes)) ? toNumber(u.walk_minutes) : 0) as UserProfile['walk_minutes'],
    seat_preference: (seatPreference === 'front' || seatPreference === 'back' || seatPreference === 'any') ? seatPreference : 'any',
    province: firstString(u.province),
    district: firstString(u.district),
    sub_district: firstString(u.sub_district, u.subDistrict),
    building: firstString(u.building),
    street: firstString(u.street),
    landmark: firstString(u.landmark),
  };
}

const userApi = {
  // Profile
  getProfile:        ()                                   => call('profile').then(normalizeUserProfile).catch((err: unknown) => {
    // Route not implemented yet on the backend — return what we have locally.
    if (err instanceof ApiError && err.status === 404) return buildProfileFromLocalStorage();
    throw err;
  }),
  updateProfile:     (data: Record<string, unknown>)      => call('profile', { method: 'PATCH', body: data }),

  // Requests
  getRequests:       ()                                   => call('user/requests'),
  createRequest:     (data: Record<string, unknown>)      => call('user/requests', { method: 'POST', body: data }),
  cancelRequest:     (id: string)                         => call(`user/requests/${id}/cancel`, { method: 'POST' }),
  acceptPriceRaise:  (id: string)                         => call(`user/requests/${id}/accept-price`, { method: 'POST' }),
  rejectPriceRaise:  (id: string)                         => call(`user/requests/${id}/reject-price`, { method: 'POST' }),

  // Wallet
  getWallet:         ()                                   => call('user/wallet'),
  getTransactions:   ()                                   => call('user/wallet/transactions'),
  topUp:             (amount: number, method: string)     => call('user/wallet/top-up', { method: 'POST', body: { amount, payment_method: method } }),

  // Notifications
  getNotifications:  ()                                   => call('user/notifications'),
  markAllRead:       ()                                   => call('user/notifications/read-all', { method: 'POST' }),

  // Passengers
  getPassengers:     ()                                   => call('user/passengers'),
  addPassenger:      (data: Record<string, unknown>)      => call('user/passengers', { method: 'POST', body: data }),
  updatePassenger:   (id: string, data: Record<string, unknown>) => call(`user/passengers/${id}`, { method: 'PATCH', body: data }),
  deletePassenger:   (id: string)                         => call(`user/passengers/${id}`, { method: 'DELETE' }),

  // Saved locations
  getSavedLocations: ()                                   => call('user/locations'),
  addLocation:       (data: Record<string, unknown>)      => call('user/locations', { method: 'POST', body: data }),
  deleteLocation:    (id: string)                         => call(`user/locations/${id}`, { method: 'DELETE' }),

  // Trip
  getTripToday:      ()                                   => call('user/trip/today'),
  getTripById:       (id: string)                         => call(`user/trip/${id}`),
  getDriverLocation: (tripId: string)                     => call(`user/trip/${tripId}/location`),

  // Ratings
  rateQuick:         (tripId: string, ratedId: string, positive: boolean) =>
    call('ratings/quick', { method: 'POST', body: { trip_id: tripId, rated_id: ratedId, is_positive: positive } }),
  rateDetailed:      (data: Record<string, unknown>)      => call('ratings/detailed', { method: 'POST', body: data }),

  // Chat
  getChat:           (tripId: string)                     => call(`trips/${tripId}/chat`),
  sendChat:          (tripId: string, text: string)       => call(`trips/${tripId}/chat`, { method: 'POST', body: { text } }),

  // Commute preferences
  getPreferences:    ()                                   => call('preferences'),
  updatePreferences: (data: Partial<CommutePreferences>)  => call('preferences', { method: 'POST', body: data }),
};

export default userApi;
