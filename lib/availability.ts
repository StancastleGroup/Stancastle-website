/**
 * Stancastle availability rules (from CLAUDE.md).
 * All times UK local. Slots are 90-minute blocks (non-overlapping).
 *
 * - Sunday: Closed
 * - Monday: 8am–5pm
 * - Tuesday: Closed
 * - Wednesday: 10am–5pm
 * - Thursday: 11am–5pm
 * - Friday: 8am–10am only
 * - Saturday: 5pm only
 */
export const SLOT_DURATION_MINUTES = 90;

/** 90-min slot start times by day (0=Sun .. 6=Sat). Each slot is 90 min so no overlap. */
const SLOTS_BY_DAY: Record<number, string[]> = {
  0: [], // Sunday – closed
  1: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30'], // Monday 8–5
  2: [], // Tuesday – closed
  3: ['10:00', '11:30', '13:00', '14:30'], // Wednesday 10–5 (last 90-min slot ends 17:00)
  4: ['11:00', '12:30', '14:00', '15:30'], // Thursday 11–5
  5: ['08:00'], // Friday 8–10am only (one 90-min slot)
  6: ['17:00'], // Saturday 5pm only
};

/** Day indices that are open for booking (0 = Sunday, 6 = Saturday). */
const OPEN_DAYS = [1, 3, 4, 5, 6];

/**
 * Returns time slots available for a given date (by rule only; does not exclude already booked).
 */
export function getTimeSlotsForDate(date: Date): string[] {
  const day = date.getDay();
  return SLOTS_BY_DAY[day] ?? [];
}

/**
 * Returns true if the date is a bookable day (open and not in the past).
 */
export function isDateBookable(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d < today) return false;
  return OPEN_DAYS.includes(date.getDay());
}

/**
 * Returns the next N calendar dates that are bookable (by rule).
 */
export function getBookableDates(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    if (isDateBookable(d)) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Day name for display (short).
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

/**
 * Format date for display (e.g. "Mon 12 Jan").
 */
export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
