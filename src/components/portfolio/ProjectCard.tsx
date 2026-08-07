"use client";

import Link from "next/link";
import { ArrowUpRight, Image as ImageIcon, Star } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { SmartImage } from "@/components/ui/SmartImage";
import { TagList } from "@/components/ui/TagList";
import { formatDateRange, tr } from "@/lib/i18n";
import { routes } from "@/lib/site";
import { tagHue } from "@/lib/tagColor";
import type { Project } from "@/lib/types";

/** Deterministic cover gradient for projects without an uploaded thumbnail. */
function placeholderStyle(project: Project) {
  const hue = tagHue(project.tags[0] ?? project.slug);
  return {
    background: `linear-gradient(135deg, oklch(72% 0.14 ${hue}), oklch(58% 0.17 ${(hue + 45) % 360}))`,
  };
}

export function ProjectCard({
  project,
  /** The first row is above the fold, so its cover should not lazy-load. */
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const { lang, t } = useLang();

  const title = tr(project.title_ko, project.title_en, lang);
  const summary = tr(project.summary_ko, project.summary_en, lang);
  const category = tr(project.category_ko, project.category_en, lang);
  const period = formatDateRange(
    project.period_start,
    project.period_end,
    project.is_ongoing,
    lang,
  );

  return (
    <li className="h-full">
      <Link
        href={routes.project(project.slug)}
        className="card card-interactive group flex h-full flex-col overflow-hidden focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunken">
          {project.thumbnail_url ? (
            <SmartImage
              src={project.thumbnail_url}
              alt={title}
              priority={priority}
              className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={placeholderStyle(project)}
              aria-hidden="true"
            >
              <ImageIcon className="size-8 text-white/70" />
            </div>
          )}

          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-surface/90 px-2 py-1 text-2xs font-semibold text-fg shadow-subtle backdrop-blur-sm">
            <ArrowUpRight className="size-3" aria-hidden="true" />
            {t("portfolio.details")}
          </span>

          {project.is_featured && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-2xs font-semibold text-accent-fg shadow-subtle">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {t("portfolio.featured")}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {(category || period) && (
            <p className="flex items-center gap-2 text-2xs font-semibold text-fg-subtle">
              {category && <span className="text-accent">{category}</span>}
              {category && period && (
                <span className="text-border-strong" aria-hidden="true">
                  ·
                </span>
              )}
              {period && <span className="tabular-nums">{period}</span>}
            </p>
          )}

          <h3 className="text-base font-bold leading-snug transition-colors group-hover:text-accent">
            {title}
          </h3>

          {summary && (
            <p className="line-clamp-2 text-sm text-fg-muted">{summary}</p>
          )}

          <TagList tags={project.tags} max={5} className="mt-auto pt-2" />
        </div>
      </Link>
    </li>
  );
}
