"use client";

import { ExternalLink } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { Markdown } from "@/components/ui/Markdown";
import { HighlightList } from "@/components/ui/TagList";
import { formatDate, formatDateRange, formatDuration, tr } from "@/lib/i18n";
import type { TimelineEntry } from "@/lib/types";

/**
 * Builds the right-hand date pill.
 *
 * Duration is only ever shown for finished entries. For an in-progress one it
 * would have to be computed from "now", which differs between the pre-rendered
 * HTML and the browser and would trip a hydration mismatch every time the month
 * rolled over.
 */
function useDateLabel(entry: TimelineEntry): string {
  const { lang, t } = useLang();

  if (!entry.start_date) return "";

  const from = formatDate(entry.start_date, lang, entry.date_precision);

  if (entry.is_current) {
    const suffix =
      entry.category === "career" ? t("resume.working") : t("resume.ongoing");
    return `${from} - ${suffix}`;
  }

  if (!entry.end_date) return from;

  const range = formatDateRange(
    entry.start_date,
    entry.end_date,
    false,
    lang,
    entry.date_precision,
  );

  if (entry.category !== "career") return range;

  const duration = formatDuration(
    entry.start_date,
    entry.end_date,
    false,
    lang,
  );
  return duration ? `${range} (${duration})` : range;
}

function TitleLine({ entry }: { entry: TimelineEntry }) {
  const { lang } = useLang();
  const title = tr(entry.title_ko, entry.title_en, lang);
  const subtitle = tr(entry.subtitle_ko, entry.subtitle_en, lang);

  const titleNode = entry.url ? (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1 font-bold hover:text-accent"
    >
      {title}
      <ExternalLink
        className="size-3.5 shrink-0 text-fg-subtle transition-colors group-hover:text-accent"
        aria-hidden="true"
      />
    </a>
  ) : (
    <span className="font-bold">{title}</span>
  );

  return (
    <h3 className="text-[0.9375rem] leading-snug">
      {titleNode}
      {subtitle && (
        <>
          <span className="mx-1.5 font-normal text-border-strong" aria-hidden="true">
            |
          </span>
          <span className="text-sm font-medium text-fg-muted">{subtitle}</span>
        </>
      )}
    </h3>
  );
}

/** Career, education and activity rows: full-width card on a timeline rail. */
export function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const { lang } = useLang();
  const dateLabel = useDateLabel(entry);
  const description = tr(entry.description_ko, entry.description_en, lang);
  const location = tr(entry.location_ko, entry.location_en, lang);

  return (
    <li className="relative">
      <span
        className="absolute -left-[1.4375rem] top-5 size-2.5 rounded-full bg-accent ring-4 ring-bg sm:-left-[1.9375rem]"
        aria-hidden="true"
      />
      <article className="card p-4 sm:p-5">
        <div className="flex flex-col gap-x-4 gap-y-1.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <TitleLine entry={entry} />
            {location && (
              <p className="mt-0.5 text-xs text-fg-subtle">{location}</p>
            )}
          </div>
          {dateLabel && (
            <p className="date-pill shrink-0 self-start sm:ml-auto">{dateLabel}</p>
          )}
        </div>

        {description && (
          <Markdown className="rich-text mt-2.5 text-sm">{description}</Markdown>
        )}

        <HighlightList items={entry.tags} className="mt-3" />
      </article>
    </li>
  );
}

/** Awards are single points in time, so they read better as a compact grid. */
export function AwardItem({ entry }: { entry: TimelineEntry }) {
  const { lang } = useLang();
  const title = tr(entry.title_ko, entry.title_en, lang);
  const subtitle = tr(entry.subtitle_ko, entry.subtitle_en, lang);
  const description = tr(entry.description_ko, entry.description_en, lang);
  const date = formatDate(entry.start_date, lang, entry.date_precision);

  return (
    <li>
      <article className="card h-full p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.9375rem] font-bold leading-snug">
            {entry.url ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                {title}
              </a>
            ) : (
              title
            )}
          </h3>
          {date && (
            <p className="date-pill date-pill-accent shrink-0">{date}</p>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-fg-muted">{subtitle}</p>
        )}
        {description && (
          <Markdown className="rich-text mt-2 text-sm">{description}</Markdown>
        )}
        <HighlightList items={entry.tags} className="mt-2.5" />
      </article>
    </li>
  );
}
