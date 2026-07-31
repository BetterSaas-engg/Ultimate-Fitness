/**
 * The gym's weekly class schedule.
 *
 * Deliberately NOT modelled as Program -> Phase -> Day. Programs are a
 * progression relative to when a member started; the schedule is a weekly
 * recurrence that is the same for everyone. Zumba is Tuesday 6:30pm whether
 * you joined yesterday or last year.
 *
 * Read-only. No booking, no state, nothing persisted.
 */

export interface GymClass {
  /** Stable key. (dayOfWeek, time) is NOT unique - see alternating Saturdays. */
  id: string;
  /** JavaScript convention: 0 = Sunday ... 6 = Saturday. */
  dayOfWeek: number;
  /** 24h local gym time, "18:30". Rendered as 12h. */
  time: string;
  className: string;
  /** May name more than one person, e.g. "Sheena / Kim". Rendered verbatim. */
  instructor: string;
  durationMin: number;
  /** Free text from the gym, e.g. "Alternating Saturdays". Present = not plain weekly. */
  note?: string;
  /** true -> member must pre-register with the gym. We do not handle that here. */
  preRegistration?: boolean;
}
