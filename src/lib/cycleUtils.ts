import { addDays, startOfDay, getDay } from 'date-fns';

// Day numbers: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const PLANNING_DAY = 3; // Wednesday — team groups requests
const CYCLE_DAY    = 6; // Saturday  — cycles always start here

/**
 * Returns the next available cycle start date (always a Saturday).
 *
 * Rules:
 *  - Mon/Tue → this Saturday (planning hasn't happened yet)
 *  - Wed/Thu/Fri/Sat/Sun → skip to the Saturday after next
 *    (current week's planning is done or cycle has already started)
 */
export function getNextAvailableCycleStart(today: Date = new Date()): Date {
  const todayStart  = startOfDay(today);
  const dayOfWeek   = getDay(todayStart); // 0–6

  // How many days until the coming Saturday (min 1, never 0 — today can't be start)
  const daysUntilSat = ((CYCLE_DAY - dayOfWeek + 7) % 7) || 7;
  const thisSaturday = addDays(todayStart, daysUntilSat);

  // Wed (3) through Sun (0) means the planning cutoff has passed
  const cutoffReached = dayOfWeek >= PLANNING_DAY || dayOfWeek === 0;

  return cutoffReached ? addDays(thisSaturday, 7) : thisSaturday;
}

/** Returns a human-readable date string for a cycle start date. */
export function formatCycleStartDate(date: Date, locale: string): string {
  return date.toLocaleDateString(
    locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );
}

/** Cycles always run Saturday–Friday (7 days). */
export function getCycleEndDate(startDate: Date): Date {
  return addDays(startDate, 6);
}

/**
 * Return the calendar date for a given day-of-week (Sun=0..Sat=6) within
 * a cycle week that starts on `cycleStart` (always a Saturday).
 */
export function cycleDateForDayOfWeek(cycleStart: Date, dayOfWeek: number): Date {
  // Saturday is index 6 in the API (Sun=0..Sat=6).
  // Cycle starts on Saturday → that's offset 0; Sunday → 1; Monday → 2; …; Friday → 6.
  const SAT = 6;
  const offset = (dayOfWeek - SAT + 7) % 7;
  return addDays(cycleStart, offset);
}

/** Format Date as YYYY-MM-DD (local time). */
export function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
