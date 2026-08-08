import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Copies the profile's images out of Supabase Storage and into `public/` so the
 * build serves them from our own origin.
 *
 * The profile photo is the largest contentful paint on the resume tab. Served
 * from Supabase it sits on a second origin, so the browser has to spend a DNS
 * lookup, a TCP handshake and a TLS negotiation before the first byte — all of
 * it on the critical path, and all of it varying with how that host feels today.
 * Mirroring the file makes it just another asset on the page's own connection.
 *
 * The output is a manifest mapping remote URL to local path. Both the build and
 * the client-side revalidation run URLs through it (see src/lib/media.ts), so a
 * photo swapped in the admin after the last deploy simply misses the map and
 * keeps loading from Supabase until the next build mirrors it too.
 *
 * Never fails the build: an unreachable Supabase or a 404 image leaves the
 * manifest empty and every URL pointing back at the original.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const mediaDir = join(root, "public", "media");
const manifestPath = join(root, "src", "lib", "mirrored-media.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Fields on the profile row worth mirroring. */
const FIELDS = ["photo_url", "og_image_url"];

/** A profile image that is bigger than this is not what we think it is. */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const EXTENSIONS = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function write(manifest) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Keeps the storage key's own unique stem, so a new upload never collides. */
function localName(url, contentType) {
  const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  const stem =
    base.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60) ||
    "image";
  return `${stem}.${EXTENSIONS[contentType] ?? "bin"}`;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("[mirror-media] Supabase not configured — skipping.");
    write({});
    return;
  }

  const endpoint =
    `${SUPABASE_URL}/rest/v1/profile` +
    `?select=${FIELDS.join(",")}&id=eq.1`;

  let row;
  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/vnd.pgrst.object+json",
      },
    });
    if (!response.ok) throw new Error(`profile query ${response.status}`);
    row = await response.json();
  } catch (error) {
    console.warn(`[mirror-media] could not read profile: ${error.message}`);
    write({});
    return;
  }

  // Start from a clean directory so an image removed in the admin does not
  // linger in the deployment forever.
  rmSync(mediaDir, { recursive: true, force: true });
  mkdirSync(mediaDir, { recursive: true });

  const manifest = {};

  for (const field of FIELDS) {
    const remote = typeof row?.[field] === "string" ? row[field].trim() : "";
    if (!remote) continue;

    let parsed;
    try {
      parsed = new URL(remote);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;

    try {
      const response = await fetch(remote);
      if (!response.ok) throw new Error(`status ${response.status}`);

      const contentType = (response.headers.get("content-type") ?? "")
        .split(";")[0]
        .trim();
      if (!ALLOWED_TYPES.has(contentType)) {
        throw new Error(`unexpected content-type "${contentType}"`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength === 0) throw new Error("empty body");
      if (buffer.byteLength > MAX_BYTES) {
        throw new Error(`${buffer.byteLength} bytes exceeds the cap`);
      }

      const name = localName(remote, contentType);
      writeFileSync(join(mediaDir, name), buffer);
      manifest[remote] = `/media/${name}`;
      console.log(
        `[mirror-media] ${field} -> /media/${name} (${buffer.byteLength} bytes)`,
      );
    } catch (error) {
      console.warn(`[mirror-media] skipped ${field}: ${error.message}`);
    }
  }

  write(manifest);
}

await main();
