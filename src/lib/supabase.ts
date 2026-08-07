import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  MEDIA_BUCKET,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./env";

export { MEDIA_BUCKET, SUPABASE_URL, isSupabaseConfigured };

function create(persistSession: boolean): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: persistSession,
      storageKey: "xj-portfolio-auth",
    },
  });
}

let browserClient: SupabaseClient | null = null;

/**
 * Browser singleton. Holds the admin session, so it must be created once per
 * tab — a second instance would race the first on token refresh.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  browserClient ??= create(true);
  return browserClient;
}

let readClient: SupabaseClient | null = null;

/** Anonymous read-only client used while pre-rendering at build time. */
export function getSupabaseRead(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  readClient ??= create(false);
  return readClient;
}

/** Public URL for an object already uploaded to the media bucket. */
export function mediaPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
