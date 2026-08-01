import groupsJson from '@seed/exercise-substitutions.json';
import type { ExerciseGroup, ExerciseOption } from '@/types/exercises';
import type { Exercise } from '@/types/program';
import type { AdminEdits } from '@/types/admin';
import { exerciseGroupUsable } from './adminOverlay';

/**
 * Grouped by MOVEMENT PATTERN rather than muscle, because that is what makes
 * two exercises actually interchangeable.
 *
 * Unlike food there is no alias table: we author these names ourselves, so
 * there are no transcription variants to reconcile and the workout seed can
 * carry `exerciseId` inline.
 */
export const EXERCISE_GROUPS: ExerciseGroup[] = (
  groupsJson as unknown as { groups: ExerciseGroup[] }
).groups;

const BY_ID = new Map<string, ExerciseGroup>();
const OPTION_BY_ID = new Map<string, ExerciseOption>();
for (const g of EXERCISE_GROUPS)
  for (const m of g.members) {
    if (!BY_ID.has(m.exerciseId)) BY_ID.set(m.exerciseId, g);
    OPTION_BY_ID.set(m.exerciseId, m);
  }

export function groupForExerciseId(id?: string): ExerciseGroup | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function exerciseOptionById(id: string): ExerciseOption | undefined {
  return OPTION_BY_ID.get(id);
}

/** Alternatives for an exercise: every other member of its pattern group. */
export function optionsForExercise(ex: Exercise, edits?: AdminEdits): ExerciseOption[] {
  const group = groupForExerciseId(ex.exerciseId);
  if (!group) return [];
  // A pattern the trainer rejected stops being offered.
  if (edits && !exerciseGroupUsable(group.groupId, edits)) return [];
  return group.members.filter((m) => m.exerciseId !== ex.exerciseId);
}
