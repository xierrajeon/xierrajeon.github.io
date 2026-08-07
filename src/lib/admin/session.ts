"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export type AuthState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "anonymous" }
  /** Signed in, but the email is not in the `admins` allowlist. */
  | { status: "forbidden"; email: string }
  | { status: "admin"; session: Session; email: string };

/**
 * Confirms the signed-in user may write.
 *
 * RLS lets only admins select from `admins`, so an empty result is the answer —
 * this asks the database rather than trusting anything in the JWT, which means
 * the check and the write policy can never disagree.
 */
async function confirmAdmin(): Promise<boolean> {
  const { data, error } = await getSupabaseBrowser()
    .from("admins")
    .select("email")
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured ? { status: "loading" } : { status: "unconfigured" },
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabaseBrowser();
    let cancelled = false;

    async function resolve(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }
      const email = session.user.email ?? "";
      const ok = await confirmAdmin();
      if (cancelled) return;
      setState(
        ok ? { status: "admin", session, email } : { status: "forbidden", email },
      );
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void resolve(session);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (isSupabaseConfigured) await getSupabaseBrowser().auth.signOut();
    setState({ status: "anonymous" });
  }

  return { ...state, signOut };
}
