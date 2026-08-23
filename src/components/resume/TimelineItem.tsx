"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import { HighlightList } from "@/components/ui/TagList";
import {
  formatDate,
  formatDateRange,
  formatDuration,
  formatGpa,
  tr,
} from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";
import { routes } from "@/lib/site";
import { safeExternalUrl } from "@/lib/url";
import type { EnrollmentStatus, TimelineEntry } from "@/lib/types";

/**
 * Projects built during a career entry.
 *
 * The point is that a short career bullet can hand off to the long write-up, so
 * every linked item carries a visible affordance: an inward arrow for a project
 * in the portfolio tab, an outward one for an external address. Items with no
 * destination still render, just as plain chips — naming the work is useful even
 * when there is nothing to link to.
 */
function LinkedProjects({ entry }: { entry: TimelineEntry }) {
  const { lang, t } = useLang();
  const items = entry.linked_projects ?? [];
  if (items.length === 0) return null;

  return (
    <div className="mt-3.5 flex flex-col gap-1.5">
      <p className="text-2xs font-semibold text-fg-subtle">
        {t("resume.linkedProjects")}
      </p>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {items.map((item, index) => {
          const name = tr(item.name_ko, item.name_en, lang);
          if (!name) return null;
          const note = tr(item.note_ko, item.note_en, lang);

          // An internal slug wins: it navigates client-side and survives a
          // domain change.
          const internal = item.slug ? routes.project(item.slug) : null;
          const external = internal ? null : safeExternalUrl(item.url);
          const href = internal ?? external;

          const period = formatDateRange(
            item.start_date,
            item.end_date,
            item.is_ongoing,
            lang,
          );

          const body = (
            <>
              <span className="shrink-0 text-xs font-semibold">{name}</span>
              {period && (
                <span className="shrink-0 text-2xs tabular-nums text-fg-subtle">
                  {period}
                </span>
              )}
              {note && (
                <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">
                  {note}
                </span>
              )}
              {href && (
                <span className="ml-auto flex shrink-0 items-center gap-1 text-2xs font-semibold text-accent">
                  {t("portfolio.details")}
                  {internal ? (
                    <ArrowRight className="size-3" aria-hidden="true" />
                  ) : (
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  )}
                </span>
              )}
            </>
          );

          const row = "flex items-baseline gap-2.5 px-3 py-2";

          return (
            <li key={`${item.slug ?? item.url ?? name}-${index}`}>
              {internal ? (
                <Link
                  href={internal}
                  className={`${row} transition-colors hover:bg-surface-hover`}
                >
                  {body}
                </Link>
              ) : external ? (
                <a
                  href={external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${row} transition-colors hover:bg-surface-hover`}
                >
                  {body}
                </a>
              ) : (
                <div className={row}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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

  // A career row's company, role and dates are fixed text. Linking the company
  // name is confusing next to the project rows below, which are where the
  // outbound links belong.
  const href = entry.category === "career" ? null : safeExternalUrl(entry.url);
  const titleNode = href ? (
    <a
      href={href}
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
export function TimelineItem({
  entry,
  /** True while the reader is scrolled onto this entry — lights its rail dot. */
  active = false,
}: {
  entry: TimelineEntry;
  active?: boolean;
}) {
  const { lang } = useLang();
  const dateLabel = useDateLabel(entry);
  const description = tr(entry.description_ko, entry.description_en, lang);
  const location = tr(entry.location_ko, entry.location_en, lang);

  return (
    <li className="relative" data-spy-id={entry.id}>
      <span
        className="timeline-dot"
        data-active={active}
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

        {entry.category === "career" && <LinkedProjects entry={entry} />}
      </article>
    </li>
  );
}

/** Awards are single points in time, so they read better as a compact grid. */
export function AwardItem({ entry }: { entry: TimelineEntry }) {
  const { lang, t } = useLang();
  const title = tr(entry.title_ko, entry.title_en, lang);
  const subtitle = tr(entry.subtitle_ko, entry.subtitle_en, lang);
  const description = tr(entry.description_ko, entry.description_en, lang);
  const date = formatDate(entry.start_date, lang, entry.date_precision);

  return (
    <li>
      <article className="card h-full p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.9375rem] font-bold leading-snug">
            {safeExternalUrl(entry.url) ? (
              <a
                href={safeExternalUrl(entry.url) as string}
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
        {entry.score && (
          <p className="mt-1.5 text-sm">
            <span className="text-2xs font-semibold text-fg-subtle">
              {t("resume.score")}
            </span>{" "}
            <strong className="font-bold tabular-nums text-accent">
              {entry.score}
            </strong>
          </p>
        )}
        {entry.credential_id && (
          <p className="mt-1 text-2xs text-fg-subtle">
            {t("resume.credentialId")}{" "}
            <span className="font-mono tabular-nums">{entry.credential_id}</span>
          </p>
        )}
        {description && (
          <Markdown className="rich-text mt-2 text-sm">{description}</Markdown>
        )}
        {entry.image_url && (
          <a
            href={entry.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
            aria-label={`${title} ${t("resume.certificate")}`}
          >
            <SmartImage
              src={entry.image_url}
              alt={`${title} ${t("resume.certificate")}`}
              className="max-h-56 w-full object-contain bg-surface-sunken"
            />
          </a>
        )}
        <HighlightList items={entry.tags} className="mt-2.5" />
      </article>
    </li>
  );
}
