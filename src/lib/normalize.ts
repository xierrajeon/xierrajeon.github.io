import type { LinkedProject, Major, TimelineEntry } from "./types";

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
  };
}

export function normalizeTimelineEntries(rows: TimelineEntry[]): TimelineEntry[] {
  return rows.map(normalizeTimelineEntry);
}
