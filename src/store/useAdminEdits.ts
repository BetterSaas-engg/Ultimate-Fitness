import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_EDITS,
  type AdminEdits,
  type NutritionItemEdit,
  type SwapGroupStatus,
  type WorkoutExerciseEdit,
} from '@/types/admin';

const KEY = 'uf.adminEdits.v1';

/**
 * Admin edits are an OVERLAY on the seed, exactly like member substitutions.
 * The seed is never mutated, so "revert all" restores the gym's content
 * exactly and nothing an admin does can corrupt the source data.
 *
 * Member screens read this store too, which is what makes the demo beat work:
 * the nutritionist edits an item, you switch role, and it is on Today.
 */

let cache: AdminEdits = EMPTY_EDITS;
let loaded = false;
const listeners = new Set<(e: AdminEdits) => void>();

async function persist(next: AdminEdits) {
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadAdminEdits(): Promise<AdminEdits> {
  const raw = await AsyncStorage.getItem(KEY);
  // Merge over EMPTY_EDITS so a store written by an older build (missing a
  // section) still yields a fully-shaped object.
  cache = raw ? { ...EMPTY_EDITS, ...(JSON.parse(raw) as Partial<AdminEdits>) } : EMPTY_EDITS;
  loaded = true;
  return cache;
}

export const nutritionItemKey = (phaseId: string, day: number, slot: number, index: number) =>
  `nutrition:${phaseId}:${day}:${slot}:${index}`;

export const workoutExerciseKey = (phaseId: string, day: number, index: number) =>
  `workout:${phaseId}:${day}:${index}`;

export const workoutSessionKey = (phaseId: string, day: number) => `workout:${phaseId}:${day}`;

export function useAdminEdits() {
  const [edits, setEdits] = useState<AdminEdits>(cache);

  useEffect(() => {
    listeners.add(setEdits);
    if (!loaded) loadAdminEdits().then(setEdits);
    return () => {
      listeners.delete(setEdits);
    };
  }, []);

  const editNutritionItem = useCallback(
    async (phaseId: string, day: number, slot: number, index: number, patch: NutritionItemEdit) => {
      const k = nutritionItemKey(phaseId, day, slot, index);
      await persist({
        ...cache,
        nutritionItems: { ...cache.nutritionItems, [k]: { ...cache.nutritionItems[k], ...patch } },
      });
    },
    []
  );

  const editExercise = useCallback(
    async (phaseId: string, day: number, index: number, patch: WorkoutExerciseEdit) => {
      const k = workoutExerciseKey(phaseId, day, index);
      await persist({
        ...cache,
        workoutExercises: {
          ...cache.workoutExercises,
          [k]: { ...cache.workoutExercises[k], ...patch },
        },
      });
    },
    []
  );

  const editSessionLabel = useCallback(async (phaseId: string, day: number, label: string) => {
    await persist({
      ...cache,
      workoutSessionLabels: { ...cache.workoutSessionLabels, [workoutSessionKey(phaseId, day)]: label },
    });
  }, []);

  const setMacroApproved = useCallback(async (macroKey: string, approved: boolean) => {
    const next = { ...cache.approvedMacros };
    if (approved) next[macroKey] = true;
    else delete next[macroKey];
    await persist({ ...cache, approvedMacros: next });
  }, []);

  const setSwapGroupStatus = useCallback(async (groupId: string, status: SwapGroupStatus) => {
    await persist({ ...cache, swapGroups: { ...cache.swapGroups, [groupId]: status } });
  }, []);

  const revertAll = useCallback(async () => {
    await persist(EMPTY_EDITS);
  }, []);

  /** How many overrides exist, for the "n edits" counters on the hub. */
  const counts = {
    nutritionItems: Object.keys(edits.nutritionItems).length,
    workoutExercises: Object.keys(edits.workoutExercises).length,
    sessionLabels: Object.keys(edits.workoutSessionLabels).length,
    approvedMacros: Object.keys(edits.approvedMacros).length,
    swapGroups: Object.keys(edits.swapGroups).length,
  };
  const total =
    counts.nutritionItems + counts.workoutExercises + counts.sessionLabels + counts.swapGroups;

  return {
    edits,
    counts,
    total,
    editNutritionItem,
    editExercise,
    editSessionLabel,
    setMacroApproved,
    setSwapGroupStatus,
    revertAll,
  };
}
