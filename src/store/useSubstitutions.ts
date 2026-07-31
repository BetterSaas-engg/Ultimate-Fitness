import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DaySubstitutions } from '@/lib/macros';
import { substitutionKey } from '@/lib/macros';

const KEY = 'uf.subs.v1';

/**
 * Per member, per day. Keyed by real calendar date, like the log.
 *
 * This is an OVERLAY - the seed is never mutated, so the original is always one
 * tap away and a cleared substitution restores the gym's plan exactly.
 */
export type SubstitutionMap = Record<string, DaySubstitutions>;

let cache: SubstitutionMap = {};
let loaded = false;
const listeners = new Set<(s: SubstitutionMap) => void>();

async function persist(next: SubstitutionMap) {
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadSubstitutions(): Promise<SubstitutionMap> {
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as SubstitutionMap) : {};
  loaded = true;
  return cache;
}

export function useSubstitutions(dateKey: string) {
  const [all, setAll] = useState<SubstitutionMap>(cache);

  useEffect(() => {
    listeners.add(setAll);
    if (!loaded) loadSubstitutions().then(setAll);
    return () => {
      listeners.delete(setAll);
    };
  }, []);

  const forDay: DaySubstitutions = all[dateKey] ?? {};

  const substitute = useCallback(
    async (slot: number, itemIndex: number, foodId: string) => {
      const day = { ...(cache[dateKey] ?? {}), [substitutionKey(slot, itemIndex)]: foodId };
      await persist({ ...cache, [dateKey]: day });
    },
    [dateKey]
  );

  const restore = useCallback(
    async (slot: number, itemIndex: number) => {
      const day = { ...(cache[dateKey] ?? {}) };
      delete day[substitutionKey(slot, itemIndex)];
      await persist({ ...cache, [dateKey]: day });
    },
    [dateKey]
  );

  const clearAll = useCallback(async () => {
    await persist({});
  }, []);

  return { substitutions: forDay, substitute, restore, clearAll };
}
