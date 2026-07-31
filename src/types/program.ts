/**
 * Shared shape for every kind of guided content.
 *
 * Nutrition and workout share Program -> Phase -> Day, but "Day" means two
 * different things and the code should never blur them:
 *
 *   nutrition  day = calendar day 1..7 within the week
 *   workout    day = SESSION ORDINAL 1..sessionsPerWeek. Four calendar days a
 *              week have no session at all; those are rest days.
 *
 * Classes are neither - they are a weekly recurrence and live in ./classes.ts.
 */

export type GoalType = 'athlete' | 'super-fit' | 'fat-loss' | 'stay-healthy';
export type Tier = 'free' | 'premium';
export type ProgramType = 'nutrition' | 'workout';

/** How an item differs from the previous phase, as marked on the paper sheet. */
export type ChangeKind = 'added' | 'increased' | 'swapped-in';

export interface Goal {
  goalType: GoalType;
  label: string;
  blurb: string;
  /** false -> rendered as "Coming soon" and not selectable. */
  available: boolean;
}

export interface ProgramRef {
  id: string;
  type: ProgramType;
  goalType: GoalType;
  tier: Tier;
}

export interface PhaseRef {
  phaseId: string;
  sequence: number;
  name?: string;
  /** Nutrition phases. */
  durationDays?: number;
  /** Workout phases. */
  durationWeeks?: number;
  sessionsPerWeek?: number;
  progressionSummary?: string;
}

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  goalType: GoalType;
  tier: Tier;
  audience?: string;
  mealSlotsPerDay?: number;
  sessionsPerWeek?: number;
  phases: PhaseRef[];
  modelNotes?: string[];
}

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealItem {
  food: string;
  /** number, or a range like "2-3", or null when the sheet gave no amount. */
  qty: number | string | null;
  unit: string | null;
  change?: ChangeKind;
  /**
   * Grams, at the serving listed above - not per unit. "chicken breast 5 oz"
   * and "chicken breast 6 oz" carry separate values, so week 2's portion bump
   * shows a real macro increase without any arithmetic.
   *
   * Absent when the sheet gave no quantity. No quantity, no honest macro.
   */
  macros?: Macros;
  /** Always true today - a reference approximation, not nutritionist-verified. */
  macrosEstimated?: boolean;
  /** Escape hatch: overrides the alias table for this item only. */
  foodId?: string;
}

export interface Meal {
  slot: number;
  label: string;
  /** The paper grid has no row labels - slot names are our assumption. */
  labelAssumed?: boolean;
  items: MealItem[];
  prep?: string;
  changesFromPreviousPhase?: string[];
}

export interface NutritionDay {
  day: number;
  meals: Meal[];
}

export interface NutritionPhase {
  programId: string;
  phaseId: string;
  sequence: number;
  durationDays: number;
  verified: boolean;
  source?: string;
  transcriptionNotes?: string[];
  days: NutritionDay[];
}

/* ------------------------------------------------------------------ */
/* Workout                                                             */
/* ------------------------------------------------------------------ */

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  notes?: string;
  /** true while the content is a structural stand-in, not trainer-written. */
  placeholder?: boolean;
}

export interface WorkoutDay {
  /** Session ordinal within the week, NOT a calendar day. */
  day: number;
  label: string;
  labelAssumed?: boolean;
  exercises: Exercise[];
  prep?: string;
}

export interface WorkoutPhase {
  programId: string;
  phaseId: string;
  sequence: number;
  durationWeeks: number;
  sessionsPerWeek: number;
  verified: boolean;
  contentStatus?: 'placeholder' | 'verified';
  contentOwner?: string;
  source?: string;
  transcriptionNotes?: string[];
  days: WorkoutDay[];
}
