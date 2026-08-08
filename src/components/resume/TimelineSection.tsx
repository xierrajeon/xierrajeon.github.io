"use client";

import { Award, Briefcase, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AwardItem, TimelineItem } from "./TimelineItem";
import type { TimelineCategory, TimelineEntry } from "@/lib/types";

interface CategoryConfig {
  icon: LucideIcon;
  ko: string;
  en: string;
  /** Awards render as a two-column grid instead of a timeline rail. */
  layout: "rail" | "grid";
}

/** Section labels are chrome, not content, so they live here and not in the DB. */
export const CATEGORY_CONFIG: Record<TimelineCategory, CategoryConfig> = {
  career: {
    icon: Briefcase,
    ko: "경력 사항",
    en: "Work Experience",
    layout: "rail",
  },
  education: {
    icon: GraduationCap,
    ko: "학력 사항",
    en: "Education",
    layout: "rail",
  },
  award: {
    icon: Award,
    ko: "수상 및 자격증",
    en: "Awards & Certifications",
    layout: "grid",
  },
  activity: {
    icon: Users,
    ko: "대외 활동 및 기타",
    en: "Activities",
    layout: "rail",
  },
};

export function TimelineSection({
  category,
  entries,
  /** Id of the entry the reader is currently on, resolved page-wide. */
  activeId = null,
}: {
  category: TimelineCategory;
  entries: TimelineEntry[];
  activeId?: string | null;
}) {
  const config = CATEGORY_CONFIG[category];
  const items = entries.filter((entry) => entry.category === category);

  // An empty section is noise on a resume — drop it entirely.
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`section-${category}`}>
      <SectionHeading
        id={`section-${category}`}
        icon={config.icon}
        ko={config.ko}
        en={config.en}
      />

      {config.layout === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((entry) => (
            <AwardItem key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <div className="relative pl-6 sm:pl-8">
          <span
            className="absolute bottom-6 left-1.5 top-6 w-px bg-border sm:left-2"
            aria-hidden="true"
          />
          <ul className="flex flex-col gap-3">
            {items.map((entry) => (
              <TimelineItem
                key={entry.id}
                entry={entry}
                active={entry.id === activeId}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
