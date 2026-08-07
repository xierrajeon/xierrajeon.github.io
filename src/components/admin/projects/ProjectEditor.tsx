"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Plus } from "lucide-react";
import {
  BilingualField,
  TextInput,
  Toggle,
  UrlInput,
} from "../ui/Field";
import { ImageUploader } from "../ui/ImageUploader";
import { SaveBar } from "../ui/SaveBar";
import { TagInput } from "../ui/TagInput";
import { BLOCK_SPECS, BlockCard } from "./BlockEditor";
import { ProjectDetail } from "@/components/project/ProjectDetail";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useSaver } from "@/lib/admin/useSaver";
import type { BlockType, Project, ProjectBlock } from "@/lib/types";

const TEMP_PREFIX = "tmp-";
const isTemp = (id: string) => id.startsWith(TEMP_PREFIX);

/** Module scope so the impure `Date.now()` never sits inside render. */
function tempId(suffix: number): string {
  return `${TEMP_PREFIX}${Date.now().toString(36)}-${suffix}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** How long the "저장됨" confirmation stays on screen before leaving. */
const LEAVE_DELAY_MS = 700;

export function ProjectEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [deletedBlocks, setDeletedBlocks] = useState<string[]>([]);
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { status, error, run, reset } = useSaver();

  useEffect(() => {
    if (!id) return;
    const supabase = getSupabaseBrowser();

    void (async () => {
      const [{ data: row }, { data: blockRows }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("project_blocks")
          .select("*")
          .eq("project_id", id)
          .order("sort_order", { ascending: true }),
      ]);
      if (!row) {
        setNotFound(true);
        return;
      }
      setProject(row as Project);
      setBlocks((blockRows ?? []) as ProjectBlock[]);
    })();
  }, [id]);

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setProject((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
    reset();
  }

  function mutateBlocks(next: ProjectBlock[]) {
    setBlocks(next);
    setDirty(true);
    reset();
  }

  function addBlock(type: BlockType) {
    if (!project) return;
    const spec = BLOCK_SPECS.find((candidate) => candidate.type === type);
    if (!spec) return;
    const newId = tempId(blocks.length);
    mutateBlocks([
      ...blocks,
      {
        id: newId,
        project_id: project.id,
        type,
        sort_order: blocks.length,
        data: spec.makeData(),
      } as ProjectBlock,
    ]);
    setOpenBlockId(newId);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    mutateBlocks(next);
  }

  const preview = useMemo(
    () => (project ? { ...project, blocks } : null),
    [project, blocks],
  );

  /**
   * @param leave  Return to the project list once the write lands. This is the
   *   default action: saving is normally the last thing you do to a project, and
   *   staring at the form afterwards leaves you unsure whether it took. Editing
   *   a long detail page in passes is the exception, so "계속 편집" stays put.
   */
  async function save(leave: boolean) {
    if (!project) return;
    const supabase = getSupabaseBrowser();

    const ok = await run(async () => {
      const slug = slugify(project.slug) || project.slug;

      const { error: projectError } = await supabase
        .from("projects")
        .update({ ...project, slug })
        .eq("id", project.id);
      if (projectError) {
        // 23505 = unique_violation, and `slug` is the only unique column here.
        if ((projectError as { code?: string }).code === "23505") {
          throw new Error(`주소 "${slug}" 는 이미 다른 프로젝트가 쓰고 있습니다.`);
        }
        throw projectError;
      }

      if (deletedBlocks.length) {
        const { error: deleteError } = await supabase
          .from("project_blocks")
          .delete()
          .in("id", deletedBlocks);
        if (deleteError) throw deleteError;
      }

      const ordered = blocks.map((block, index) => ({
        ...block,
        sort_order: index,
        project_id: project.id,
      }));

      const inserts = ordered
        .filter((block) => isTemp(block.id))
        .map(({ id: _id, ...rest }) => rest);
      const updates = ordered.filter((block) => !isTemp(block.id));

      if (inserts.length) {
        const { error: insertError } = await supabase
          .from("project_blocks")
          .insert(inserts);
        if (insertError) throw insertError;
      }
      if (updates.length) {
        const { error: upsertError } = await supabase
          .from("project_blocks")
          .upsert(updates);
        if (upsertError) throw upsertError;
      }

      const [{ data: freshProject }, { data: freshBlocks }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", project.id).single(),
        supabase
          .from("project_blocks")
          .select("*")
          .eq("project_id", project.id)
          .order("sort_order", { ascending: true }),
      ]);
      setProject(freshProject as Project);
      setBlocks((freshBlocks ?? []) as ProjectBlock[]);
      setDeletedBlocks([]);
    });

    if (!ok) return;
    setDirty(false);
    // Hold the "저장됨" confirmation on screen for a beat before navigating,
    // so the save is visibly acknowledged rather than just implied.
    if (leave) setTimeout(() => router.push("/admin/projects"), LEAVE_DELAY_MS);
  }

  if (!id || notFound) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-fg-muted">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/admin/projects" className="btn btn-secondary btn-sm mt-3">
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록으로
        </Link>
      </div>
    );
  }

  if (!project || !preview) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        불러오는 중…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/projects" className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록
        </Link>
        {project.is_published && (
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className="btn btn-ghost btn-sm ml-auto"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            공개 페이지 열기
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-8">
        {/* ---------------------------------------------------------------- */}
        <div className="flex min-w-0 flex-col gap-5">
          <section className="card flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-sm font-bold">기본 정보</h2>

            <BilingualField
              label="프로젝트 이름"
              ko={project.title_ko}
              en={project.title_en}
              onChangeKo={(v) => set("title_ko", v)}
              onChangeEn={(v) => set("title_en", v)}
            />

            <TextInput
              label="주소 (slug)"
              value={project.slug}
              onChange={(v) => set("slug", v)}
              onBlur={() => set("slug", slugify(project.slug))}
              hint={`공개 주소: /projects/${slugify(project.slug) || "..."} · 공개 후에는 바꾸면 기존 링크가 깨집니다.`}
              className="font-mono"
            />

            <BilingualField
              label="카드 요약"
              multiline
              rows={2}
              ko={project.summary_ko}
              en={project.summary_en}
              onChangeKo={(v) => set("summary_ko", v)}
              onChangeEn={(v) => set("summary_en", v)}
              hint="갤러리 카드에 두 줄까지 보입니다. 무엇을 만들었는지 한 문장."
            />

            <BilingualField
              label="분류"
              ko={project.category_ko ?? ""}
              en={project.category_en ?? ""}
              onChangeKo={(v) => set("category_ko", v || null)}
              onChangeEn={(v) => set("category_en", v || null)}
              placeholderKo="기능 개발"
              placeholderEn="Feature"
            />

            <TagInput
              label="사용 스택"
              hint="갤러리 필터로도 쓰입니다. 익숙한 이름은 자동으로 색이 붙습니다."
              value={project.tags}
              onChange={(tags) => set("tags", tags)}
            />
          </section>

          <section className="card flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-sm font-bold">이미지</h2>
            <ImageUploader
              label="갤러리 카드 커버"
              folder="projects"
              maxWidth={1000}
              value={{ url: project.thumbnail_url }}
              onChange={({ url }) => set("thumbnail_url", url)}
              hint="16:10 비율로 잘립니다. 비우면 스택 색으로 그라데이션이 생성됩니다."
            />
            <ImageUploader
              label="상세 페이지 상단 이미지"
              folder="projects"
              value={{ url: project.cover_url }}
              onChange={({ url }) => set("cover_url", url)}
              aspect="aspect-[21/9]"
              hint="넣으면 제목이 이미지 위에 겹쳐 표시됩니다."
            />
          </section>

          <section className="card flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-sm font-bold">기간 · 역할 · 링크</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="시작일"
                type="date"
                value={project.period_start ?? ""}
                onChange={(v) => set("period_start", v || null)}
              />
              <TextInput
                label="종료일"
                type="date"
                value={project.period_end ?? ""}
                onChange={(v) => set("period_end", v || null)}
                disabled={project.is_ongoing}
              />
            </div>
            <Toggle
              label="진행 중"
              checked={project.is_ongoing}
              onChange={(v) => {
                // Clear the end date together with the flag, so the card never
                // renders "2025.03 – 진행 중" against a stored end date.
                setProject((current) =>
                  current
                    ? {
                        ...current,
                        is_ongoing: v,
                        period_end: v ? null : current.period_end,
                      }
                    : current,
                );
                setDirty(true);
                reset();
              }}
            />
            <BilingualField
              label="역할"
              ko={project.role_ko ?? ""}
              en={project.role_en ?? ""}
              onChangeKo={(v) => set("role_ko", v || null)}
              onChangeEn={(v) => set("role_en", v || null)}
              placeholderKo="프론트엔드 단독 개발"
              placeholderEn="Sole frontend developer"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                label="팀 인원"
                type="number"
                min={1}
                value={project.team_size?.toString() ?? ""}
                onChange={(v) => set("team_size", v ? Number(v) : null)}
              />
              <UrlInput
                label="GitHub 저장소"
                value={project.repo_url ?? ""}
                onChange={(v) => set("repo_url", v || null)}
              />
              <UrlInput
                label="라이브 데모"
                value={project.demo_url ?? ""}
                onChange={(v) => set("demo_url", v || null)}
              />
            </div>
          </section>

          <section className="card flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-sm font-bold">상세 페이지 내용</h2>
            <p className="-mt-2 text-2xs text-fg-subtle">
              위에서 아래 순서로 표시됩니다. &ldquo;제목&rdquo; 블록이 우측 목차를
              만듭니다.
            </p>

            {blocks.length > 0 && (
              <ul className="flex flex-col gap-2">
                {blocks.map((block, index) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    index={index}
                    count={blocks.length}
                    startOpen={openBlockId === block.id}
                    onChange={(next) =>
                      mutateBlocks(
                        blocks.map((row) => (row.id === block.id ? next : row)),
                      )
                    }
                    onMove={(direction) => moveBlock(index, direction)}
                    onRemove={() => {
                      if (!isTemp(block.id))
                        setDeletedBlocks((ids) => [...ids, block.id]);
                      mutateBlocks(blocks.filter((row) => row.id !== block.id));
                    }}
                  />
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-1.5 rounded-lg bg-surface-sunken p-2">
              {BLOCK_SPECS.map((spec) => (
                <button
                  key={spec.type}
                  type="button"
                  onClick={() => addBlock(spec.type)}
                  title={spec.hint}
                  className="btn btn-secondary btn-sm gap-1"
                >
                  <Plus className="size-3" aria-hidden="true" />
                  <spec.icon className="size-3.5" aria-hidden="true" />
                  {spec.label}
                </button>
              ))}
            </div>
          </section>

          <section className="card flex flex-col gap-3 p-4 sm:p-5">
            <h2 className="text-sm font-bold">공개 설정</h2>
            <Toggle
              label="공개"
              hint="끄면 갤러리와 상세 페이지 모두에서 사라집니다."
              checked={project.is_published}
              onChange={(v) => set("is_published", v)}
            />
            <Toggle
              label="대표 프로젝트로 표시"
              hint="카드 왼쪽 위에 '대표' 배지가 붙습니다."
              checked={project.is_featured}
              onChange={(v) => set("is_featured", v)}
            />
          </section>

          <SaveBar
            status={status}
            error={error}
            dirty={dirty}
            saveLabel="저장하고 목록으로"
            onSave={() => void save(true)}
          >
            <button
              type="button"
              onClick={() => void save(false)}
              disabled={status === "saving"}
              className="btn btn-secondary"
            >
              계속 편집
            </button>
          </SaveBar>
        </div>

        {/* ---------------------------------------------------------------- */}
        <aside className="min-w-0 xl:sticky xl:top-28">
          <p className="eyebrow mb-2">상세 페이지 미리보기</p>
          <div className="max-h-[80vh] overflow-y-auto rounded-[var(--radius-card)] bg-bg-subtle p-4">
            <ProjectDetail project={preview} embedded />
          </div>
        </aside>
      </div>
    </div>
  );
}
