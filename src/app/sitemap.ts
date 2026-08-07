import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/queries.server";
import { absoluteUrl } from "@/lib/site";

/** Route handlers must opt in explicitly under `output: "export"`. */
export const dynamic = "force-static";

/** Emitted as a static sitemap.xml at build time. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/portfolio"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
