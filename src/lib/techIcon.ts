/**
 * Resolves a stack tag to a devicon SVG on jsDelivr. devicon covers the vast
 * majority of technologies people list on a résumé with clean lowercase slugs
 * (`react`, `typescript`, `postgresql`) and their `-original` variant keeps
 * brand colour, which reads better next to a coloured tag pill.
 *
 * Tags that the CDN does not know are handled at render time — <TechIcon>
 * hides itself on the img's error event — so this function is intentionally
 * permissive: it returns a URL for anything that produces a non-empty slug and
 * lets the browser tell us whether the icon actually exists.
 *
 * techicons.dev is the discoverability site the user browses; the icons
 * themselves are hosted elsewhere. We go direct to the CDN to avoid the extra
 * HTML round-trip.
 */

/**
 * Slugs whose obvious lowercase form does not match the devicon repository
 * name. Kept small on purpose — a longer list would be a mini-database that
 * silently drifts from what devicon actually ships.
 */
const SLUG_ALIASES: Record<string, string> = {
  node: "nodejs",
  vue: "vuejs",
  next: "nextjs",
  tailwind: "tailwindcss",
  postgres: "postgresql",
  golang: "go",
};

/** Normalises a tag to the devicon slug convention (lowercase, letters only). */
export function techIconSlug(tag: string): string | null {
  const cleaned = tag
    .toLowerCase()
    // "Java (Kotlin)" → the paren clause is an aside, not part of the tech name.
    .replace(/\(.*?\)/g, "")
    // devicon slugs are `[a-z0-9]+` — everything else (space, dot, hyphen,
    // plus, hash) is punctuation and safe to drop.
    .replace(/[^a-z0-9]/g, "")
    .trim();
  if (!cleaned) return null;
  return SLUG_ALIASES[cleaned] ?? cleaned;
}

export function techIconUrl(tag: string): string | null {
  const slug = techIconSlug(tag);
  if (!slug) return null;
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
}
