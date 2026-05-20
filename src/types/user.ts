import type { CycleRequestCore, GenderPref, WalkMinutes } from './shared';

export type {
  WeekDay,
  RequestStatus,
  RideType,
  TripType,
  GenderPref,
  WalkMinutes,
  SeatId,
  SeatType,
  SelectedSeat,
  SeatPreference,
  GeoLocation,
  CycleDayRecord,
} from './shared';

// ── User-side request (extends shared core) ───────────────────────────────────

export interface UserRequest extends CycleRequestCore {
  driver_id?:     string;
  driver_name?:   string;
  driver_rating?: number;
  co_passengers?: CoPassenger[];
}

export interface CoPassenger {
  id:         string;
  first_name: string;
  gender:     'male' | 'female';
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id:              string;
  name:            string;
  email:           string;
  phone:           string;
  whatsapp_number: string;
  gender:          'male' | 'female';
  date_of_birth:   string;
  avatar_url:      string | null;
  joined_at:       string;
  rating:          number;
  total_cycles:    number;
  active_cycles:   number;
  wallet_balance:  number;
  saved_locations: SavedLocation[];
  gender_pref:     GenderPref;
  walk_minutes:    WalkMinutes;
  seat_preference: 'front' | 'back' | 'any';
  province:        string;
  district:        string;
  sub_district:    string;
  building:        string;
  street:          string;
  landmark:        string;
}

// ── Related Passenger ─────────────────────────────────────────────────────────

export interface RelatedPassenger {
  id:        string;
  name:      string;
  phone?:    string;
  age:       number;
  gender:    'male' | 'female';
  relation?: string;
}

export interface PassengerPayload {
  name:      string;
  phone?:    string;
  age:       number;
  gender:    'male' | 'female';
  relation?: string;
}

export interface SavedLocation {
  id:      string;
  label:   'home' | 'work' | 'custom';
  name:    string;
  address: string;
  lat:     number;
  lng:     number;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  id:          string;
  type:        'top_up' | 'payment' | 'refund';
  amount:      number;
  description: string;
  date:        string;
  balance:     number;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id:        string;
  type:
    | 'request_matched'
    | 'price_raised'
    | 'request_confirmed'
    | 'cycle_starting_tomorrow'
    | 'cycle_completed'
    | 'payment_deducted'
    | 'refund_issued'
    | 'request_cancelled';
  title:      string;
  body:       string;
  isRead:     boolean;
  createdAt:  string;
  actionUrl?: string;
}

// ── Rating ────────────────────────────────────────────────────────────────────

export interface DriverRating {
  cycleId:       string;
  driverId:      string;
  driverName:    string;
  stars:         1 | 2 | 3 | 4 | 5;
  comment?:      string;
  submittedAt?:  string;
}
