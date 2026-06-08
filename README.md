# Commuter — Cycle-Based Carpooling Platform

> Cairo, Egypt · Egyptian pound (EGP) · Week: Saturday – Friday

---

## Concept

Commuter is a **weekly-cycle carpooling platform** built for the Cairo metro area. Unlike on-demand ride apps, Commuter is built around **recurring weekly commutes**. A passenger defines a fixed route, schedule, and preferences once — and gets matched with a verified driver for the whole week. Pricing is calculated and agreed upon upfront, not per trip.

**Key idea:** remove the daily friction of hailing a ride. One agreement covers every commute for the cycle (typically one calendar week, Sat–Fri). Both sides know exactly when, where, and how much before the week begins.

---

## Color Palette

| Role | Color | Hex |
|---|---|---|
| Primary / Navy | Deep navy — main text, headers, buttons | `#0B1E3D` |
| Secondary / Teal | Brand teal — accents, active states, CTAs | `#00C2A8` |
| Light Teal | Teal background tint — cards, highlights | `#EFF7F6` |
| Border / Muted | Soft grey — dividers, input borders | `#E2E8F0` |
| Muted Text | Secondary text, labels | `#5A6A7A` |
| Warning / Price | Amber — price raised, earnings, alerts | `#F5A623` |
| Danger | Error, cancel, reject | `#E74C3C` |
| Success | Confirmed, completed | `#27AE60` |
| White | Card backgrounds, overlays | `#FFFFFF` |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + inline styles
- **Maps:** React Leaflet + OSRM routing + OpenRouteService
- **Geocoding:** Nominatim (OpenStreetMap)
- **Notifications:** react-hot-toast
- **Date utilities:** date-fns
- **Icons:** lucide-react
- **Backend (planned):** Laravel API — all field names in the frontend use `snake_case` to map directly to Laravel JSON responses

---

## Pricing Model

Prices are calculated by `src/lib/pricing.ts` using:

| Factor | Effect |
|---|---|
| Distance | EGP 4 / km base rate |
| Shared ride | ×1.0 (shared cost) |
| Private ride | ×2.2 (private ride) |
| Front seat | +EGP 10 / trip |
| Rear window seat | +EGP 8 / trip |
| 5-min walk to pickup | −8% discount |
| 10-min walk to pickup | −15% discount |
| Round trip | ×1.8 multiplier |
| Days per week | ×number of days |

A price range (min / max / week) is shown to both sides. The driver can raise the price by 5 %, 10 %, 15 %, or a custom amount — still capped at the passenger's estimated max.

---

## Request Lifecycle

```
available → submitted → matching → driver_offered → confirmed → active → completed
                                 ↘ price_raised ↗
                                 (any stage) → cancelled
```

---

## Driver Portal

### Screens

| Route | Purpose |
|---|---|
| `/driver/sign-up` | Multi-step registration wizard (personal info, car details, document uploads) |
| `/driver/sign-in` | Driver login |
| `/driver/onboarding` | Complete driver profile setup (vehicle details, documents, ride preferences) |
| `/driver/my-requests` | Requests the driver has responded to (driver_offered / price_raised) |
| `/driver/my-cycles` | All confirmed and completed cycles — Pending, Currently Active, Completed tabs |
| `/driver/profile` | Personal info, car details, document management, stats |

### Key Features

**Request browsing (`/driver/my-requests`)**
- Requests the driver has responded to with statuses: driver_offered or price_raised
- Schedule section shows arrival window (`arrival_from` – `arrival_to`) and the computed departure window

**Raise price modal (`RaisePriceModal`)**
- Shows base price, passenger's estimated range, and a warning if the new price exceeds the max
- Quick raise buttons: +5 % / +10 % / +15 %, plus a custom EGP input
- Validates: must be > base price, ≤ 150 % of base

**My Cycles (`/driver/my-cycles`)**
- Three tabs: **Currently Active**, **Pending** (confirmed, not started yet), **Completed**
- Pending tab: days-until-start countdown, sort by nearest / most passengers / highest earnings
- Completed tab: search by location or date, sort by newest / oldest / earnings / passengers
- Cancel dialog with passenger-count warning
- Can view full request detail or raise price from within cycles

**Profile (`/driver/profile`)**
- Tabs: Personal · Car · Documents
- Document upload for: National ID (front + back), Driving license, Car license, Criminal record certificate, Profile photo
- Displays completed cycle count, active cycles, rating

---

## User (Passenger) Portal

### Screens

