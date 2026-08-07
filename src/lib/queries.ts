import { getSupabaseRead } from "./supabase";
import {
  seedBlocks,
  seedProfile,
  seedProjects,
  seedSkills,
  seedTimeline,
} from "./seed";
import type {
  Profile,
  Project,
  ProjectBlock,
  ProjectWithBlocks,
  ResumeData,
  Skill,
  TimelineEntry,
} from "./types";

/**
 * Read paths shared by build-time pre-rendering and client-side revalidation.
 *
 * Two rules hold everywhere in this file:
 *   1. A failure never throws. A portfolio that renders slightly stale content
 *      beats a portfolio that 500s, and `next build` must not break because the
 *      free-tier database was briefly asleep.
 *   2. Seed content only stands in on a *fresh install* — see `isFreshInstall`.
 */

/**
 * True when nobody has filled in the profile yet.
 *
 * Seed entries exist so a brand-new clone shows a real layout instead of four
 * empty sections. But once a real name is in the database, inventing a career
 * history underneath it is far worse than an empty section — so every other
 * table stops falling back the moment the profile is real.
 *
 * `getProfile` returns the `seedProfile` object itself when it falls back, so
 * identity is the check.
 */
export function isFreshInstall(profile: Profile): boolean {
  return profile === seedProfile;
}

const PROJECT_COLUMNS =
  "id,slug,title_ko,title_en,summary_ko,summary_en,thumbnail_url,cover_url,tags," +
  "category_ko,category_en,repo_url,demo_url,period_start,period_end,is_ongoing," +
  "role_ko,role_en,team_size,sort_order,is_published,is_featured";

/** Supabase rejects with plain objects, so `String(error)` gives "[object Object]". */
function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const e = error as { message?: string; code?: string; hint?: string };
    const parts = [e.code && `[${e.code}]`, e.message, e.hint].filter(Boolean);
    if (parts.length) return parts.join(" ");
    try {
      return JSON.stringify(error);
    } catch {
      /* fall through */
    }
  }
  return String(error);
}

function warn(scope: string, error: unknown): void {
  console.warn(
    `[queries] ${scope} failed, using fallback content: ${describe(error)}`,
  );
}

export async function getProfile(): Promise<Profile> {
  const supabase = getSupabaseRead();
  if (!supabase) return seedProfile;
  try {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return seedProfile;
    // A row exists but is still blank right after running schema.sql.
    if (!data.name_ko?.trim() && !data.name_en?.trim()) return seedProfile;
    return data as Profile;
  } catch (error) {
    warn("getProfile", error);
    return seedProfile;
  }
}

export async function getTimelineEntries(allowSeed = true): Promise<TimelineEntry[]> {
  const supabase = getSupabaseRead();
  if (!supabase) return allowSeed ? seedTimeline : [];
  try {
    const { data, error } = await supabase
      .from("timeline_entries")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("start_date", { ascending: false, nullsFirst: false });
    if (error) throw error;
    if (data?.length) return data as TimelineEntry[];
    return allowSeed ? seedTimeline : [];
  } catch (error) {
    warn("getTimelineEntries", error);
    return allowSeed ? seedTimeline : [];
  }
}

export async function getSkills(allowSeed = true): Promise<Skill[]> {
  const supabase = getSupabaseRead();
  if (!supabase) return allowSeed ? seedSkills : [];
  try {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    if (data?.length) return data as Skill[];
    return allowSeed ? seedSkills : [];
  } catch (error) {
    warn("getSkills", error);
    return allowSeed ? seedSkills : [];
  }
}

export async function getResumeData(): Promise<ResumeData> {
  // The profile decides whether the other tables may fall back, so it is read
  // first rather than in parallel.
  const profile = await getProfile();
  const allowSeed = isFreshInstall(profile);
  const [entries, skills] = await Promise.all([
    getTimelineEntries(allowSeed),
    getSkills(allowSeed),
  ]);
  return { profile, entries, skills };
}

export async function getPublishedProjects(allowSeed?: boolean): Promise<Project[]> {
  allowSeed ??= isFreshInstall(await getProfile());
  const supabase = getSupabaseRead();
  if (!supabase) return allowSeed ? seedProjects : [];
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("period_start", { ascending: false, nullsFirst: false });
    if (error) throw error;
    if (data?.length) return data as unknown as Project[];
    return allowSeed ? seedProjects : [];
  } catch (error) {
    warn("getPublishedProjects", error);
    return allowSeed ? seedProjects : [];
  }
}

export async function getProjectBlocks(projectId: string): Promise<ProjectBlock[]> {
  const supabase = getSupabaseRead();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("project_blocks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProjectBlock[];
  } catch (error) {
    warn("getProjectBlocks", error);
    return [];
  }
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectWithBlocks | null> {
  const supabase = getSupabaseRead();

  /** Seeded examples must not resurrect once the site has real content. */
  async function seededOrNull(): Promise<ProjectWithBlocks | null> {
    if (!isFreshInstall(await getProfile())) return null;
    const seeded = seedProjects.find((p) => p.slug === slug);
    return seeded ? { ...seeded, blocks: seedBlocks[slug] ?? [] } : null;
  }

  if (!supabase) return seededOrNull();

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;

    // Nothing in the database — the slug may still be a seeded example.
    if (!data) return seededOrNull();

    const project = data as unknown as Project;
    const blocks = await getProjectBlocks(project.id);
    return { ...project, blocks };
  } catch (error) {
    warn(`getProjectBySlug(${slug})`, error);
    return seededOrNull();
  }
}

/** Slugs to pre-render. Seed slugs are included only on a fresh install. */
export async function getAllProjectSlugs(): Promise<string[]> {
  const allowSeed = isFreshInstall(await getProfile());
  const projects = await getPublishedProjects(allowSeed);
  const slugs = new Set(projects.map((p) => p.slug));
  if (allowSeed) for (const p of seedProjects) slugs.add(p.slug);
  return [...slugs];
}
