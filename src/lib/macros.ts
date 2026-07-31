import type { Macros, Meal, MealItem } from '@/types/program';
import type { SubstitutionMember } from '@/types/substitutions';
import { memberById } from '@/data/substitutions';

export const ZERO: Macros = { protein: 0, carbs: 0, fat: 0 };

export function addMacros(a: Macros, b: Macros): Macros {
  return { protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat };
}

export function subtractMacros(a: Macros, b: Macros): Macros {
  return { protein: a.protein - b.protein, carbs: a.carbs - b.carbs, fat: a.fat - b.fat };
}

/** Trims float noise from summing values like 3.5 and 0.6. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function roundMacros(m: Macros): Macros {
  return { protein: round1(m.protein), carbs: round1(m.carbs), fat: round1(m.fat) };
}

/* ------------------------------------------------------------------ */
/* Substitution overlay                                                */
/* ------------------------------------------------------------------ */

/** "3:1" - meal slot and item index. Stable for a given phase day. */
export function substitutionKey(slot: number, itemIndex: number): string {
  return `${slot}:${itemIndex}`;
}

/** A day's substitutions: "3:1" -> foodId of the replacement. */
export type DaySubstitutions = Record<string, string>;

export interface ResolvedItem {
  /** What to show. Either the original item or the substitute. */
  food: string;
  qty: number | string | null;
  unit: string | null;
  macros?: Macros;
  macrosEstimated?: boolean;
  /** Original seed item, always. The seed is never mutated. */
  original: MealItem;
  substitute?: SubstitutionMember;
  /** Substitute minus original. Only when both carry macros. */
  delta?: Macros;
}

export function resolveItem(item: MealItem, substituteFoodId?: string): ResolvedItem {
  if (!substituteFoodId) {
    return {
      food: item.food,
      qty: item.qty,
      unit: item.unit,
      macros: item.macros,
      macrosEstimated: item.macrosEstimated,
      original: item,
    };
  }

  const sub = memberById(substituteFoodId);
  if (!sub) {
    // Unknown id (stale storage after a seed change) - fall back to the
    // original rather than dropping the item.
    return resolveItem(item);
  }

  return {
    food: sub.label,
    qty: sub.serving.qty,
    unit: sub.serving.unit,
    macros: sub.macros,
    macrosEstimated: sub.macrosEstimated,
    original: item,
    substitute: sub,
    delta: item.macros ? roundMacros(subtractMacros(sub.macros, item.macros)) : undefined,
  };
}

export function resolveMeal(meal: Meal, subs: DaySubstitutions): ResolvedItem[] {
  return meal.items.map((item, i) => resolveItem(item, subs[substitutionKey(meal.slot, i)]));
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */

export function mealMacros(meal: Meal, subs: DaySubstitutions): Macros {
  return resolveMeal(meal, subs).reduce((acc, r) => (r.macros ? addMacros(acc, r.macros) : acc), ZERO);
}

/** Everything on the plan for the day, substitutions applied. */
export function plannedMacros(meals: Meal[], subs: DaySubstitutions): Macros {
  return roundMacros(meals.reduce((acc, m) => addMacros(acc, mealMacros(m, subs)), ZERO));
}

/** Only the slots the member actually ticked off. */
export function loggedMacros(
  meals: Meal[],
  subs: DaySubstitutions,
  isSlotLogged: (slot: number) => boolean
): Macros {
  return roundMacros(
    meals.reduce((acc, m) => (isSlotLogged(m.slot) ? addMacros(acc, mealMacros(m, subs)) : acc), ZERO)
  );
}

/**
 * True when any item contributing to a total is only an estimate. Today that
 * is everything, but it stops being a lie the moment the nutritionist signs
 * off on part of the table.
 */
export function anyEstimated(meals: Meal[], subs: DaySubstitutions): boolean {
  return meals.some((m) => resolveMeal(m, subs).some((r) => r.macros && r.macrosEstimated));
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(round1(n))}g`;

/**
 * "+38g carbs, −17g protein". Ordered by magnitude so the thing that actually
 * moved reads first. Empty string when nothing changed.
 */
export function formatDelta(delta: Macros): string {
  const parts: Array<{ label: string; value: number }> = [
    { label: 'protein', value: delta.protein },
    { label: 'carbs', value: delta.carbs },
    { label: 'fat', value: delta.fat },
  ];
  return parts
    .filter((p) => round1(p.value) !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .map((p) => `${signed(p.value)} ${p.label}`)
    .join(', ');
}

export function formatServing(qty: number | string | null, unit: string | null): string {
  if (qty === null || qty === undefined) return '';
  return unit ? `${qty} ${unit}` : String(qty);
}
