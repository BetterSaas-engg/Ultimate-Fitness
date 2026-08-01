import type {
  Meal,
  MealItem,
  NutritionDay,
  NutritionPhase,
  WorkoutDay,
  WorkoutPhase,
} from '@/types/program';
import type { AdminEdits } from '@/types/admin';
import { nutritionItemKey, workoutExerciseKey, workoutSessionKey } from '@/store/useAdminEdits';
import { normalizeFoodKey } from './foods';

/**
 * Applies admin overrides on top of seed content.
 *
 * Pure functions over (seed, edits) - nothing mutates, so the same seed always
 * yields the same result for a given edit set, and reverting is just dropping
 * the edits.
 */

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

export function applyItemEdit(
  item: MealItem,
  phaseId: string,
  day: number,
  slot: number,
  index: number,
  edits: AdminEdits
): MealItem {
  const patch = edits.nutritionItems[nutritionItemKey(phaseId, day, slot, index)];
  if (!patch) return item;

  const next: MealItem = { ...item };
  if (patch.food !== undefined) next.food = patch.food;
  if (patch.qty !== undefined) next.qty = patch.qty;
  if (patch.unit !== undefined) next.unit = patch.unit;

  // Changing the food or the serving invalidates the seed's macros - they were
  // measured for the original food at the original amount. Better to show no
  // number than a stale one.
  const servingChanged =
    (patch.food !== undefined && normalizeFoodKey(patch.food) !== normalizeFoodKey(item.food)) ||
    (patch.qty !== undefined && patch.qty !== item.qty) ||
    (patch.unit !== undefined && patch.unit !== item.unit);

  if (servingChanged && item.macros) {
    delete next.macros;
    delete next.macrosEstimated;
    next.macrosInvalidated = true;
  }
  return next;
}

export function applyMealEdits(
  meal: Meal,
  phaseId: string,
  day: number,
  edits: AdminEdits
): Meal {
  return {
    ...meal,
    items: meal.items.map((it, i) => applyItemEdit(it, phaseId, day, meal.slot, i, edits)),
  };
}

export function applyNutritionDayEdits(
  dayData: NutritionDay,
  phaseId: string,
  edits: AdminEdits
): NutritionDay {
  return {
    ...dayData,
    meals: dayData.meals.map((m) => applyMealEdits(m, phaseId, dayData.day, edits)),
  };
}

/* ------------------------------------------------------------------ */
/* Workout                                                             */
/* ------------------------------------------------------------------ */

export function applySessionEdits(
  session: WorkoutDay,
  phaseId: string,
  edits: AdminEdits
): WorkoutDay {
  const label = edits.workoutSessionLabels[workoutSessionKey(phaseId, session.day)] ?? session.label;

  const added = (edits.addedExercises?.[workoutSessionKey(phaseId, session.day)] ?? []).map(
    (a) => ({ ...a, placeholder: true }) as WorkoutDay['exercises'][number]
  );

  return {
    ...session,
    label,
    exercises: session.exercises.map((ex, i) => {
      const patch = edits.workoutExercises[workoutExerciseKey(phaseId, session.day, i)];
      if (!patch) return ex;
      return {
        ...ex,
        name: patch.name ?? ex.name,
        sets: patch.sets ?? ex.sets,
        reps: patch.reps ?? ex.reps,
        placeholder: patch.confirmedReal ? false : ex.placeholder,
      };
    }).concat(added),
  };
}

/**
 * The placeholder banner clears only when EVERY exercise in the phase has been
 * confirmed real. Deliberately all-or-nothing: a per-exercise dismissal would
 * let the banner disappear while stand-in programming is still on screen.
 */
export function phaseStillPlaceholder(phase: WorkoutPhase, edits: AdminEdits): boolean {
  if (phase.contentStatus !== 'placeholder') return false;
  return phase.days.some((session) =>
    session.exercises.some((ex, i) => {
      const patch = edits.workoutExercises[workoutExerciseKey(phase.phaseId, session.day, i)];
      return !(patch?.confirmedReal ?? false) && ex.placeholder;
    })
  );
}

