"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Layers,
  User,
  Users,
} from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { SmartImage } from "@/components/ui/SmartImage";
import { TagList } from "@/components/ui/TagList";
import { BlockRenderer } from "./BlockRenderer";
import { FloatingToc } from "./FloatingToc";
import { formatDateRange, tr } from "@/lib/i18n";
import { routes } from "@/lib/site";
import { safeExternalUrl } from "@/lib/url";
import type { ProjectWithBlocks } from "@/lib/types";

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-fg-subtle"
        aria-hidden="true"
      />
      <span className="shrink-0 text-xs font-semibold text-fg-muted">
        {label}
      </span>
      <span className="min-w-0 text-sm">{children}</span>
    </div>
  );
}

/**
 * Presentational detail page.
 *
 * Deliberately free of data fetching: the public route wraps it in
 * ProjectDetailView to revalidate against Supabase, while the admin editor
 * renders it directly against unsaved draft state. If this component fetched
 * anything itself, the live preview would keep overwriting what is being typed.
 */
export function ProjectDetail({
  project,
  /** Inside the admin preview: no back link, no fixed-position TOC button. */
  embedded = false,
}: {
  project: ProjectWithBlocks;
  embedded?: boolean;
}) {
  const { lang, t } = useLang();

  const title = tr(project.title_ko, project.title_en, lang);
  const summary = tr(project.summary_ko, project.summary_en, lang);
  const role = tr(project.role_ko, project.role_en, lang);
  const period = formatDateRange(
    project.period_start,
    project.period_end,
    project.is_ongoing,
    lang,
  );
  // A malformed address would render a button that navigates nowhere, which is
  // worse than no button at all.
  const repoUrl = safeExternalUrl(project.repo_url);
  const demoUrl = safeExternalUrl(project.demo_url);

  return (
    <article className={embedded ? "" : "container-page"}>
      {!embedded && (
        <Link
          href={routes.portfolio}
          className="btn btn-ghost btn-sm no-print -ml-2 mb-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("project.backToList")}
        </Link>
      )}

      {project.cover_url ? (
        <header className="relative overflow-hidden rounded-[var(--radius-card)] border border-border">
          <SmartImage
            src={project.cover_url}
            alt={title}
            priority={!embedded}
            className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
              {title}
            </h1>
            {summary && (
              <p className="mt-1.5 max-w-2xl text-sm text-white/85">{summary}</p>
            )}
          </div>
        </header>
      ) : (
        <header>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {summary && (
            <p className="mt-2 max-w-2xl text-sm text-fg-muted sm:text-base">
              {summary}
            </p>
          )}
        </header>
      )}

      {(period || role || project.team_size || project.tags.length > 0 ||
        repoUrl || demoUrl) && (
        <section className="card mt-5 flex flex-col gap-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {period && (
              <MetaRow icon={CalendarDays} label={t("project.period")}>
                <span className="tabular-nums">{period}</span>
              </MetaRow>
            )}
            {role && (
              <MetaRow icon={User} label={t("project.role")}>
                {role}
              </MetaRow>
            )}
            {project.team_size ? (
              <MetaRow icon={Users} label={t("project.team")}>
                {project.team_size}
                {t("project.teamUnit")}
              </MetaRow>
            ) : null}
          </div>

          {project.tags.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
              <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-fg-muted">
                <Layers className="size-4 text-fg-subtle" aria-hidden="true" />
                {t("project.stack")}
              </span>
              <TagList tags={project.tags} />
            </div>
          )}

          {(repoUrl || demoUrl) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <GithubIcon className="size-3.5" aria-hidden="true" />
                  {t("project.repo")}
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              )}
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  {t("project.demo")}
                </a>
              )}
            </div>
          )}
        </section>
      )}

      <div
        className={
          embedded
            ? "mt-8"
            : "mt-8 gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-start"
        }
      >
        <div className="min-w-0">
          <BlockRenderer blocks={project.blocks} />
        </div>
        {!embedded && <FloatingToc blocks={project.blocks} />}
      </div>
    </article>
  );
}
