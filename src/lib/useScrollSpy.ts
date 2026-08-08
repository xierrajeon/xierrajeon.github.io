"use client";

import { useEffect, useState } from "react";

/** Elements opt in by carrying this attribute; its value is the returned id. */
const SPY_ATTRIBUTE = "data-spy-id";

/**
 * Reading line, as a fraction of the viewport height. A third of the way down
 * is roughly where the eye sits while scrolling — putting it at the very top
 * would light the next entry long before you actually reach it.
 */
const READING_LINE = 0.35;

/**
 * Reports which `[data-spy-id]` element the reader is currently on, as a
 * single answer for the whole page.
 *
 * The scan is document-wide on purpose: the timeline is split across several
 * sections (education, career, activity), and running one spy per section
 * would light a dot in every section that happens to be on screen instead of
 * marking the one place the reader actually is.
 *
 * Returns null when no candidate is on screen, so a rail scrolled past goes
 * dark rather than leaving a stale dot lit.
 *
 * `revision` should change whenever the set of elements does (entries arrive
 * from Supabase after hydration), so the first measure does not run against a
 * stale DOM.
 */
export function useScrollSpy(revision: unknown = null): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const line = viewport * READING_LINE;

      let best: string | null = null;
      let bestDistance = Infinity;

      document.querySelectorAll(`[${SPY_ATTRIBUTE}]`).forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Entirely off screen — not a candidate at all.
        if (rect.bottom < 0 || rect.top > viewport) return;

        // Zero while the reading line is inside the entry, growing as it
        // moves away, so the entry under the line always wins and the gaps
        // between cards fall back to whichever neighbour is closer.
        const distance =
          rect.top > line
            ? rect.top - line
            : rect.bottom < line
              ? line - rect.bottom
              : 0;

        if (distance < bestDistance) {
          bestDistance = distance;
          best = el.getAttribute(SPY_ATTRIBUTE);
        }
      });

      setActiveId(best);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [revision]);

  return activeId;
}
