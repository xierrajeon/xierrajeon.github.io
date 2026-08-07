import { rmSync } from "node:fs";

/**
 * Drops Next's persistent fetch cache before every build.
 *
 * Pages are pre-rendered from Supabase, and Next caches those GET responses in
 * `.next/cache/fetch-cache` keyed by URL — across builds, not just within one.
 * The URLs never change, so a second build happily reuses the first build's
 * answers and content added in the admin page silently never reaches the static
 * HTML, no matter how many times you redeploy.
 *
 * `cache: "no-store"` is not an option here: it marks the fetch dynamic, which
 * `output: "export"` rejects outright. Clearing the cache keeps every request
 * statically cacheable *within* a build while guaranteeing each build starts
 * from the database.
 *
 * CI runners start without the directory, so this only changes local builds —
 * which is exactly where the stale results showed up.
 */
rmSync(new URL("../.next/cache/fetch-cache", import.meta.url), {
  recursive: true,
  force: true,
});
