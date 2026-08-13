import { useEffect, useState } from 'react';
import { loadProfile } from './useProfile';
import { loadLog } from './useLog';
import { loadSubstitutions } from './useSubstitutions';
import { loadAdminEdits } from './useAdminEdits';

/**
 * True once every store backing dayStatus has been read from disk.
 *
 * This exists for the milestone backfill, and it is load-bearing. Milestones
 * decide "already earned, stay quiet" versus "just earned, celebrate" by
 * comparing against what is on disk. Evaluate that a tick early - while the log
 * is still an empty object - and a member with three weeks of history gets
 * recorded as having earned nothing, then gets every card at once the moment
 * the log resolves. The gate is the difference between a quiet upgrade and five
 * celebration cards in a row.
 *
 * The loaders are idempotent: they re-read the same keys and repopulate the
 * same caches.
 */
export function useStoresReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([loadProfile(), loadLog(), loadSubstitutions(), loadAdminEdits()])
      .catch(() => undefined)
      .then(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}
