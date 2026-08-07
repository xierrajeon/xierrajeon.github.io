"use client";

import { useCallback, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Wraps a write so every admin screen reports progress the same way.
 * Overlapping calls are dropped rather than queued — a double-clicked save
 * button should not fire two conflicting updates.
 */
export function useSaver() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      if (inFlight.current) return false;
      inFlight.current = true;
      setStatus("saving");
      setError(null);
      try {
        await action();
        setStatus("saved");
        return true;
      } catch (cause) {
        setStatus("error");
        setError(describeError(cause));
        return false;
      } finally {
        inFlight.current = false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, run, reset, saving: status === "saving" };
}

export function describeError(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object") {
    const e = cause as { message?: string; details?: string; hint?: string };
    return e.message || e.details || e.hint || JSON.stringify(cause);
  }
  return String(cause);
}
