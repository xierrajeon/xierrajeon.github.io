"use client";

import { Layers } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TagList } from "@/components/ui/TagList";
import { tr } from "@/lib/i18n";
import type { Skill } from "@/lib/types";

/** Groups keep their first-seen order, which is the admin's sort order. */
function groupSkills(skills: Skill[], lang: "ko" | "en") {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    const label = tr(skill.group_ko, skill.group_en, lang) || "Others";
    const list = groups.get(label);
    if (list) list.push(skill.name);
    else groups.set(label, [skill.name]);
  }
  return [...groups.entries()];
}

export function SkillsSection({ skills }: { skills: Skill[] }) {
  const { lang } = useLang();
  if (skills.length === 0) return null;

  const groups = groupSkills(skills, lang);

  return (
    <section aria-labelledby="section-skills">
      <SectionHeading
        id="section-skills"
        icon={Layers}
        ko="기술 스택"
        en="Skills"
      />
      <div className="card divide-y divide-border">
        {groups.map(([label, names]) => (
          <div
            key={label}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
          >
            <p className="shrink-0 text-sm font-semibold sm:w-36">{label}</p>
            <TagList tags={names} />
          </div>
        ))}
      </div>
    </section>
  );
}
