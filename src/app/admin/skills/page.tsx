"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { TextInput, Toggle } from "@/components/admin/ui/Field";
import { SaveBar } from "@/components/admin/ui/SaveBar";
import { SkillsSection } from "@/components/resume/SkillsSection";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useSaver } from "@/lib/admin/useSaver";
import type { Skill } from "@/lib/types";

const TEMP_PREFIX = "tmp-";
const isTemp = (id: string) => id.startsWith(TEMP_PREFIX);

function blankSkill(index: number, groupKo = "", groupEn = ""): Skill {
  return {
    id: `${TEMP_PREFIX}${Date.now().toString(36)}-${index}`,
    group_ko: groupKo,
    group_en: groupEn,
    name: "",
    level: null,
    sort_order: index,
    is_published: true,
  };
}

export default function AdminSkillsPage() {
  const [rows, setRows] = useState<Skill[] | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const { status, error, run, reset } = useSaver();

  useEffect(() => {
    getSupabaseBrowser()
      .from("skills")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setRows((data ?? []) as Skill[]));
  }, []);

  function mutate(next: Skill[]) {
    setRows(next);
    setDirty(true);
    reset();
  }

  function move(index: number, direction: -1 | 1) {
    if (!rows) return;
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    mutate(next);
  }

  async function save() {
    if (!rows) return;
    const supabase = getSupabaseBrowser();

    const ok = await run(async () => {
      if (deleted.length) {
        const { error: deleteError } = await supabase
          .from("skills")
          .delete()
          .in("id", deleted);
        if (deleteError) throw deleteError;
      }

      const ordered = rows
        // A nameless row is an abandoned draft, not data worth keeping.
        .filter((row) => row.name.trim())
        .map((row, index) => ({ ...row, sort_order: index }));

      const inserts = ordered
        .filter((row) => isTemp(row.id))
        .map(({ id: _id, ...rest }) => rest);
      const updates = ordered.filter((row) => !isTemp(row.id));

      if (inserts.length) {
        const { error: insertError } = await supabase.from("skills").insert(inserts);
        if (insertError) throw insertError;
      }
      if (updates.length) {
        const { error: upsertError } = await supabase.from("skills").upsert(updates);
        if (upsertError) throw upsertError;
      }

      const { data } = await supabase
        .from("skills")
        .select("*")
        .order("sort_order", { ascending: true });
      setRows((data ?? []) as Skill[]);
      setDeleted([]);
    });

    if (ok) setDirty(false);
  }

  if (!rows) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        불러오는 중…
      </p>
    );
  }

  const lastGroup = rows.at(-1);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">기술 스택</h1>
        <p className="mt-1 text-sm text-fg-muted">
          같은 그룹명을 쓰면 한 줄로 묶여 표시됩니다.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((skill, index) => (
          <li key={skill.id} className="card flex items-start gap-2 p-3">
            <div className="flex flex-col pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="btn btn-ghost p-0.5 disabled:opacity-25"
                aria-label="위로 이동"
              >
                <ChevronUp className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                className="btn btn-ghost p-0.5 disabled:opacity-25"
                aria-label="아래로 이동"
              >
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_1.2fr]">
              <TextInput
                label={index === 0 ? "그룹 (한국어)" : undefined}
                placeholder="프론트엔드"
                value={skill.group_ko}
                onChange={(v) =>
                  mutate(
                    rows.map((row) =>
                      row.id === skill.id ? { ...row, group_ko: v } : row,
                    ),
                  )
                }
              />
              <TextInput
                label={index === 0 ? "그룹 (English)" : undefined}
                placeholder="Frontend"
                value={skill.group_en}
                onChange={(v) =>
                  mutate(
                    rows.map((row) =>
                      row.id === skill.id ? { ...row, group_en: v } : row,
                    ),
                  )
                }
              />
              <TextInput
                label={index === 0 ? "기술명" : undefined}
                placeholder="React"
                value={skill.name}
                onChange={(v) =>
                  mutate(
                    rows.map((row) =>
                      row.id === skill.id ? { ...row, name: v } : row,
                    ),
                  )
                }
              />
            </div>

            <div className="flex flex-col items-end gap-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!isTemp(skill.id)) setDeleted((ids) => [...ids, skill.id]);
                  mutate(rows.filter((row) => row.id !== skill.id));
                }}
                className="btn btn-ghost btn-icon btn-sm text-danger"
                aria-label="삭제"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
              <Toggle
                label=""
                checked={skill.is_published}
                onChange={(v) =>
                  mutate(
                    rows.map((row) =>
                      row.id === skill.id ? { ...row, is_published: v } : row,
                    ),
                  )
                }
              />
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          mutate([
            ...rows,
            // Inherit the previous group so adding a run of skills is one field.
            blankSkill(rows.length, lastGroup?.group_ko, lastGroup?.group_en),
          ])
        }
        className="btn btn-secondary self-start border-dashed"
      >
        <Plus className="size-4" aria-hidden="true" />
        기술 추가
      </button>

      <section>
        <p className="eyebrow mb-2">미리보기</p>
        <div className="rounded-[var(--radius-card)] bg-bg-subtle p-4">
          <SkillsSection
            skills={rows.filter((row) => row.is_published && row.name.trim())}
          />
        </div>
      </section>

      <SaveBar
        status={status}
        error={error}
        dirty={dirty}
        onSave={() => void save()}
      />
    </div>
  );
}
