import type { CycleRequestCore } from './shared';

export type {
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
  PickupPoint,
  CycleRequestCore,
} from './shared';

// ── Driver-side request (extends shared core) ─────────────────────────────────

export interface DriverCycleRequest extends CycleRequestCore {
  driver_id?:     string;
  driver_name?:   string;
  driver_rating?: number;
}

// ── Driver profile ────────────────────────────────────────────────────────────

export interface DriverProfile {
  id:                   string;
  name:                 string;
  phone:                string;
  email:                string;
  address:              string;
  nationalId:           string;
  drivingLicenseNumber: string;
  carLicensePlate:      string;
  carModel:             string;
  carYear:              number;
  carColor:             string;
  rating:               number;
  totalTrips:           number;
  walletBalance:        number;
  joinedAt:             string;
  documents:            DriverDocuments;
  isVerified:           boolean;
  completedCycles:      number;
  activeCycles:         number;
  gender:               'male' | 'female';
}

export interface DriverDocuments {
  nationalIdFront:  string | null;
  nationalIdBack:   string | null;
  drivingLicense:   string | null;
  carLicenseFront:  string | null;
  carLicenseBack:   string | null;
  criminalRecord:   string | null;
  profilePhoto:     string | null;
}

export type RequestAction = 'accept' | 'raise' | 'reject';
export type RaiseOption   = 5 | 10 | 15 | 'custom';
