import { SITE_URL, absoluteUrl } from "@/lib/site";
import type { Project, ProjectWithBlocks, ResumeData } from "@/lib/types";

/**
 * Structured data. Rendered server-side only, from values we control, and
 * serialised with `<` escaped so a string in the database can never close the
 * script tag and inject markup.
 */
function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const empty =
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    if (empty) delete obj[key];
  }
  return obj;
}

export function PersonJsonLd({ data }: { data: ResumeData }) {
  const { profile, entries, skills } = data;

  const sameAs = [
    profile.github_url,
    profile.linkedin_url,
    profile.blog_url,
    profile.website_url,
  ].filter(Boolean) as string[];

  const alumniOf = entries
    .filter((e) => e.category === "education")
    .map((e) =>
      clean({
        "@type": "EducationalOrganization",
        name: e.title_en || e.title_ko,
      }),
    );

  const worksFor = entries
    .filter((e) => e.category === "career" && e.is_current)
    .map((e) => clean({ "@type": "Organization", name: e.title_en || e.title_ko }));

  const awards = entries
    .filter((e) => e.category === "award")
    .map((e) => e.title_en || e.title_ko)
    .filter(Boolean);

  return (
    <JsonLdScript
      data={clean({
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name_en || profile.name_ko,
        alternateName: profile.name_ko || undefined,
        description: profile.tagline_en || profile.tagline_ko,
        jobTitle: profile.tagline_en || profile.tagline_ko,
        url: SITE_URL,
        image: profile.photo_url ?? undefined,
        email: profile.email ? `mailto:${profile.email}` : undefined,
        address: profile.location_en || profile.location_ko || undefined,
        sameAs,
        alumniOf,
        worksFor,
        award: awards,
        knowsAbout: skills.map((s) => s.name),
      })}
    />
  );
}

export function ProjectListJsonLd({ projects }: { projects: Project[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Portfolio",
        url: absoluteUrl("/portfolio"),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: projects.length,
          itemListElement: projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(`/projects/${project.slug}`),
            name: project.title_en || project.title_ko,
          })),
        },
      }}
    />
  );
}

export function ProjectJsonLd({
  project,
  authorName,
}: {
  project: ProjectWithBlocks;
  authorName: string;
}) {
  return (
    <JsonLdScript
      data={clean({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title_en || project.title_ko,
        alternateName: project.title_ko || undefined,
        description: project.summary_en || project.summary_ko,
        url: absoluteUrl(`/projects/${project.slug}`),
        image: project.cover_url ?? project.thumbnail_url ?? undefined,
        author: { "@type": "Person", name: authorName },
        keywords: project.tags.join(", "),
        dateCreated: project.period_start ?? undefined,
        codeRepository: project.repo_url ?? undefined,
      })}
    />
  );
}
