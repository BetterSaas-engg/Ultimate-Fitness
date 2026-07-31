import aliasJson from '@seed/food-aliases.json';

/**
 * Food string -> canonical foodId.
 *
 * EXACT match after trim + lowercase + whitespace collapse. Nothing else. No
 * stemming, no plural rules, no token dropping, no fuzzy distance.
 *
 * The plans contain "pepper" (cracked black pepper, a seasoning) and "peppers"
 * (bell peppers, a vegetable). Any plural-stemming normalizer merges them, and
 * it fails silently - the member just sees a wrong number. So the mapping is a
 * hand-authored table the nutritionist can audit, and anything not in it is
 * simply unmapped rather than guessed at.
 */
const RAW = (aliasJson as { aliases: Record<string, string | null> }).aliases;

export function normalizeFoodKey(food: string): string {
  return food.trim().toLowerCase().replace(/\s+/g, ' ');
}

const TABLE = new Map<string, string | null>(
  Object.entries(RAW).map(([k, v]) => [normalizeFoodKey(k), v])
);

export type FoodLookup =
  /** Mapped to a canonical food. */
  | { status: 'mapped'; foodId: string }
  /** Reviewed and deliberately excluded - a seasoning or garnish. */
  | { status: 'excluded' }
  /** Not in the table at all. Shows up in the coverage report. */
  | { status: 'unknown' };

export function lookupFood(food: string): FoodLookup {
  const key = normalizeFoodKey(food);
  if (!TABLE.has(key)) return { status: 'unknown' };
  const id = TABLE.get(key);
  return id === null ? { status: 'excluded' } : { status: 'mapped', foodId: id! };
}

/** foodId for an item, honouring an inline override. */
export function foodIdOf(item: { food: string; foodId?: string }): string | null {
  if (item.foodId) return item.foodId;
  const r = lookupFood(item.food);
  return r.status === 'mapped' ? r.foodId : null;
}

export const ALIAS_COUNT = TABLE.size;
