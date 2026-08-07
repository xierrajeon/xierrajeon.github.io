"use client";

import { ExternalLink } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { Markdown } from "@/components/ui/Markdown";
import { HighlightList } from "@/components/ui/TagList";
import {
  formatDate,
  formatDateRange,
  formatDuration,
  formatGpa,
  tr,
} from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";
import type { EnrollmentStatus, TimelineEntry } from "@/lib/types";

/** Only the two in-progress states earn a coloured badge. */
const ENROLLMENT_TONE: Record<EnrollmentStatus, string> = {
  enrolled: "bg-success-soft text-success",
  on_leave: "bg-warn-soft text-warn",
  expected: "bg-accent-soft text-accent",
  graduated: "bg-surface-sunken text-fg-muted",
  withdrawn: "bg-surface-sunken text-fg-muted",
};

/**
 * Majors, degree status and GPA — the three things a Korean resume reader looks
 * for on an education row, and nothing else renders them.
 */
function EducationDetails({ entry }: { entry: TimelineEntry }) {
  const { lang, t } = useLang();

  const majors = entry.majors ?? [];
  const gpa = formatGpa(entry.gpa, entry.gpa_scale);
  const status = entry.enrollment_status;

  if (majors.length === 0 && !gpa && !status) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {majors.length > 0 && (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {majors.map((major, index) => {
            const name = tr(major.name_ko, major.name_en, lang);
            if (!name) return null;
            return (
              <li
                key={`${name}-${index}`}
                className="flex items-baseline gap-1.5 text-sm"
              >
                <span className="tag shrink-0 text-2xs">
                  {t(`major.${major.kind}` as DictKey)}
                </span>
                <span className="font-medium">{name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {(gpa || status) && (
        <div className="flex flex-wrap items-center gap-2">
          {status && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-2xs font-semibold ${ENROLLMENT_TONE[status]}`}
            >
              {t(`enrollment.${status}` as DictKey)}
            </span>
          )}
          {gpa && (
            <span className="text-xs text-fg-muted">
              {t("resume.gpa")}{" "}
              <strong className="font-semibold tabular-nums text-fg">
                {gpa}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

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

        {entry.category === "education" && <EducationDetails entry={entry} />}

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
