import mirrored from "./mirrored-media.json";

/**
 * Rewrites a Supabase Storage URL to the copy `scripts/mirror-media.mjs` placed
 * in `public/` at build time.
 *
 * Applied on both sides on purpose. The server render bakes the local path into
 * the static HTML, and the post-mount revalidation in `useLive` runs the fresh
 * row through the same map — without that, hydration would swap the `src` back
 * to the Supabase URL and the browser would fetch the same picture twice, over
 * a cross-origin connection, right in the middle of the largest paint.
 *
 * A URL that is not in the map (an image uploaded since the last deploy) is
 * returned untouched, so new content still shows up immediately.
 */
const MAP: Record<string, string> = mirrored;

export function localMedia<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  return (MAP[url] ?? url) as T;
}
