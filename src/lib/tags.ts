import type { Project } from "./types";

/**
 * Unique stack tags across projects, most-used first.
 *
 * Lives outside queries.ts so the gallery's filter bar does not have to pull the
 * Supabase client into the initial bundle just to compute a list.
 */
export function collectTags(projects: Project[]): string[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tag of project.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}
