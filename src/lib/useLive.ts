"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "./env";

/**
 * Re-reads a value from Supabase after mount and swaps it in.
 *
 * Pages are pre-rendered at build time, which is what search engines index. A
 * visitor, though, should see whatever the admin page saved thirty seconds ago
 * — so every public page hydrates with the baked data and then quietly
 * revalidates. Failures are ignored on purpose: stale content beats an error.
 *
 * Callers pass a loader that `import()`s the query module, which keeps the
 * Supabase client (~60KB) out of the initial page chunk.
 */
export function useLive<T>(
  initial: T,
  load: () => Promise<T>,
  /** Re-run when this changes (e.g. a slug). */
  key: string = "",
): T {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    load()
      .then((next) => {
        if (!cancelled && next) setData(next);
      })
      .catch(() => {
        /* keep the pre-rendered value */
      });

    return () => {
      cancelled = true;
    };
    // `load` is a fresh closure each render; `key` is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
