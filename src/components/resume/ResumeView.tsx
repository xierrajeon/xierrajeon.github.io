"use client";

import { ProfileCard } from "./ProfileCard";
import { SkillsSection } from "./SkillsSection";
import { TimelineSection } from "./TimelineSection";
import { useLive } from "@/lib/useLive";
import type { ResumeData, ResumeSection } from "@/lib/types";

export function ResumeView({ initial }: { initial: ResumeData }) {
  // Pre-rendered content hydrates first, then the newest rows replace it.
  const data = useLive(
    initial,
    () => import("@/lib/queries").then((m) => m.getResumeData()),
    "resume",
  );

  return (
    <div className="container-page">
      <div className="stack-section">
        <ProfileCard profile={data.profile} showPrint />
        {data.profile.section_order.map((section) =>
          renderSection(section, data),
        )}
      </div>
    </div>
  );
}

function renderSection(section: ResumeSection, data: ResumeData) {
  if (section === "skills") {
    return <SkillsSection key={section} skills={data.skills} />;
  }
  return (
    <TimelineSection
      key={section}
      category={section}
      entries={data.entries}
    />
  );
}
