"use client";

import { ProfileCard } from "./ProfileCard";
import { SkillsSection } from "./SkillsSection";
import { TimelineSection } from "./TimelineSection";
import { useLive } from "@/lib/useLive";
import { useScrollSpy } from "@/lib/useScrollSpy";
import type { ResumeData, ResumeSection } from "@/lib/types";

export function ResumeView({ initial }: { initial: ResumeData }) {
  // Pre-rendered content hydrates first, then the newest rows replace it.
  const data = useLive(
    initial,
    () => import("@/lib/queries").then((m) => m.getResumeData()),
    "resume",
  );

  // One spy for the whole page: the timeline is split across several sections,
  // but only a single entry should ever be lit.
  const activeId = useScrollSpy(data.entries.length);

  return (
    <div className="container-page">
      <div className="stack-section">
        <ProfileCard profile={data.profile} showPrint />
        {data.profile.section_order.map((section) =>
          renderSection(section, data, activeId),
        )}
      </div>
    </div>
  );
}

function renderSection(
  section: ResumeSection,
  data: ResumeData,
  activeId: string | null,
) {
  if (section === "skills") {
    return <SkillsSection key={section} skills={data.skills} />;
  }
  return (
    <TimelineSection
      key={section}
      category={section}
      entries={data.entries}
      activeId={activeId}
    />
  );
}
