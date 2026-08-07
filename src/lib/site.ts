/** Absolute origin, used for canonical URLs, sitemap entries and OG tags. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://xierrajeon.github.io"
).replace(/\/$/, "");

/** `owner/repo`, used by the admin redeploy button. */
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "xierrajeon/xierrajeon.github.io";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const routes = {
  resume: "/",
  portfolio: "/portfolio",
  project: (slug: string) => `/projects/${slug}`,
  admin: "/admin",
} as const;
