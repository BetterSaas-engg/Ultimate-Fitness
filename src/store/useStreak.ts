import { useMemo } from 'react';
import { addDays } from '@/lib/date';
import type { LogMap } from './useLog';

/**
 * Streak is DERIVED from the log, never stored.
 *
 * A persisted counter is the classic demo-day failure: it double-counts, and it
 * drifts the moment a date changes or an entry is undone. Recomputing costs
 * nothing at this size and cannot go out of sync.
 *
 * A day counts as active if anything at all was logged on it - one meal is
 * enough. The point is showing up, not compliance.
 */
export function computeStreak(log: LogMap, todayDateKey: string): number {
  const active = (k: string) => (log[k] ?? []).length > 0;

  // Today not being logged yet must not break yesterday's streak - the day
  // isn't over. Start from today if it's active, otherwise from yesterday.
  let cursor = active(todayDateKey) ? todayDateKey : addDays(todayDateKey, -1);

  let streak = 0;
  while (active(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeActiveDays(log: LogMap): number {
  return Object.values(log).filter((entries) => entries.length > 0).length;
}

export function useStreak(log: LogMap, todayDateKey: string) {
  return useMemo(
    () => ({
      streak: computeStreak(log, todayDateKey),
      activeDays: computeActiveDays(log),
    }),
    [log, todayDateKey]
  );
}
