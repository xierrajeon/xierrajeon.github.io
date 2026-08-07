"use client";

import { ProjectDetail } from "./ProjectDetail";
import { useLive } from "@/lib/useLive";
import type { ProjectWithBlocks } from "@/lib/types";

/**
 * Public wrapper: renders the pre-built HTML, then swaps in whatever the admin
 * page saved since the last deploy.
 */
export function ProjectDetailView({ initial }: { initial: ProjectWithBlocks }) {
  const project = useLive(
    initial,
    async () => {
      const { getProjectBySlug } = await import("@/lib/queries");
      return (await getProjectBySlug(initial.slug)) ?? initial;
    },
    initial.slug,
  );

  return <ProjectDetail project={project} />;
}
