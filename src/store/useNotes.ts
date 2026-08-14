import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/types/admin';

const KEY = 'uf.notes.v1';

/**
 * A flat, date-stamped list of notes - not one editable blob per role.
 *
 * Each note carries the role that wrote it and every surface filters on that.
 * This is FILTERING, not permissions: nothing here is a security boundary, and
 * the store makes no attempt to be one. Cross-role sharing is a later phase and
 * will need a real model; until then, one field and a filter is the honest
 * amount of machinery.
 */
export interface Note {
  id: string;
  /** ISO timestamp. Sorts chronologically as a plain string. */
  createdAt: string;
  updatedAt?: string;
  /** Who wrote it. The only thing separating one role's notes from another's. */
  role: Role;
  title?: string;
  body: string;
}

let cache: Note[] = [];
let loaded = false;
const listeners = new Set<(n: Note[]) => void>();

function broadcast(next: Note[]) {
  cache = next;
  listeners.forEach((l) => l(next));
}

async function persist(next: Note[]) {
  broadcast(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(KEY);
  let parsed: Note[] = [];
  try {
    const j = raw ? JSON.parse(raw) : [];
    if (Array.isArray(j)) parsed = j;
  } catch {
    // A corrupt blob should cost you your notes, not the whole app.
    parsed = [];
  }
  loaded = true;
  // broadcast, NOT a silent `cache = parsed`. The first component mounted after
  // a relaunch takes its useState snapshot while the cache is still empty, so
  // filling the cache without notifying leaves that component showing an empty
  // list forever - which is exactly how useProfile lost a saved profile on
  // every cold start. A note that doesn't survive relaunch is a broken note.
  broadcast(parsed);
  return cache;
}

export async function clearNotes(): Promise<void> {
  await persist([]);
}

let seq = 0;
function newId(): string {
  seq += 1;
  return `${Date.now().toString(36)}-${seq}`;
}

export function useNotes(role: Role) {
  const [all, setAll] = useState<Note[]>(cache);

  useEffect(() => {
    listeners.add(setAll);
    if (!loaded) void loadNotes();
    return () => {
      listeners.delete(setAll);
    };
  }, []);

  const create = useCallback(
    async (title: string, body: string) => {
      const note: Note = {
        id: newId(),
        createdAt: new Date().toISOString(),
        role,
        title: title.trim() || undefined,
        body: body.trim(),
      };
      await persist([note, ...cache]);
    },
    [role]
  );

  const update = useCallback(async (id: string, patch: Partial<Pick<Note, 'title' | 'body'>>) => {
    await persist(
      cache.map((n) =>
        n.id === id
          ? {
              ...n,
              ...patch,
              title: patch.title !== undefined ? patch.title.trim() || undefined : n.title,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await persist(cache.filter((n) => n.id !== id));
  }, []);

  // Newest first. ISO timestamps sort lexicographically.
  const notes = all
    .filter((n) => n.role === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { notes, create, update, remove };
}
