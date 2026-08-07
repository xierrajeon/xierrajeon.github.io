import type { Major, TimelineEntry } from "./types";

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

export function normalizeTimelineEntry(row: TimelineEntry): TimelineEntry {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    majors: toMajors(row.majors),
    gpa: toNumber(row.gpa),
    gpa_scale: toNumber(row.gpa_scale),
    enrollment_status: row.enrollment_status ?? null,
  };
}

export function normalizeTimelineEntries(rows: TimelineEntry[]): TimelineEntry[] {
  return rows.map(normalizeTimelineEntry);
}
