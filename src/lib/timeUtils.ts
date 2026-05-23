import type { WeekDay } from '@/types/shared';

export const ALL_DAYS: WeekDay[] = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Sun→Sat ordering (matches API day_of_week where Sun=0). */
export const ALL_DAYS_SUN_FIRST: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Map WeekDay → API day_of_week index (Sun=0 … Sat=6). */
export const WEEKDAY_INDEX: Record<WeekDay, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Inverse of WEEKDAY_INDEX. */
export const INDEX_WEEKDAY: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Long display label for each WeekDay. */
export const WEEKDAY_LONG: Record<WeekDay, string> = {
  Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday',
  Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
};

/**
 * Compute departure time given an arrival time and trip duration.
 * Both times are "HH:MM" 24-hour strings.
 */
export function computeDeparture(
  arrivalTime: string,
  durationMinutes: number
): string {
  const [hours, minutes] = arrivalTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes - durationMinutes;
  const h = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
  const m = ((totalMinutes % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format a "HH:MM" 24-hour string as "h:MM AM/PM".
 */
export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Add minutes to a "HH:MM" 24-hour string and return a new "HH:MM" string.
 */
export function addMinutes(time24: string, minutes: number): string {
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % 1440 + 1440) % 1440 / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Add hours to a "HH:MM" 24-hour string and return a new "HH:MM" string.
 */
export function addHours(time24: string, hours: number): string {
  return addMinutes(time24, hours * 60);
}

/**
 * Compute the difference in minutes between two "HH:MM" strings (to - from).
 */
export function timeDiffMinutes(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return (th * 60 + tm) - (fh * 60 + fm);
}

export function computeArrivalFrom(
  pickupTo: string,
  durationMinutes: number,
): string {
  return addMinutes(pickupTo, durationMinutes);
}

export function computeArrivalTo(
  pickupFrom: string,
  pickupTo: string,
  durationMinutes: number,
): string {
  const windowSize = timeDiffMinutes(pickupFrom, pickupTo);
  const arrivalFrom = computeArrivalFrom(pickupTo, durationMinutes);
  return addMinutes(arrivalFrom, windowSize);
}

/**
 * Format a time window as "h:MM AM/PM – h:MM AM/PM".
 */
export function formatTimeWindow(from: string, to: string): string {
  return `${formatTime12h(from)} – ${formatTime12h(to)}`;
}

/**
 * Format an ISO date or datetime string to a localised short date (e.g. "04 May 2026").
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-EG', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

// ── Arrival-window helpers ────────────────────────────────────────────────────

/**
 * Snap a "HH:MM" time string to the nearest :00 or :30 boundary.
 * e.g. "08:14" → "08:00", "08:15" → "08:30", "08:46" → "09:00"
 */
export function snapToHalfHour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  if (m < 15) return `${String(h).padStart(2, '0')}:00`;
  if (m < 45) return `${String(h).padStart(2, '0')}:30`;
  const nextH = (h + 1) % 24;
  return `${String(nextH).padStart(2, '0')}:00`;
}

/**
 * Returns all valid :00 and :30 time slots for a 24-hour day as "HH:MM" strings.
 * Produces 48 options: "00:00", "00:30", "01:00", … "23:30"
 */
export function getHalfHourOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`);
    opts.push(`${String(h).padStart(2, '0')}:30`);
  }
  return opts;
}

/**
 * Validate that an arrival window (from → to) meets the 30-min min / 2-hour max rule.
 */
export function validateArrivalWindow(
  from: string,
  to: string,
): { valid: boolean; error?: 'too_short' | 'too_long'; gapMinutes: number } {
  const gap = timeDiffMinutes(from, to);
  if (gap < 30)  return { valid: false, error: 'too_short', gapMinutes: gap };
  if (gap > 120) return { valid: false, error: 'too_long',  gapMinutes: gap };
  return { valid: true, gapMinutes: gap };
}
