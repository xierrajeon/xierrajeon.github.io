"use client";

import { useState } from "react";
import { techIconUrl } from "@/lib/techIcon";

/**
 * Small logo rendered inside a stack tag. Devicon covers most technologies but
 * not all, so we let the browser probe: if the SVG 404s the img hides itself
 * and the tag falls back to a plain coloured pill. That means adding a new
 * tag never requires a code change — the icon appears when devicon has it and
 * quietly disappears when it does not.
 */
export function TechIcon({ tag }: { tag: string }) {
  const [failed, setFailed] = useState(false);
  const url = techIconUrl(tag);
  if (!url || failed) return null;
  return (
    // `next/image` cannot help here: the site is a static export (no image
    // optimiser) and these icons are 14×14 SVGs pulled from an external CDN.
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt=""
      aria-hidden="true"
      width={14}
      height={14}
      loading="lazy"
      className="size-3.5 shrink-0"
      onError={() => setFailed(true)}
    />
  );
}
