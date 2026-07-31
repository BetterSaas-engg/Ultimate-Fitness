import catalogJson from '@seed/catalog.json';
import type { Goal, GoalType, ProgramRef, ProgramType, Tier } from '@/types/program';

const catalog = catalogJson as unknown as {
  goals: Goal[];
  programs: ProgramRef[];
};

/** Onboarding order comes from the seed, not from code. */
export const GOALS: Goal[] = catalog.goals;

export const PROGRAMS: ProgramRef[] = catalog.programs;

export function getGoal(goalType: GoalType): Goal | undefined {
  return GOALS.find((g) => g.goalType === goalType);
}

export function isGoalAvailable(goalType: GoalType): boolean {
  return getGoal(goalType)?.available ?? false;
}

export function programRefFor(goalType: GoalType, type: ProgramType): ProgramRef | undefined {
  return PROGRAMS.find((p) => p.goalType === goalType && p.type === type);
}

/** Free members can see free content only. Premium sees everything. */
export function tierAllows(memberTier: Tier, contentTier: Tier): boolean {
  if (contentTier === 'free') return true;
  return memberTier === 'premium';
}
