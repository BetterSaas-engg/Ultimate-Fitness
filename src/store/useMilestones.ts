import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  earnedMilestones,
  mostSignificant,
  type EarnedMilestone,
  type MilestoneId,
} from '@/lib/milestones';
import type { DayDeps } from '@/lib/dayStatus';
import { useProfile } from './useProfile';
import { useLog } from './useLog';
import { useSubstitutions } from './useSubstitutions';
import { useAdminEdits } from './useAdminEdits';
import { useStoresReady } from './ready';

const KEY = 'uf.milestones.v1';

/**
 * What has been ACKNOWLEDGED, not what has been achieved.
 *
 * `earned` records the date each milestone became true so the card can name it;
 * `seen` is the list already shown. The achievement itself is always recomputed
 * from the log - see lib/milestones.
 */
export interface MilestoneState {
  earned: Partial<Record<MilestoneId, string>>;
  seen: MilestoneId[];
  /** False until the first reconcile has run against a fully loaded log. */
  init: boolean;
}

const EMPTY: MilestoneState = { earned: {}, seen: [], init: false };

let cache: MilestoneState = EMPTY;
let loaded = false;
const listeners = new Set<(s: MilestoneState) => void>();

async function persist(next: MilestoneState) {
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadMilestones(): Promise<MilestoneState> {
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as MilestoneState) } : EMPTY;
  loaded = true;
  return cache;
}

export async function clearMilestones(): Promise<void> {
  await persist(EMPTY);
}

/**
 * The backfill rule.
 *
 * First run: everything already true is HISTORY, and history is not news. All
 * of it is marked seen except the single most significant one, which gets one
 * card - so upgrading with three weeks behind you produces one moment, not
 * five. After that, anything newly true is news and shows normally.
 */
export function reconcile(prev: MilestoneState, now: EarnedMilestone[]): MilestoneState {
  const earned = { ...prev.earned };
  for (const e of now) if (!earned[e.id]) earned[e.id] = e.earnedAt;

  if (!prev.init) {
    const headline = mostSignificant(now);
    return {
      init: true,
      earned,
      seen: now.filter((e) => e.id !== headline?.id).map((e) => e.id),
    };
  }

  return { ...prev, earned, init: true };
}

export function useMilestones(today: string) {
  const [state, setState] = useState<MilestoneState>(cache);
  const ready = useStoresReady();

  const { profile } = useProfile();
  const { log } = useLog();
  const { all: subs } = useSubstitutions(today);
  const { edits } = useAdminEdits();

  useEffect(() => {
    listeners.add(setState);
    if (!loaded) loadMilestones().then(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useEffect(() => {
    // Never reconcile against a half-loaded log - that is how a returning
    // member gets recorded as brand new.
    if (!ready || !loaded || !profile) return;

    const deps: DayDeps = { profile, log, subs, edits };
    const next = reconcile(cache, earnedMilestones(deps, today));
    if (JSON.stringify(next) !== JSON.stringify(cache)) void persist(next);
  }, [ready, profile, log, subs, edits, today]);

  const dismiss = useCallback(async (id: MilestoneId) => {
    if (cache.seen.includes(id)) return;
    await persist({ ...cache, seen: [...cache.seen, id] });
  }, []);

  // One card at a time, most significant first. Dismissing reveals the next.
  const unseen = (Object.keys(state.earned) as MilestoneId[])
    .filter((id) => !state.seen.includes(id))
    .map((id) => ({ id, earnedAt: state.earned[id] as string }));

  return { pending: mostSignificant(unseen) ?? null, dismiss, state };
}
