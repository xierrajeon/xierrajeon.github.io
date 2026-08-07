"use client";

import { ProfileCard } from "./ProfileCard";
import { SkillsSection } from "./SkillsSection";
import { TimelineSection } from "./TimelineSection";
import { useLive } from "@/lib/useLive";
import type { ResumeData, TimelineCategory } from "@/lib/types";

/** Career first, then the sections a Korean CV expects in this order. */
const ORDER: TimelineCategory[] = ["career", "education", "award", "activity"];

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
        {ORDER.map((category) => (
          <TimelineSection
            key={category}
            category={category}
            entries={data.entries}
          />
        ))}
        <SkillsSection skills={data.skills} />
      </div>
    </div>
  );
}
