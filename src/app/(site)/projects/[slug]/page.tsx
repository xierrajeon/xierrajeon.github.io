import type { Metadata } from "next";
import { ProjectDetailView } from "@/components/project/ProjectDetailView";
import { ProjectFallback } from "@/components/project/ProjectFallback";
import { ProjectJsonLd } from "@/components/seo/JsonLd";
import {
  getAllProjectSlugs,
  getProfile,
  getProjectBySlug,
} from "@/lib/queries.server";

/**
 * `output: export` rejects an empty param list, but a portfolio legitimately
 * starts with zero projects. This inert slug keeps the route buildable; it is
 * never linked and never enters the sitemap.
 */
const PLACEHOLDER_SLUG = "unpublished";

/**
 * Pre-renders one HTML file per published project. A project added after the
 * last build has no file yet, so GitHub Pages serves 404.html — which
 * client-renders that project from Supabase (see src/app/not-found.tsx) until
 * the next deploy fills the gap.
 */
export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return (slugs.length ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  const title = project.title_ko || project.title_en;
  const description = project.summary_ko || project.summary_en || undefined;
  const image = project.cover_url ?? project.thumbnail_url ?? undefined;

  return {
    title,
    description,
    keywords: project.tags,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${project.slug}`,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, profile] = await Promise.all([
    getProjectBySlug(slug),
    getProfile(),
  ]);

  // Renders the same client-side lookup as 404.html, so if this slug gains a
  // project between builds the page resolves it instead of dead-ending.
  if (!project)
    return <ProjectFallback siteName={profile.name_ko || profile.name_en} />;

  return (
    <>
      <ProjectJsonLd
        project={project}
        authorName={profile.name_en || profile.name_ko}
      />
      <ProjectDetailView initial={project} />
    </>
  );
}
