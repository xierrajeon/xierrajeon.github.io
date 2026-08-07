"use client";

import type { LucideIcon } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";

export interface SectionHeadingProps {
  icon?: LucideIcon;
  /** Korean label, shown as the primary heading in Korean mode. */
  ko: string;
  /** English label. Becomes the heading in English mode, a hint in Korean. */
  en: string;
  /** Right-hand slot for filters or counts. */
  action?: React.ReactNode;
  id?: string;
}

/**
 * "경력 사항 (Work Experience)" in Korean, "Experience" in English — the
 * bilingual form is idiomatic on Korean resumes, but repeating it in English
 * mode would just read as noise.
 */
export function SectionHeading({
  icon: Icon,
  ko,
  en,
  action,
  id,
}: SectionHeadingProps) {
  const { lang } = useLang();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-3">
      <h2
        id={id}
        className="flex items-center gap-2 text-lg font-bold sm:text-xl"
      >
        {Icon && (
          <Icon
            className="size-5 shrink-0 text-accent"
            aria-hidden="true"
            strokeWidth={2}
          />
        )}
        {lang === "ko" ? (
          <span>
            {ko}
            <span className="ml-1.5 text-sm font-semibold text-fg-subtle">
              ({en})
            </span>
          </span>
        ) : (
          <span>{en}</span>
        )}
      </h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
