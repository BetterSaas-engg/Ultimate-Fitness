import type { LogMap } from '@/store/useLog';
import { dayStatus, type DayDeps } from '@/lib/dayStatus';
import { addDays } from '@/lib/date';

/**
 * Milestones are DERIVED from the log, like the streak. Only the fact that a
 * card has been shown is persisted - never the achievement itself. That way an
 * undone check-off cannot leave a milestone stranded, and an existing member
 * gets a correct history the first time this code runs.
 */

export type MilestoneId =
  | 'first-meal'
  | 'first-perfect-day'
  | 'streak-7'
  | 'streak-14'
  | 'streak-30';

/** Ascending significance. Used to break ties when two land on the same day. */
export const MILESTONE_ORDER: MilestoneId[] = [
  'first-meal',
  'first-perfect-day',
  'streak-7',
  'streak-14',
  'streak-30',
];

export const MILESTONE_COPY: Record<MilestoneId, { title: string; body: string }> = {
  'first-meal': {
    title: 'First one ticked off',
    body: 'That is the habit started. Everything else here is built on this one action.',
  },
  'first-perfect-day': {
    title: 'A perfect day',
    body: 'Meals, protein and training all closed on the same day. That is the whole plan, done.',
  },
  'streak-7': {
    title: 'Seven days',
    body: 'A full week of showing up. The hard part is behind you.',
  },
  'streak-14': {
    title: 'Two weeks',
    body: 'Fourteen days running. This is the point where it stops feeling like effort.',
  },
  'streak-30': {
    title: 'Thirty days',
    body: 'A month straight. Worth mentioning at the front desk — they like hearing it.',
  },
};

export interface EarnedMilestone {
  id: MilestoneId;
  /** The date it became true. */
  earnedAt: string;
}

const STREAK_MILESTONES: Array<{ id: MilestoneId; days: number }> = [
  { id: 'streak-7', days: 7 },
  { id: 'streak-14', days: 14 },
  { id: 'streak-30', days: 30 },
];

/**
 * Everything the member has earned as of `today`, with the date each became
 * true. Recomputed from scratch every time; there is no accumulating state to
 * drift.
 */
export function earnedMilestones(deps: DayDeps, today: string): EarnedMilestone[] {
  const log = deps.log;
  const dates = Object.keys(log)
    .filter((d) => d <= today && (log[d] ?? []).length > 0)
    .sort();
  if (dates.length === 0) return [];

  const out: EarnedMilestone[] = [];

  const firstMeal = dates.find((d) => (log[d] ?? []).some((e) => e.startsWith('meal:')));
  if (firstMeal) out.push({ id: 'first-meal', earnedAt: firstMeal });

  const perfect = dates.find((d) => dayStatus(d, deps).allClosed);
  if (perfect) out.push({ id: 'first-perfect-day', earnedAt: perfect });

  // Walk the calendar, not the logged dates, so gaps actually break the run.
  // Matches computeStreak's definition: a day counts if anything was logged.
  const pending = new Map(STREAK_MILESTONES.map((m) => [m.days, m.id]));
  let run = 0;
  for (let d = dates[0]; d <= today; d = addDays(d, 1)) {
    run = (log[d] ?? []).length > 0 ? run + 1 : 0;
    const hit = pending.get(run);
    if (hit) {
      out.push({ id: hit, earnedAt: d });
      pending.delete(run);
    }
  }

  return out;
}

/** Latest by date, then by significance. The one worth showing. */
export function mostSignificant(list: EarnedMilestone[]): EarnedMilestone | undefined {
  return [...list].sort(
    (a, b) =>
      a.earnedAt.localeCompare(b.earnedAt) ||
      MILESTONE_ORDER.indexOf(a.id) - MILESTONE_ORDER.indexOf(b.id)
  )[list.length - 1];
}

/** A day counts toward the streak if anything at all was logged on it. */
export function wasActive(log: LogMap, dateKey: string): boolean {
  return (log[dateKey] ?? []).length > 0;
}
