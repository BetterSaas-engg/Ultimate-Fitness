import type { ChangeKind, Meal, MealItem, NutritionPhase } from '@/types/program';

/**
 * Week-over-week progression diff.
 *
 * The seed's `change` flag says WHAT kind of change it was, but week 2 only
 * stores the new value - so "chicken 6oz, increased" cannot render as
 * "5 oz -> 6 oz" without looking back at week 1. That is why this is a real
 * phase-to-phase diff and not a flag reader.
 *
 * It also catches what no flag can: items that were DROPPED. Bouillons and
 * toasted almonds are simply absent from week 2 - nothing in week 2 can mark
 * an item that is not there. Only a set difference finds them.
 */

export interface DiffItem extends MealItem {
  /** Seed flag if present, otherwise computed. */
  changeKind?: ChangeKind;
  /** The matching week-1 item, when there is one. */
  prev?: MealItem;
  /** Both quantities numeric and the new one is larger. */
  increasedFrom?: number;
}

export interface MealDiff {
  slot: number;
  label: string;
  items: DiffItem[];
  /** Present in the previous phase, gone from this one. */
  removed: MealItem[];
  /** Too many removals to list individually - render as one summary line. */
  wholesaleSwap: boolean;
  /** Free-text notes the gym wrote on the sheet. */
  notes: string[];
  hasChanges: boolean;
}

export interface DayDiff {
  day: number;
  meals: MealDiff[];
  hasChanges: boolean;
}

export interface PhaseDiff {
  fromPhaseId: string;
  toPhaseId: string;
  days: DayDiff[];
  counts: { added: number; increased: number; swappedIn: number; removed: number };
}

const norm = (s: string) => s.trim().toLowerCase();

function findItem(items: MealItem[], food: string): MealItem | undefined {
  return items.find((i) => norm(i.food) === norm(food));
}

function numericQty(q: MealItem['qty']): number | null {
  return typeof q === 'number' ? q : null;
}

function diffMeal(prev: Meal | undefined, next: Meal): MealDiff {
  const prevItems = prev?.items ?? [];

  /**
   * The sheet is authoritative about WHICH meals changed. If the gym flagged
   * nothing in this meal, we do not invent changes from name drift.
   *
   * Day 4's shake is why: week 1 says "almond milk" + "peanut butter", week 2
   * says "unsweetened almond milk" + "nut butter", and the gym's own note says
   * "Same shake; nut butter now explicit". A naive diff calls that two adds and
   * two drops. It is the same shake.
   *
   * Every genuinely dropped item (both bouillons, the toasted almonds) sits in
   * a meal that DOES carry flags, so nothing real is lost by this rule.
   */
  const mealWasFlagged = next.items.some((i) => i.change);

  const items: DiffItem[] = next.items.map((item) => {
    const match = findItem(prevItems, item.food);
    const out: DiffItem = { ...item, prev: match };

    // The seed flag wins on intent - it distinguishes a swap from a plain add,
    // which a diff alone cannot tell.
    if (item.change) out.changeKind = item.change;
    else if (!match && mealWasFlagged) out.changeKind = 'added';

    if (out.changeKind === 'increased' || (match && !item.change)) {
      const before = numericQty(match?.qty ?? null);
      const after = numericQty(item.qty);
      if (before !== null && after !== null && after > before) {
        out.increasedFrom = before;
        out.changeKind = 'increased';
      }
    }
    return out;
  });

  const removed = mealWasFlagged
    ? prevItems.filter((p) => !findItem(next.items, p.food))
    : [];
  const notes = next.changesFromPreviousPhase ?? [];

  // A snack replaced outright leaves 5-6 struck-through lines above 3 new ones,
  // which reads as damage rather than progress. Past two, collapse to one line.
  const wholesaleSwap = removed.length > 2;

  return {
    slot: next.slot,
    label: next.label,
    items,
    removed,
    wholesaleSwap,
    notes,
    hasChanges: items.some((i) => i.changeKind) || removed.length > 0 || notes.length > 0,
  };
}

export function diffPhases(prev: NutritionPhase, next: NutritionPhase): PhaseDiff {
  const days: DayDiff[] = next.days.map((nextDay) => {
    const prevDay = prev.days.find((d) => d.day === nextDay.day);
    const meals = nextDay.meals.map((m) =>
      diffMeal(prevDay?.meals.find((p) => p.slot === m.slot), m)
    );
    return { day: nextDay.day, meals, hasChanges: meals.some((m) => m.hasChanges) };
  });

  const counts = { added: 0, increased: 0, swappedIn: 0, removed: 0 };
  for (const d of days) {
    for (const m of d.meals) {
      counts.removed += m.removed.length;
      for (const i of m.items) {
        if (i.changeKind === 'added') counts.added++;
        else if (i.changeKind === 'increased') counts.increased++;
        else if (i.changeKind === 'swapped-in') counts.swappedIn++;
      }
    }
  }

  return { fromPhaseId: prev.phaseId, toPhaseId: next.phaseId, days, counts };
}

/** Diff for a single day, or null when there is no previous phase to compare. */
export function diffForDay(
  prev: NutritionPhase | undefined,
  next: NutritionPhase,
  day: number
): DayDiff | null {
  if (!prev) return null;
  const full = diffPhases(prev, next);
  return full.days.find((d) => d.day === day) ?? null;
}

/** Renders "5 oz -> 6 oz" for the increased case. */
export function formatIncrease(item: DiffItem): string | null {
  if (item.changeKind !== 'increased' || item.increasedFrom === undefined) return null;
  const unit = item.unit ? ` ${item.unit}` : '';
  return `${item.increasedFrom}${unit} → ${item.qty}${unit}`;
}

/** "2 slice", "0.5 cup", "2-3", or "" when the sheet gave no amount. */
export function formatQty(item: Pick<MealItem, 'qty' | 'unit'>): string {
  if (item.qty === null || item.qty === undefined) return '';
  return item.unit ? `${item.qty} ${item.unit}` : String(item.qty);
}
