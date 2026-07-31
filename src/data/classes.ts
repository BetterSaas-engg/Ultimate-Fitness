import scheduleJson from '@seed/classes-schedule.json';
import type { GymClass } from '@/types/classes';

type RawClass = Omit<GymClass, 'id'>;

/**
 * (dayOfWeek, time) is NOT unique: Saturday has two classes at 09:00 and two at
 * 10:00 because they alternate weeks. Index into the seed array is the only
 * stable key, and both entries must render - we cannot compute which Saturday
 * it is from the note text, so we show both and let the note explain.
 */
export const CLASSES: GymClass[] = (scheduleJson.classes as RawClass[]).map((c, i) => ({
  ...c,
  id: `${c.dayOfWeek}-${c.time}-${i}`,
}));

/** All classes on a weekday (0 = Sunday), earliest first. */
export function classesOn(dayOfWeek: number): GymClass[] {
  return CLASSES.filter((c) => c.dayOfWeek === dayOfWeek).sort((a, b) =>
    a.time.localeCompare(b.time)
  );
}

/**
 * A note means the class is not a plain weekly recurrence ("Alternating
 * Saturdays", "Specific dates only"). We surface it rather than silently
 * showing the class as if it definitely runs today.
 */
export function isIrregular(c: GymClass): boolean {
  return Boolean(c.note);
}
