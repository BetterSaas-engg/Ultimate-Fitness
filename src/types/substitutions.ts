import type { Macros } from './program';

export interface SubstitutionMember {
  foodId: string;
  label: string;
  serving: { qty: number | null; unit: string | null };
  /**
   * This member's own macros at its own serving. Never derived from the food
   * it replaces - a delta computed from the thing being replaced is circular.
   */
  macros: Macros;
  macrosEstimated?: boolean;
  note?: string;
}

export interface SubstitutionGroup {
  groupId: string;
  label: string;
  /** true while the group is pending nutritionist approval. */
  placeholder?: boolean;
  members: SubstitutionMember[];
}
