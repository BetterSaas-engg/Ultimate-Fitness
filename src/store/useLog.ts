import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'uf.log.v1';

/**
 * What the member actually did. Keyed by real calendar date so it survives a
 * change to the start date - the log is a record of life, not of the program.
 *
 * Entry ids:
 *   meal:<slot>       a meal slot on that date
 *   workout           that date's session
 */
export type LogMap = Record<string, string[]>;

export const mealEntryId = (slot: number) => `meal:${slot}`;
export const WORKOUT_ENTRY = 'workout';

let cache: LogMap = {};
let loaded = false;
const listeners = new Set<(l: LogMap) => void>();

function broadcast(next: LogMap) {
  cache = next;
  listeners.forEach((l) => l(next));
}

async function persist(next: LogMap) {
  broadcast(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadLog(): Promise<LogMap> {
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as LogMap) : {};
  loaded = true;
  return cache;
}

export function useLog() {
  const [log, setLog] = useState<LogMap>(cache);

  useEffect(() => {
    listeners.add(setLog);
    if (!loaded) loadLog().then(setLog);
    return () => {
      listeners.delete(setLog);
    };
  }, []);

  const toggle = useCallback(async (dateKey: string, entryId: string) => {
    const day = cache[dateKey] ?? [];
    const next = day.includes(entryId)
      ? { ...cache, [dateKey]: day.filter((e) => e !== entryId) }
      : { ...cache, [dateKey]: [...day, entryId] };
    await persist(next);
  }, []);

  const isLogged = useCallback(
    (dateKey: string, entryId: string) => (log[dateKey] ?? []).includes(entryId),
    [log]
  );

  const countOn = useCallback((dateKey: string) => (log[dateKey] ?? []).length, [log]);

  const clear = useCallback(async () => {
    await persist({});
  }, []);

  return { log, toggle, isLogged, countOn, clear };
}