export function phaseConfirmedCount(phase: WorkoutPhase, edits: AdminEdits) {
  let total = 0;
  let confirmed = 0;
  for (const session of phase.days)
    for (let i = 0; i < session.exercises.length; i++) {
      total++;
      if (edits.workoutExercises[workoutExerciseKey(phase.phaseId, session.day, i)]?.confirmedReal)
        confirmed++;
    }
  return { total, confirmed };
}

/* ------------------------------------------------------------------ */
/* Macro approval - grouped by food + serving, not per occurrence       */
/* ------------------------------------------------------------------ */

export function macroApprovalKey(item: Pick<MealItem, 'food' | 'qty' | 'unit'>): string {
  return `${normalizeFoodKey(item.food)}|${item.qty ?? ''}|${item.unit ?? ''}`;
}

export function isMacroApproved(
  item: Pick<MealItem, 'food' | 'qty' | 'unit'>,
  edits: AdminEdits
): boolean {
  return Boolean(edits.approvedMacros[macroApprovalKey(item)]);
}

/** An item still counts as estimated until its food+serving is approved. */
export function itemIsEstimated(item: MealItem, edits: AdminEdits): boolean {
  if (!item.macros || !item.macrosEstimated) return false;
  return !isMacroApproved(item, edits);
}

/* ------------------------------------------------------------------ */
/* Swap groups                                                         */
/* ------------------------------------------------------------------ */

export function swapGroupStatus(groupId: string, edits: AdminEdits) {
  return edits.swapGroups[groupId] ?? 'pending';
}

/** Rejected groups stop offering swaps to members. Pending still works. */
export function swapGroupUsable(groupId: string, edits: AdminEdits): boolean {
  return swapGroupStatus(groupId, edits) !== 'rejected';
}

/* ---- exercise swap groups: same model, trainer-approved ---- */

export function exerciseGroupStatus(groupId: string, edits: AdminEdits) {
  return edits.exerciseGroups?.[groupId] ?? 'pending';
}

export function exerciseGroupUsable(groupId: string, edits: AdminEdits): boolean {
  return exerciseGroupStatus(groupId, edits) !== 'rejected';
}

/* ------------------------------------------------------------------ */
/* Derived weeks — "Save as week 3"                                    */
/* ------------------------------------------------------------------ */

/**
 * A derived week is a POINTER at a source week, not a copy of its data.
 *
 * That matters: the duplicate starts life identical, then diverges only where
 * the nutritionist actually edits it, because item edits are keyed by phaseId
 * and the derived phase has its own. Nothing is duplicated in storage, and a
 * later correction to week 2 still flows into anything derived from it that
 * has not been overridden.
 */
export function derivedNutritionPhases(
  seedPhases: NutritionPhase[],
  edits: AdminEdits
): NutritionPhase[] {
  const all = [...seedPhases];
  for (const d of edits.derivedPhases ?? []) {
    const source = all.find((p) => p.phaseId === d.sourcePhaseId);
    if (!source) continue; // source was removed; drop the derivative quietly
    all.push({
      ...source,
      phaseId: d.phaseId,
      sequence: d.sequence,
      verified: false,
      source: `Duplicated from ${source.phaseId} by the nutrition team`,
      transcriptionNotes: [
        `Starts identical to ${source.phaseId}. Edits made here do not affect the original.`,
      ],
    });
  }
  return all.sort((a, b) => a.sequence - b.sequence);
}

/** Label for a derived phase, or undefined for a seed phase. */
export function derivedPhaseLabel(phaseId: string, edits: AdminEdits): string | undefined {
  return (edits.derivedPhases ?? []).find((p) => p.phaseId === phaseId)?.label;
}
