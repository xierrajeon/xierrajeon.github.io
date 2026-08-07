/**
 * Supabase configuration, deliberately kept in its own module.
 *
 * `supabase.ts` imports `@supabase/supabase-js`, which is ~60KB. Anything that
 * only needs to know *whether* Supabase is configured imports this file
 * instead, so the client library stays in a lazily-loaded chunk rather than in
 * the critical path of every page.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const MEDIA_BUCKET = "media";
