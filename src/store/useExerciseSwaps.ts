import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'uf.exerciseSwaps.v1';

/**
 * Member exercise swaps. Same overlay model as food substitutions: keyed by
 * real calendar date, seed never mutated, original always one tap away.
 *
 * Key within a day is the exercise's index in the session.
 */
export type DaySwaps = Record<string, string>;
export type SwapMap = Record<string, DaySwaps>;

export const exerciseSwapKey = (index: number) => String(index);

let cache: SwapMap = {};
let loaded = false;
const listeners = new Set<(s: SwapMap) => void>();

async function persist(next: SwapMap) {
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadExerciseSwaps(): Promise<SwapMap> {
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as SwapMap) : {};
  loaded = true;
  return cache;
}

export function useExerciseSwaps(dateKey: string) {
  const [all, setAll] = useState<SwapMap>(cache);

  useEffect(() => {
    listeners.add(setAll);
    if (!loaded) loadExerciseSwaps().then(setAll);
    return () => {
      listeners.delete(setAll);
    };
  }, []);

  const swaps: DaySwaps = all[dateKey] ?? {};

  const swap = useCallback(
    async (index: number, exerciseId: string) => {
      const day = { ...(cache[dateKey] ?? {}), [exerciseSwapKey(index)]: exerciseId };
      await persist({ ...cache, [dateKey]: day });
    },
    [dateKey]
  );

  const restore = useCallback(
    async (index: number) => {
      const day = { ...(cache[dateKey] ?? {}) };
      delete day[exerciseSwapKey(index)];
      await persist({ ...cache, [dateKey]: day });
    },
    [dateKey]
  );

  const clearAll = useCallback(async () => {
    await persist({});
  }, []);

  return { swaps, swap, restore, clearAll };
}
