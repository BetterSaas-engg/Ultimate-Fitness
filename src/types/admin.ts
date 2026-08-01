/**
 * Thin admin sides. Demo only - there is no auth, and the role picker is
 * labelled as such everywhere it appears.
 */

export type Role = 'member' | 'trainer' | 'nutritionist';

export const ROLES: Array<{ role: Role; label: string; blurb: string }> = [
  { role: 'member', label: 'Member', blurb: "The gym-goer's app" },
  { role: 'trainer', label: 'Trainer', blurb: 'Edit workout phases and exercises' },
  { role: 'nutritionist', label: 'Nutritionist', blurb: 'Edit meals, approve macros and swaps' },
];

/** Overrides for one meal item. Absent fields keep the seed's value. */
export interface NutritionItemEdit {
  food?: string;
  qty?: number | string | null;
  unit?: string | null;
}

/** Overrides for one exercise. */
export interface WorkoutExerciseEdit {
  name?: string;
  sets?: number;
  reps?: string;
  /** Trainer has confirmed this exercise is real content, not a stand-in. */
  confirmedReal?: boolean;
}

export type SwapGroupStatus = 'pending' | 'approved' | 'rejected';

export interface AdminEdits {
  /** key: nutrition:<phaseId>:<day>:<slot>:<itemIndex> */
  nutritionItems: Record<string, NutritionItemEdit>;
  /** key: workout:<phaseId>:<day>:<exerciseIndex> */
  workoutExercises: Record<string, WorkoutExerciseEdit>;
  /** key: workout:<phaseId>:<day> */
  workoutSessionLabels: Record<string, string>;
  /**
   * Approved macro values, keyed by FOOD + SERVING rather than by item
   * occurrence - "chicken breast 5 oz" appears ten times across the two weeks
   * and approving each separately would be 165 toggles instead of ~40.
   */
  approvedMacros: Record<string, true>;
  /** key: groupId — nutritionist-approved food swaps */
  swapGroups: Record<string, SwapGroupStatus>;
  /** key: groupId — TRAINER-approved exercise swaps */
  exerciseGroups: Record<string, SwapGroupStatus>;
  /** key: workout:<phaseId>:<day> — exercises the trainer added to a session */
  addedExercises: Record<string, AddedExercise[]>;
  /** Weeks duplicated from an existing one by the nutritionist. */
  derivedPhases: DerivedPhase[];
}

export interface AddedExercise {
  name: string;
  sets?: number;
  reps?: string;
  exerciseId?: string;
  targets?: string[];
}

/** "Save as week 3" - a copy of an existing week, edited from there. */
export interface DerivedPhase {
  phaseId: string;
  sourcePhaseId: string;
  label: string;
  sequence: number;
}

export const EMPTY_EDITS: AdminEdits = {
  nutritionItems: {},
  workoutExercises: {},
  workoutSessionLabels: {},
  approvedMacros: {},
  swapGroups: {},
  exerciseGroups: {},
  addedExercises: {},
  derivedPhases: [],
};