| Route | Purpose |
|---|---|
| `/user/sign-up` | Passenger registration with age gate + commute preferences |
| `/user/sign-in` | Passenger login |
| `/user/map` | Main screen — map-first experience to place a new request |
| `/user/my-requests` | All requests and their live status |
| `/user/wallet` | Wallet balance + transaction history |
| `/user/notifications` | Ride updates, price change alerts |
| `/user/profile` | Personal info, saved locations, commute preferences |
| `/user/rate/[cycleId]` | Rate the driver after a completed cycle |

### Key Features

**Sign-up (`/user/sign-up`)**
- Standard fields: name, email, password, gender, date of birth (18+ gate)
- **Commute preferences collected at registration** (not per-request):
  - Gender preference: Mixed / Same gender
  - Walk to pickup: No walk / 5 min (~400 m) / 10 min (~800 m)
- These preferences are stored on `UserProfile` and auto-applied to every request

**Map screen (`/user/map`)**
- Interactive Leaflet map centred on Cairo
- Floating search bar: pick origin and destination by address search (Nominatim) or by clicking the map
- OSRM route calculation with multi-route selector (Route A / B / …)
- Walk-radius overlay on the map (teal dashed circle) reflecting the walk tolerance from user profile
- Bottom sheet slides up with the full request form

**Request form**
- Trip type (section heading): **Shared ride** / **Private** *(formerly "Pool" / "Single")*
- One-way / Round trip
- Seat preference: Any · Front seat (+EGP 10) · Rear window seat (+EGP 8) — with interactive car diagram
- Days of week (Sat–Fri Egyptian week)
- **Arrival time window:** "Arrive from [HH:MM] to [HH:MM]" — minimum 1-hour window
  - `arrival_to` is auto-set to `arrival_from + 1 hour`; user can extend but not shrink below 1 hour
  - Computed departure window shown below: "Estimated departure: HH:MM – HH:MM"
- Return arrival window (round trip only)
- Gender preference and walk tolerance are **not shown** — read silently from user profile

**My Requests (`/user/my-requests`)**
- Status cards with `StatusTimeline` progress bar
- `PriceRaisedBanner` — full-screen alert when a driver raises the price; shows original vs. new price, driver info, and Accept / Reject / Negotiate actions
- Cancel request modal with departure time reminder
- Co-passenger list for shared rides

**Profile (`/user/profile`)**
- Personal information section
- **Commute preferences section** (editable): gender preference + walk tolerance
- Saved locations (Home, Work, Custom)
- Stats: past cycles, active cycles, wallet balance

**Wallet (`/user/wallet`)**
- Current balance in EGP
- Transaction history: top-ups, cycle payments, refunds

**Rate (`/user/rate/[cycleId]`)**
- Star rating (1–5) + optional comment after cycle completion
- Shows driver name, cycle dates, route summary

---

## Data Model (simplified)

All shared fields live in `src/types/shared.ts` and use `snake_case` throughout:

```
CycleRequestCore
├── id, status, origin, destination
├── distance_km, duration_minutes, route_coordinates
├── trip_type ('one_way' | 'round_trip')
├── ride_type ('shared' | 'private')               ← formerly trip_mode / pool / single
├── days, seat_preference
├── arrival_from, arrival_to                        ← time window (min 1 hour apart)
├── departure_from, departure_to                    ← computed from arrival window
├── return_arrival_from, return_arrival_to          ← round trip only
├── return_departure_from, return_departure_to      ← computed, round trip only
├── cycle_start_date, cycle_end_date
├── base_price, offered_price, estimated_price_min, estimated_price_max
├── passenger_count, pickup_points[], created_at
│
├── UserRequest extends CycleRequestCore
│   └── driver_id, driver_name, driver_rating, co_passengers[]
│
└── DriverCycleRequest extends CycleRequestCore
    └── driver_id, driver_name, driver_rating

UserProfile
├── id, name, email, phone, gender, date_of_birth
├── gender_pref ('same' | 'mixed')                  ← set at sign-up, editable in profile
├── walk_minutes (0 | 5 | 10)                       ← set at sign-up, editable in profile
├── avatar_url, joined_at, rating
├── total_cycles, active_cycles, wallet_balance
└── saved_locations[]
```

### Renamed fields reference

| Old name | New name | Note |
|---|---|---|
| `trip_mode` | `ride_type` | Field name |
| `'pool'` | `'shared'` | Ride type value |
| `'single'` | `'private'` | Ride type value |
| `TripMode` | `RideType` | TypeScript type |
| `arrival_time` | `arrival_from` + `arrival_to` | Now a window |
| `departure_time` | `departure_from` + `departure_to` | Now a window |

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — role picker (User / Driver)
- `/user/map` — start as a passenger
- `/driver/sign-in` — start as a driver

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.