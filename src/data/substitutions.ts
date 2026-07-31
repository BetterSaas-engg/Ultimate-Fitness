import subsJson from '@seed/substitutions.json';
import type { SubstitutionGroup, SubstitutionMember } from '@/types/substitutions';
import { foodIdOf } from './foods';
import type { AdminEdits } from '@/types/admin';
import { swapGroupUsable } from './adminOverlay';

export const SUBSTITUTION_GROUPS: SubstitutionGroup[] = (
  subsJson as unknown as { groups: SubstitutionGroup[] }
).groups;

/** One group per foodId - a food must not appear in two groups. */
const BY_FOOD_ID = new Map<string, SubstitutionGroup>();
const MEMBER_BY_ID = new Map<string, SubstitutionMember>();

for (const group of SUBSTITUTION_GROUPS) {
  for (const m of group.members) {
    if (!BY_FOOD_ID.has(m.foodId)) BY_FOOD_ID.set(m.foodId, group);
    MEMBER_BY_ID.set(m.foodId, m);
  }
}

export function groupForFoodId(foodId: string | null): SubstitutionGroup | undefined {
  return foodId ? BY_FOOD_ID.get(foodId) : undefined;
}

export function memberById(foodId: string): SubstitutionMember | undefined {
  return MEMBER_BY_ID.get(foodId);
}

/**
 * Swap options for an item: every other member of its group. Returns [] when
 * the food is unmapped or has no group - the Replace affordance then hides
 * rather than offering an empty list.
 */
export function optionsForItem(
  item: { food: string; foodId?: string },
  edits?: AdminEdits
): SubstitutionMember[] {
  const id = foodIdOf(item);
  const group = groupForFoodId(id);
  if (!group) return [];
  // A group the nutritionist rejected stops being offered at all.
  if (edits && !swapGroupUsable(group.groupId, edits)) return [];
  return group.members.filter((m) => m.foodId !== id);
}

export function anyGroupIsPlaceholder(): boolean {
  return SUBSTITUTION_GROUPS.some((g) => g.placeholder);
}
