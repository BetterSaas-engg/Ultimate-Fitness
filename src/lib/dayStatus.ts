import type { LogMap } from '@/store/useLog';
import { mealEntryId, WORKOUT_ENTRY } from '@/store/useLog';
import type { Profile } from '@/store/useProfile';
import type { SubstitutionMap } from '@/store/useSubstitutions';
import type { AdminEdits } from '@/types/admin';

import { getNutritionForDay, getWorkoutForDay, NUTRITION_PHASES, NUTRITION_PROGRAM } from '@/data/programs';
import { applyNutritionDayEdits, derivedNutritionPhases } from '@/data/adminOverlay';
import { tierAllows } from '@/data/catalog';
import { loggedMacros, plannedMacros, proteinTargetFor } from '@/lib/macros';
import { programDayIndex } from '@/lib/date';

/**
 * What a single day amounts to: the numbers, and whether it closed.
 *
 * The closure rules live here rather than inside the Today rings because two
 * surfaces now ask the same question - the rings for today, the week chart for
 * the last seven days - and "did this day close" must mean exactly one thing.
 *
 * HISTORICAL FIDELITY. Meal check-offs (uf.log.v1) and substitutions
 * (uf.subs.v1) are both keyed by real calendar date, so past days rebuild
 * exactly. Three inputs are current-only and are applied to past days as they
 * stand today, because nothing records their history:
 *
 *   - profile.tier          upgrade today and last week recomputes at premium
 *   - profile.proteinTargetG a changed target retimes past plan lines
 *   - admin edits            a nutritionist edit rewrites past planned totals
 *
 * That is a deliberate v1 choice, not an oversight. Versioning any of them
 * means new storage, which is a bigger decision than a chart.
 */

export type WorkoutState =
  | 'done' // logged
  | 'todo' // scheduled, not logged
  | 'rest' // the plan says rest: complete, not empty
  | 'none'; // no programme for this day at all

export interface ClosureInput {
  mealsDone: number;
  /** Meals this member could see that day - tier already applied. */
  mealsTotal: number;
  proteinLogged: number;
  proteinTarget: number;
  workout: WorkoutState;
}

export interface Closure {
  mealsInactive: boolean;
  mealsClosed: boolean;
  proteinInactive: boolean;
  proteinClosed: boolean;
  workoutInactive: boolean;
  workoutClosed: boolean;
  /** How many of the three had anything to close. */
  activeCount: number;
  closedCount: number;
  /** Every ring that had something to close, closed. */
  allClosed: boolean;
}

/**
 * The rules, and nothing else.
 *
 * "Inactive" is the load-bearing idea: a ring with nothing to close must not
 * hold the day hostage. A rest day closes the workout ring rather than leaving
 * it accusingly empty, and a day with no plan at all closes nothing but blocks
 * nothing either.
 */
export function closureFor(i: ClosureInput): Closure {
  const mealsInactive = i.mealsTotal <= 0;
  const mealsClosed = !mealsInactive && i.mealsDone >= i.mealsTotal;

  const proteinInactive = i.proteinTarget <= 0;
  const proteinClosed = !proteinInactive && i.proteinLogged >= i.proteinTarget;

  const workoutInactive = i.workout === 'none';
  const workoutClosed = i.workout === 'done' || i.workout === 'rest';

  const active = [!mealsInactive, !proteinInactive, !workoutInactive].filter(Boolean).length;
  const closed = [
    !mealsInactive && mealsClosed,
    !proteinInactive && proteinClosed,
    !workoutInactive && workoutClosed,
  ].filter(Boolean).length;

  return {
    mealsInactive,
    mealsClosed,
    proteinInactive,
    proteinClosed,
    workoutInactive,
    workoutClosed,
    activeCount: active,
    closedCount: closed,
    allClosed: active > 0 && closed === active,
  };
}

export interface DayDeps {
  profile: Profile;
  log: LogMap;
  subs: SubstitutionMap;
  edits: AdminEdits;
}

export interface DayStatus extends ClosureInput, Closure {
  dateKey: string;
  /** 1-based. Below 1 means the date predates the member's start. */
  programDay: number;
  /** False when there is no programme content for this date at all. */
  inProgram: boolean;
}

/**
 * Rebuild any date from the stores. Mirrors what the Today screen resolves for
 * the current day - same overlays, same tier slice - so the week chart's
 * "today" column and the Today rings cannot disagree.
 */
export function dayStatus(dateKey: string, deps: DayDeps): DayStatus {
  const { profile, log, subs, edits } = deps;
  const programDay = programDayIndex(profile.startDate, dateKey);

  const workoutDay = getWorkoutForDay(programDay);
  const phases = derivedNutritionPhases(NUTRITION_PHASES, edits);
  const rawNutrition = getNutritionForDay(programDay, phases);
  const nutrition = rawNutrition
    ? applyNutritionDayEdits(rawNutrition.day, rawNutrition.phase.phaseId, edits)
    : null;

  // Free members are measured against the meals they can actually see, so the
  // day is closeable for them too.
  const unlocked = tierAllows(profile.tier, NUTRITION_PROGRAM.tier);
  const meals = !nutrition ? [] : unlocked ? nutrition.meals : nutrition.meals.slice(0, 1);

  const entries = log[dateKey] ?? [];
  const daySubs = subs[dateKey] ?? {};

  const planned = plannedMacros(meals, daySubs);
  const eaten = loggedMacros(meals, daySubs, (slot) => entries.includes(mealEntryId(slot)));

  const input: ClosureInput = {
    mealsDone: meals.filter((m) => entries.includes(mealEntryId(m.slot))).length,
    mealsTotal: meals.length,
    proteinLogged: eaten.protein,
    proteinTarget: proteinTargetFor(planned.protein, profile.proteinTargetG),
    workout: !workoutDay
      ? 'none'
      : workoutDay.kind === 'rest'
        ? 'rest'
        : entries.includes(WORKOUT_ENTRY)
          ? 'done'
          : 'todo',
  };

  return {
    ...input,
    ...closureFor(input),
    dateKey,
    programDay,
    inProgram: Boolean(nutrition) || Boolean(workoutDay),
  };
}
