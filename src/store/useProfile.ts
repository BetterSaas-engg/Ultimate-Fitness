import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GoalType, Tier } from '@/types/program';
import { todayKey } from '@/lib/date';

const KEY = 'uf.profile.v1';

/** Round number the gym can argue with. Set during onboarding, editable after. */
export const DEFAULT_PROTEIN_TARGET_G = 100;

export interface Profile {
  name?: string;
  goalType: GoalType;
  /** 1..5 silhouette scale. Profile context only - it does not gate content. */
  physiqueCurrent?: number;
  physiqueTarget?: number;
  tier: Tier;
  /** Grams per day. Drives the Today protein bar. */
  proteinTargetG?: number;
  /** YYYY-MM-DD. Program day 1. */
  startDate: string;
  onboardedAt?: string;
  /** Demo only: overrides "today" so week 2 can be shown on demand. */
  demoDayOffset?: number;
}

export const DEFAULT_PROFILE: Profile = {
  goalType: 'stay-healthy',
  tier: 'free',
  proteinTargetG: DEFAULT_PROTEIN_TARGET_G,
  startDate: todayKey(),
};

let cache: Profile | null = null;
const listeners = new Set<(p: Profile | null) => void>();

function broadcast(p: Profile | null) {
  cache = p;
  listeners.forEach((l) => l(p));
}

export async function loadProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(KEY);
  const parsed = raw ? (JSON.parse(raw) as Profile) : null;
  cache = parsed;
  return parsed;
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  broadcast(p);
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  broadcast(null);
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let alive = true;
    listeners.add(setProfile);
    loadProfile().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
      listeners.delete(setProfile);
    };
  }, []);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      const next = { ...(cache ?? DEFAULT_PROFILE), ...patch } as Profile;
      await saveProfile(next);
    },
    []
  );

  return { profile, loading, update, reset: clearProfile };
}
