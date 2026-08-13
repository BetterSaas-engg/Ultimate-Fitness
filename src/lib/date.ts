/**
 * Date helpers.
 *
 * The Today screen runs on two clocks and they must not be conflated:
 *   - program content is keyed to PROGRAM DAY N, derived from the start date
 *   - classes are keyed to the ACTUAL WEEKDAY
 * A member who starts on a Thursday sees nutrition day 1 next to Thursday's
 * classes. That is correct, and it is only correct if the two stay separate.
 */

/** Local calendar date as YYYY-MM-DD. Not UTC - the gym runs on local time. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `from` to `to`. Same day = 0. Midday anchor dodges DST. */
export function daysBetween(from: string, to: string): number {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** 1-based program day. The day a member starts is day 1, not day 0. */
export function programDayIndex(startDateKey: string, onDateKey: string): number {
  return daysBetween(startDateKey, onDateKey) + 1;
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** 0 = Sunday ... 6 = Saturday, matching the schedule seed's convention. */
export function dayOfWeekOf(key: string): number {
  return parseDateKey(key).getDay();
}

/**
 * Monday of the week containing `key`. The gym's week reads Monday-Sunday,
 * which is not the seed's 0=Sunday convention - that one exists to match the
 * class schedule and stays where it is.
 */
export function startOfWeek(key: string): string {
  return addDays(key, -((dayOfWeekOf(key) + 6) % 7));
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayName(dow: number): string {
  return WEEKDAYS[dow] ?? '';
}

export function formatDateLong(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "18:30" -> "6:30 PM". Stored 24h so it sorts; shown 12h because Ontario. */
export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h} hr` : `${h} hr ${rem} min`;
}
