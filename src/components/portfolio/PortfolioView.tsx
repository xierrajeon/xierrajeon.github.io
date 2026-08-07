"use client";

import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { ProfileCard } from "@/components/resume/ProfileCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { collectTags } from "@/lib/tags";
import { useLive } from "@/lib/useLive";
import { tagStyle } from "@/lib/tagColor";
import type { Profile, Project } from "@/lib/types";

const ALL = "__all__";

function TagFilter({
  tags,
  active,
  onChange,
}: {
  tags: string[];
  active: string;
  onChange: (tag: string) => void;
}) {
  const { t } = useLang();
  if (tags.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={t("portfolio.filterByStack")}
      className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
    >
      <button
        type="button"
        onClick={() => onChange(ALL)}
        aria-pressed={active === ALL}
        className="tag tag-button shrink-0 snap-start px-2.5 py-1 text-xs"
      >
        {t("portfolio.all")}
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onChange(tag)}
          aria-pressed={active === tag}
          style={active === tag ? undefined : tagStyle(tag)}
          className={`tag tag-button shrink-0 snap-start px-2.5 py-1 text-xs ${
            active === tag ? "" : "tag-tech"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export function PortfolioView({
  profile,
  initialProjects,
}: {
  profile: Profile;
  initialProjects: Project[];
}) {
  const { t } = useLang();
  const projects = useLive(
    initialProjects,
    () => import("@/lib/queries").then((m) => m.getPublishedProjects()),
    "projects",
  );
  const [active, setActive] = useState<string>(ALL);

  const tags = useMemo(() => collectTags(projects), [projects]);

  const visible = useMemo(
    () =>
      active === ALL
        ? projects
        : projects.filter((project) => project.tags.includes(active)),
    [projects, active],
  );

  return (
    <div className="container-page">
      <div className="stack-section">
        <ProfileCard profile={profile} />

        <section aria-labelledby="section-portfolio">
          <SectionHeading
            id="section-portfolio"
            icon={LayoutGrid}
            ko="프로젝트 갤러리"
            en="Project Gallery"
            action={
              <TagFilter
                tags={tags}
                active={active}
                onChange={(tag) => setActive(active === tag ? ALL : tag)}
              />
            }
          />

          {visible.length === 0 ? (
            <p className="card p-8 text-center text-sm text-fg-subtle">
              {t("portfolio.empty")}
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  priority={index < 3}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
