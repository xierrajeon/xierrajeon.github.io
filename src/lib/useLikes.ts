"use client";

import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured } from "./env";

const STORAGE_KEY = "xj-portfolio-liked";

/**
 * Reads the site-wide heart count and lets the visitor add one — once per
 * browser. The count row is public but writes are gated by the
 * `increment_like()` RPC, so a raw anon client cannot poke arbitrary values.
 *
 * `hasLiked` reads localStorage on mount (SSR-safe). Determined users can
 * clear it and click again; that is fine, this counter is a vanity signal,
 * not a vote.
 */
export function useLikes(initial: number = 0) {
  const [count, setCount] = useState(initial);
  // Read the localStorage flag inside the initialiser so we never run a second
  // render just to sync it — SSR gets `false` and hydration matches naturally
  // because Supabase-configured production is where this actually runs.
  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    import("./supabase")
      .then(({ getSupabaseRead }) => {
        const client = getSupabaseRead();
        if (!client) return;
        return client
          .from("site_likes")
          .select("count")
          .eq("id", 1)
          .maybeSingle();
      })
      .then((res) => {
        if (cancelled || !res || res.error) return;
        const next = Number(res.data?.count);
        if (Number.isFinite(next)) setCount(next);
      })
      .catch(() => {
        /* keep the pre-rendered value */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const like = useCallback(async () => {
    if (hasLiked || pending || !isSupabaseConfigured) return;
    setPending(true);
    setHasLiked(true);
    setCount((c) => c + 1);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    try {
      const { getSupabaseRead } = await import("./supabase");
      const client = getSupabaseRead();
      if (!client) throw new Error("no client");
      const { data, error } = await client.rpc("increment_like");
      if (error) throw error;
      const next = Number(data);
      if (Number.isFinite(next)) setCount(next);
    } catch (err) {
      // Server unreachable or the RPC is missing (schema not applied yet).
      // Keep the visitor's local "liked" memory so a page reload still shows
      // the filled heart — the counter is a vanity signal, not an audit log.
      // The count will re-sync from the server on the next successful fetch.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useLikes] increment_like failed:", err);
      }
    } finally {
      setPending(false);
    }
  }, [hasLiked, pending]);

  return { count, hasLiked, pending, like };
}
