import { RESUME_SECTIONS } from "./types";
import type { LinkedProject, Major, ResumeSection, TimelineEntry } from "./types";

/**
 * Coerces a row into the shape the components expect.
 *
 * Two things need it. Postgres `numeric` can arrive over PostgREST as a string
 * ("3.80"), which would break numeric comparisons like the GPA-over-scale
 * check. And rows written before the education columns existed come back with
 * those keys missing entirely, so every consumer would need its own `?? []`.
 */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toMajors(value: unknown): Major[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const major = item as Partial<Major>;
    return [
      {
        name_ko: typeof major.name_ko === "string" ? major.name_ko : "",
        name_en: typeof major.name_en === "string" ? major.name_en : "",
        kind: major.kind ?? "primary",
      },
    ];
  });
}

function toLinkedProjects(value: unknown): LinkedProject[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Partial<LinkedProject>;
    return [
      {
        name_ko: typeof entry.name_ko === "string" ? entry.name_ko : "",
        name_en: typeof entry.name_en === "string" ? entry.name_en : "",
        note_ko: typeof entry.note_ko === "string" ? entry.note_ko : "",
        note_en: typeof entry.note_en === "string" ? entry.note_en : "",
        start_date: entry.start_date?.trim() ? entry.start_date : null,
        end_date: entry.end_date?.trim() ? entry.end_date : null,
        is_ongoing: entry.is_ongoing === true,
        slug: entry.slug?.trim() ? entry.slug.trim() : null,
        url: entry.url?.trim() ? entry.url.trim() : null,
      },
    ];
  });
}

export function normalizeTimelineEntry(row: TimelineEntry): TimelineEntry {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    majors: toMajors(row.majors),
    linked_projects: toLinkedProjects(row.linked_projects),
    gpa: toNumber(row.gpa),
    gpa_scale: toNumber(row.gpa_scale),
    enrollment_status: row.enrollment_status ?? null,
    credential_id: row.credential_id?.trim() ? row.credential_id : null,
    score: row.score?.trim() ? row.score : null,
    image_url: row.image_url?.trim() ? row.image_url : null,
  };
}

export function normalizeTimelineEntries(rows: TimelineEntry[]): TimelineEntry[] {
  return rows.map(normalizeTimelineEntry);
}

/**
 * Guarantees the profile's `section_order` covers every known section exactly
 * once. Unknown keys are dropped and missing ones append in their default order,
 * so an install that predates a new section still renders it at the bottom
 * rather than hiding it silently.
 */
export function normalizeSectionOrder(value: unknown): ResumeSection[] {
  const known = new Set<ResumeSection>(RESUME_SECTIONS);
  const seen = new Set<ResumeSection>();
  const out: ResumeSection[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== "string") continue;
      const section = item as ResumeSection;
      if (!known.has(section) || seen.has(section)) continue;
      seen.add(section);
      out.push(section);
    }
  }
  for (const section of RESUME_SECTIONS) {
    if (!seen.has(section)) out.push(section);
  }
  return out;
}
