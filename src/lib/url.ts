/**
 * URL handling for values typed or pasted by a human.
 *
 * People paste markdown links, autolink syntax, bare domains and stray
 * whitespace into URL fields. `normalizeUrl` repairs the common shapes on the
 * way in; `safeExternalUrl` is the gate on the way out, so a value that is
 * still unusable renders as no link at all rather than sending a visitor to
 * `about:blank`.
 */

/** Repairs a human-entered URL. Returns "" for input with nothing usable. */
export function normalizeUrl(raw: string | null | undefined): string {
  let value = (raw ?? "").trim();
  if (!value) return "";

  // `[label](https://…)` — and the half-mangled `…](https://…` that results
  // from copying such a link without its outer brackets.
  const markdown = value.lastIndexOf("](");
  if (markdown !== -1) value = value.slice(markdown + 2);

  // `<https://…>` autolink form.
  value = value.replace(/^<+/, "").replace(/>+$/, "");

  // Punctuation dragged in from surrounding prose.
  value = value.replace(/[)\]>,.;]+$/, "").trim();
  if (!value) return "";

  // A bare domain is unambiguous enough to complete; anything already carrying
  // a scheme is left exactly as typed.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//")) {
    if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(value)) value = `https://${value}`;
  }

  return value;
}

/**
 * The URL to actually put in an `href`, or null if it is not a usable web
 * link. Only http and https pass — `javascript:` and friends must never reach
 * an anchor, and a broken address is worse than a missing button.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  const value = normalizeUrl(raw);
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** True when the value is non-empty but cannot become a valid link. */
export function isBrokenUrl(raw: string | null | undefined): boolean {
  return Boolean(raw?.trim()) && safeExternalUrl(raw) === null;
}

/**
 * Extracts the project slug from a link to this site's own portfolio page.
 *
 * Pasting the full address of a project — which is the obvious thing to do —
 * would otherwise be stored as an external link, losing client-side navigation
 * and breaking if the domain ever changes. Recognising it lets the admin turn it
 * back into an internal reference.
 */
export function internalProjectSlug(
  raw: string | null | undefined,
  siteOrigin: string,
): string | null {
  const value = safeExternalUrl(raw);
  if (!value) return null;
  try {
    const url = new URL(value);
    const site = new URL(siteOrigin);
    if (url.host !== site.host) return null;
    const match = /^\/projects\/([^/]+)\/?$/.exec(url.pathname);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}
