import nutritionProgramJson from '@seed/program.json';
import week1Json from '@seed/week1.json';
import week2Json from '@seed/week2.json';
import workoutProgramJson from '@seed/workout-program.json';
import phase1Json from '@seed/workout-phase1-full-body.json';
import phase2Json from '@seed/workout-phase2-split.json';

import type {
  NutritionDay,
  NutritionPhase,
  Program,
  WorkoutDay,
  WorkoutPhase,
} from '@/types/program';

export const NUTRITION_PROGRAM = nutritionProgramJson.program as unknown as Program;
export const WORKOUT_PROGRAM = workoutProgramJson.program as unknown as Program;

export const NUTRITION_PHASES: NutritionPhase[] = [
  week1Json as unknown as NutritionPhase,
  week2Json as unknown as NutritionPhase,
];

export const WORKOUT_PHASES: WorkoutPhase[] = [
  phase1Json as unknown as WorkoutPhase,
  phase2Json as unknown as WorkoutPhase,
];

/* ------------------------------------------------------------------ */
/* Nutrition: program day -> calendar day within a 7-day week          */
/* ------------------------------------------------------------------ */

export interface NutritionToday {
  phase: NutritionPhase;
  phaseIndex: number;
  /** 1-based day within the phase. */
  dayInPhase: number;
  day: NutritionDay;
  /** true once the member has run past the content we actually have. */
  beyondProgram: boolean;
}

const NUTRITION_TOTAL_DAYS = NUTRITION_PHASES.reduce((n, p) => n + p.durationDays, 0);

export function getNutritionForDay(programDay: number): NutritionToday | null {
  if (programDay < 1) return null;

  const beyondProgram = programDay > NUTRITION_TOTAL_DAYS;

  // Past the seeded content we hold the member on the final phase rather than
  // inventing a week 3. The gym owns what comes next.
  let cursor = beyondProgram ? ((programDay - 1) % NUTRITION_TOTAL_DAYS) + 1 : programDay;

  for (let i = 0; i < NUTRITION_PHASES.length; i++) {
    const phase = NUTRITION_PHASES[i];
    if (cursor <= phase.durationDays) {
      const day = phase.days.find((d) => d.day === cursor);
      if (!day) return null;
      return { phase, phaseIndex: i, dayInPhase: cursor, day, beyondProgram };
    }
    cursor -= phase.durationDays;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Workout: program day -> session or rest                             */
/* ------------------------------------------------------------------ */

/**
 * Which days of the program week carry a session. Position within the member's
 * own week, not a fixed weekday - someone who starts on a Thursday trains
 * Thu / Sat / Mon.
 */
const SESSION_OFFSETS = [0, 2, 4];

export interface WorkoutToday {
  kind: 'session' | 'rest';
  phase: WorkoutPhase;
  phaseIndex: number;
  /** Which week of the whole program, 1-based. */
  programWeek: number;
  /** Present only when kind === 'session'. */
  session?: WorkoutDay;
  /** 1..sessionsPerWeek. Present only for sessions. */
  sessionOrdinal?: number;
  beyondProgram: boolean;
}

const WORKOUT_TOTAL_WEEKS = WORKOUT_PHASES.reduce((n, p) => n + p.durationWeeks, 0);

export function getWorkoutForDay(programDay: number): WorkoutToday | null {
  if (programDay < 1) return null;

  const weekIndexRaw = Math.floor((programDay - 1) / 7);
  const dayInWeek = (programDay - 1) % 7;
  const beyondProgram = weekIndexRaw >= WORKOUT_TOTAL_WEEKS;

  // Past the seeded 8 weeks we cycle the final phase rather than fabricate one.
  const weekIndex = beyondProgram ? weekIndexRaw % WORKOUT_TOTAL_WEEKS : weekIndexRaw;

  let phaseIndex = 0;
  let weeksLeft = weekIndex;
  for (let i = 0; i < WORKOUT_PHASES.length; i++) {
    if (weeksLeft < WORKOUT_PHASES[i].durationWeeks) {
      phaseIndex = i;
      break;
    }
    weeksLeft -= WORKOUT_PHASES[i].durationWeeks;
  }
  const phase = WORKOUT_PHASES[phaseIndex];

  const slot = SESSION_OFFSETS.indexOf(dayInWeek);
  const base = {
    phase,
    phaseIndex,
    programWeek: weekIndexRaw + 1,
    beyondProgram,
  };

  // Four calendar days a week have no session. Rest is a real state the UI
  // renders, not an absence - a beginner needs to be told why nothing is on.
  if (slot === -1) return { ...base, kind: 'rest' };

  const session = phase.days[slot % phase.days.length];
  return { ...base, kind: 'session', session, sessionOrdinal: slot + 1 };
}

/** True when any exercise in the phase is still trainer-pending. */
export function phaseIsPlaceholder(phase: WorkoutPhase): boolean {
  return phase.contentStatus === 'placeholder';
}
