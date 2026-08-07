"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { StatusText } from "../ui/SaveBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { TagList } from "@/components/ui/TagList";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useSaver } from "@/lib/admin/useSaver";
import type { Project } from "@/lib/types";

/**
 * Project index. Unlike the form screens, actions here write immediately —
 * toggling "published" or nudging an item up is a single intent, and making the
 * user find a save button afterwards only invites forgetting to press it.
 */
export function ProjectList() {
  const router = useRouter();
  const [rows, setRows] = useState<Project[] | null>(null);
  const [creating, setCreating] = useState(false);
  const { status, error, run } = useSaver();

  async function load() {
    const { data } = await getSupabaseBrowser()
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("period_start", { ascending: false, nullsFirst: false });
    setRows((data ?? []) as Project[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(id: string, changes: Partial<Project>) {
    setRows(
      (current) =>
        current?.map((row) => (row.id === id ? { ...row, ...changes } : row)) ??
        current,
    );
    await run(async () => {
      const { error: updateError } = await getSupabaseBrowser()
        .from("projects")
        .update(changes)
        .eq("id", id);
      if (updateError) throw updateError;
    });
  }

  async function move(index: number, direction: -1 | 1) {
    if (!rows) return;
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((row, i) => ({ ...row, sort_order: i }));
    setRows(renumbered);

    await run(async () => {
      const supabase = getSupabaseBrowser();
      // Only the two rows that actually swapped need writing.
      for (const row of [renumbered[index], renumbered[target]]) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ sort_order: row.sort_order })
          .eq("id", row.id);
        if (updateError) throw updateError;
      }
    });
  }

  async function create() {
    setCreating(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          // Placeholder slug; the editor asks for a real one before publishing.
          slug: `untitled-${Math.random().toString(36).slice(2, 8)}`,
          title_ko: "새 프로젝트",
          sort_order: rows?.length ?? 0,
          is_published: false,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      router.push(`/admin/projects/edit?id=${data.id}`);
    } catch (cause) {
      await run(async () => {
        throw cause;
      });
      setCreating(false);
    }
  }

  async function remove(project: Project) {
    if (
      !confirm(
        `"${project.title_ko || project.title_en || project.slug}" 을 삭제할까요?\n상세 페이지 내용도 함께 삭제됩니다.`,
      )
    )
      return;
    setRows((current) => current?.filter((row) => row.id !== project.id) ?? current);
    await run(async () => {
      // project_blocks cascades on delete.
      const { error: deleteError } = await getSupabaseBrowser()
        .from("projects")
        .delete()
        .eq("id", project.id);
      if (deleteError) throw deleteError;
    });
  }

  if (!rows) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        불러오는 중…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">포트폴리오</h1>
          <p className="mt-1 text-sm text-fg-muted">
            갤러리에 보이는 순서대로 나열됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void create()}
          disabled={creating}
          className="btn btn-primary"
        >
          {creating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          새 프로젝트
        </button>
      </div>

      <StatusText status={status} error={error} />

      {rows.length === 0 ? (
        <p className="card p-10 text-center text-sm text-fg-subtle">
          아직 프로젝트가 없습니다. &ldquo;새 프로젝트&rdquo;로 시작하세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((project, index) => (
            <li key={project.id} className="card flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                  className="btn btn-ghost p-0.5 disabled:opacity-25"
                  aria-label="위로 이동"
                >
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={index === rows.length - 1}
                  className="btn btn-ghost p-0.5 disabled:opacity-25"
                  aria-label="아래로 이동"
                >
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              {project.thumbnail_url ? (
                <SmartImage
                  src={project.thumbnail_url}
                  alt=""
                  className="hidden aspect-[16/10] w-20 shrink-0 rounded-md border border-border object-cover sm:block"
                />
              ) : (
                <div
                  className="hidden aspect-[16/10] w-20 shrink-0 items-center justify-center rounded-md bg-surface-sunken sm:flex"
                  aria-hidden="true"
                >
                  <ImageIcon className="size-4 text-fg-subtle" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {project.title_ko || project.title_en || "(제목 없음)"}
                  {project.is_featured && (
                    <Star
                      className="size-3.5 shrink-0 fill-current text-accent"
                      aria-label="대표 프로젝트"
                    />
                  )}
                </p>
                <p className="truncate font-mono text-2xs text-fg-subtle">
                  /projects/{project.slug}
                </p>
                <TagList tags={project.tags} max={4} className="mt-1.5" />
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() =>
                    void patch(project.id, { is_published: !project.is_published })
                  }
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label={project.is_published ? "비공개로 전환" : "공개로 전환"}
                  title={project.is_published ? "공개 중" : "비공개"}
                >
                  {project.is_published ? (
                    <Eye className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <EyeOff className="size-4 text-warn" aria-hidden="true" />
                  )}
                </button>
                <Link
                  href={`/admin/projects/edit?id=${project.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">편집</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void remove(project)}
                  className="btn btn-ghost btn-icon btn-sm text-danger"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
