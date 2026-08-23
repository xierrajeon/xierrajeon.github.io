"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  BilingualField,
  Select,
  TextInput,
  Toggle,
  UrlInput,
} from "./ui/Field";
import { SaveBar } from "./ui/SaveBar";
import { TagInput } from "./ui/TagInput";
import { ImageUploader } from "./ui/ImageUploader";
import { CATEGORY_CONFIG, TimelineSection } from "@/components/resume/TimelineSection";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useSaver } from "@/lib/admin/useSaver";
import { dict, formatGpa } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { internalProjectSlug } from "@/lib/url";
import { normalizeTimelineEntries } from "@/lib/normalize";
import {
  ENROLLMENT_STATUSES,
  MAJOR_KINDS,
  TIMELINE_CATEGORIES,
  type DatePrecision,
  type EnrollmentStatus,
  type LinkedProject,
  type Major,
  type MajorKind,
  type TimelineCategory,
  type TimelineEntry,
} from "@/lib/types";

/** Rows created in the browser carry a temporary id until they are inserted. */
const TEMP_PREFIX = "tmp-";
const isTemp = (id: string) => id.startsWith(TEMP_PREFIX);

function blankEntry(category: TimelineCategory, index: number): TimelineEntry {
  return {
    id: `${TEMP_PREFIX}${Date.now().toString(36)}-${index}`,
    category,
    title_ko: "",
    title_en: "",
    subtitle_ko: "",
    subtitle_en: "",
    description_ko: "",
    description_en: "",
    start_date: null,
    end_date: null,
    is_current: false,
    date_precision: "month",
    location_ko: null,
    location_en: null,
    url: null,
    tags: [],
    sort_order: index,
    is_published: true,
    linked_projects: [],
    credential_id: null,
    score: null,
    image_url: null,
    majors: [],
    gpa: null,
    gpa_scale: category === "education" ? 4.5 : null,
    enrollment_status: category === "education" ? "graduated" : null,
  };
}

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: "year", label: "연도까지 (2024)" },
  { value: "month", label: "월까지 (2024.03)" },
  { value: "day", label: "일까지 (2024.03.15)" },
];

const MAJOR_KIND_OPTIONS: { value: MajorKind; label: string }[] = MAJOR_KINDS.map(
  (kind) => ({ value: kind, label: dict.ko[`major.${kind}`] }),
);

const ENROLLMENT_OPTIONS: { value: EnrollmentStatus; label: string }[] =
  ENROLLMENT_STATUSES.map((status) => ({
    value: status,
    label: dict.ko[`enrollment.${status}`],
  }));

/** Common Korean grading scales, offered as suggestions but not enforced. */
const GPA_SCALES = [4.5, 4.3, 4.0, 100];

/**
 * Majors for one school.
 *
 * A first major defaults to 주전공 and every later one to 복수전공, because that
 * is the shape of the data almost every time — one primary degree plus
 * additions. Nothing is enforced, so an unusual case can still be described.
 */
function MajorsEditor({
  majors,
  onChange,
}: {
  majors: Major[];
  onChange: (majors: Major[]) => void;
}) {
  function update(index: number, patch: Partial<Major>) {
    onChange(majors.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  return (
    <div className="field">
      <span className="label">전공</span>

      {majors.length > 0 && (
        <ul className="flex flex-col gap-2">
          {majors.map((major, index) => (
            <li
              key={index}
              className="grid items-end gap-2 rounded-lg border border-border p-2 sm:grid-cols-[8.5rem_1fr_1fr_auto]"
            >
              <Select
                label={index === 0 ? "구분" : undefined}
                value={major.kind}
                options={MAJOR_KIND_OPTIONS}
                onChange={(kind) => update(index, { kind })}
              />
              <TextInput
                label={index === 0 ? "학과 (한국어)" : undefined}
                placeholder="컴퓨터공학과"
                value={major.name_ko}
                onChange={(name_ko) => update(index, { name_ko })}
              />
              <TextInput
                label={index === 0 ? "학과 (English)" : undefined}
                placeholder="Computer Science"
                value={major.name_en}
                onChange={(name_en) => update(index, { name_en })}
              />
              <button
                type="button"
                onClick={() => onChange(majors.filter((_, i) => i !== index))}
                className="btn btn-ghost btn-icon btn-sm text-danger"
                aria-label={`전공 ${index + 1} 삭제`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...majors,
            {
              name_ko: "",
              name_en: "",
              kind: majors.length === 0 ? "primary" : "double",
            },
          ])
        }
        className="btn btn-secondary btn-sm self-start border-dashed"
      >
        <Plus className="size-4" aria-hidden="true" />
        전공 추가
      </button>

      <p className="text-2xs text-fg-subtle">
        복수전공·이중전공·부전공이 있으면 각각 한 줄씩 추가하세요.
      </p>
    </div>
  );
}

interface ProjectOption {
  slug: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
}

/** Where a linked project points. Derived from the data, not stored. */
type LinkMode = "portfolio" | "external" | "none";

function linkModeOf(item: LinkedProject): LinkMode {
  if (item.slug) return "portfolio";
  if (item.url) return "external";
  return "none";
}

const LINK_MODE_OPTIONS: { value: LinkMode; label: string }[] = [
  { value: "portfolio", label: "포트폴리오 프로젝트" },
  { value: "external", label: "외부 링크" },
  { value: "none", label: "링크 없음" },
];

/**
 * Projects built at a company.
 *
 * The portfolio option is a picker over existing published projects rather than
 * a free-text slug field: the whole value of linking inward is that it lands on
 * a real page, and a typed slug would only 404.
 */
function LinkedProjectsEditor({
  items,
  options,
  onChange,
}: {
  items: LinkedProject[];
  /** Published projects available to link to, with their own periods. */
  options: ProjectOption[];
  onChange: (items: LinkedProject[]) => void;
}) {
  function update(index: number, patch: Partial<LinkedProject>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  /**
   * Pasting the full address of one of our own project pages is the obvious
   * thing to do, so it is converted into an internal reference rather than
   * stored as an external link.
   */
  function setUrl(index: number, url: string) {
    const slug = internalProjectSlug(url, SITE_URL);
    if (slug && options.some((o) => o.slug === slug)) {
      update(index, { slug, url: null });
    } else {
      update(index, { url: url || null });
    }
  }

  /**
   * Picking a portfolio project fills in its period, but only when the row has
   * none yet — the stretch spent on it at one company can legitimately differ
   * from the project's own dates, so an existing value is never overwritten.
   */
  function setSlug(index: number, slug: string | null) {
    const item = items[index];
    const option = options.find((o) => o.slug === slug);
    const blank = !item.start_date && !item.end_date && !item.is_ongoing;
    update(index, {
      slug,
      url: null,
      ...(option && blank
        ? {
            start_date: option.start_date,
            end_date: option.end_date,
            is_ongoing: option.is_ongoing,
          }
        : {}),
    });
  }

  function setMode(index: number, mode: LinkMode) {
    // Only one destination can be live, so switching clears the other.
    if (mode === "portfolio") {
      update(index, { url: null, slug: items[index].slug ?? options[0]?.slug ?? null });
    } else if (mode === "external") {
      update(index, { slug: null, url: items[index].url ?? "" });
    } else {
      update(index, { slug: null, url: null });
    }
  }

  return (
    <div className="field">
      <span className="label">주요 프로젝트</span>

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => {
            const mode = linkModeOf(item);
            return (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-border p-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <TextInput
                      label={index === 0 ? "이름 (한국어)" : undefined}
                      placeholder="Git-Edit-Deploy (GED)"
                      value={item.name_ko}
                      onChange={(name_ko) => update(index, { name_ko })}
                    />
                    <TextInput
                      label={index === 0 ? "이름 (English)" : undefined}
                      placeholder="Git-Edit-Deploy (GED)"
                      value={item.name_en}
                      onChange={(name_en) => update(index, { name_en })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    className="btn btn-ghost btn-icon btn-sm mt-1 text-danger"
                    aria-label={`프로젝트 ${index + 1} 삭제`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput
                    label={index === 0 ? "한 줄 설명 (한국어)" : undefined}
                    placeholder="홈페이지 만들기 프로젝트"
                    value={item.note_ko}
                    onChange={(note_ko) => update(index, { note_ko })}
                  />
                  <TextInput
                    label={index === 0 ? "한 줄 설명 (English)" : undefined}
                    placeholder="Company website build"
                    value={item.note_en}
                    onChange={(note_en) => update(index, { note_en })}
                  />
                </div>

                <div className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <TextInput
                    label="수행 시작"
                    type="date"
                    value={item.start_date ?? ""}
                    onChange={(start_date) =>
                      update(index, { start_date: start_date || null })
                    }
                  />
                  <TextInput
                    label="수행 종료"
                    type="date"
                    value={item.end_date ?? ""}
                    onChange={(end_date) =>
                      update(index, { end_date: end_date || null })
                    }
                    disabled={item.is_ongoing}
                  />
                  <div className="pb-2">
                    <Toggle
                      label="진행 중"
                      checked={item.is_ongoing}
                      onChange={(is_ongoing) =>
                        update(index, {
                          is_ongoing,
                          // Keeping an end date alongside "in progress" would
                          // render contradictory text.
                          end_date: is_ongoing ? null : item.end_date,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[11rem_1fr]">
                  <Select
                    label="이동 대상"
                    value={mode}
                    options={LINK_MODE_OPTIONS}
                    onChange={(next) => setMode(index, next)}
                  />

                  {mode === "portfolio" &&
                    (options.length > 0 ? (
                      <Select
                        label="프로젝트"
                        value={item.slug ?? ""}
                        options={[
                          { value: "", label: "— 선택 —" },
                          ...options.map((o) => ({
                            value: o.slug,
                            label: `${o.title} (/${o.slug})`,
                          })),
                        ]}
                        onChange={(slug) => setSlug(index, slug || null)}
                      />
                    ) : (
                      <p className="self-end text-2xs text-warn">
                        연결할 공개 프로젝트가 없습니다. 포트폴리오 탭에서 먼저
                        프로젝트를 만들고 공개하세요.
                      </p>
                    ))}

                  {mode === "external" && (
                    <UrlInput
                      label="주소"
                      hint="이 사이트의 /projects/... 주소를 붙이면 내부 링크로 바뀝니다."
                      value={item.url ?? ""}
                      onChange={(url) => setUrl(index, url)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              name_ko: "",
              name_en: "",
              note_ko: "",
              note_en: "",
              start_date: null,
              end_date: null,
              is_ongoing: false,
              slug: null,
              url: null,
            },
          ])
        }
        className="btn btn-secondary btn-sm self-start border-dashed"
      >
        <Plus className="size-4" aria-hidden="true" />
        프로젝트 추가
      </button>

      <p className="text-2xs text-fg-subtle">
        회사 카드 아래에 한 줄씩 표시됩니다. 여기서 짧게 나열하고 긴 설명은
        포트폴리오 상세 페이지로 넘기세요.
      </p>
    </div>
  );
}

/** Score plus the scale it is out of; one without the other means nothing. */
function GpaFields({
  gpa,
  gpaScale,
  onChange,
}: {
  gpa: number | null;
  gpaScale: number | null;
  onChange: (patch: { gpa?: number | null; gpa_scale?: number | null }) => void;
}) {
  const overMax = gpa !== null && gpaScale !== null && gpa > gpaScale;

  return (
    <div className="field">
      <span className="label">학점</span>
      <div className="flex items-center gap-2">
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          placeholder="3.80"
          aria-label="취득 학점"
          value={gpa ?? ""}
          onChange={(event) =>
            onChange({ gpa: event.target.value === "" ? null : Number(event.target.value) })
          }
        />
        <span className="shrink-0 text-sm text-fg-subtle">/</span>
        <input
          className="input"
          type="number"
          step="0.1"
          min="0"
          list="gpa-scales"
          placeholder="4.5"
          aria-label="만점 기준"
          value={gpaScale ?? ""}
          onChange={(event) =>
            onChange({
              gpa_scale: event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
        <datalist id="gpa-scales">
          {GPA_SCALES.map((scale) => (
            <option key={scale} value={scale} />
          ))}
        </datalist>
      </div>
      {overMax ? (
        <p className="text-2xs text-danger">
          취득 학점이 만점보다 큽니다. 만점 기준을 확인하세요.
        </p>
      ) : (
        <p className="text-2xs text-fg-subtle">
          {gpa !== null
            ? `이렇게 표시됩니다 — ${formatGpa(gpa, gpaScale)}`
            : "비워두면 학점이 표시되지 않습니다."}
        </p>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  index,
  count,
  allTags,
  projectOptions,
  onChange,
  onMove,
  onRemove,
}: {
  entry: TimelineEntry;
  index: number;
  count: number;
  allTags: string[];
  projectOptions: ProjectOption[];
  onChange: (next: TimelineEntry) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(isTemp(entry.id));
  const config = CATEGORY_CONFIG[entry.category];

  function set<K extends keyof TimelineEntry>(key: K, value: TimelineEntry[K]) {
    onChange({ ...entry, [key]: value });
  }

  const heading =
    entry.title_ko || entry.title_en || `새 ${config.ko} 항목`;

  return (
    <li className="card overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="btn btn-ghost p-0.5 disabled:opacity-25"
            aria-label="위로 이동"
          >
            <ChevronUp className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            className="btn btn-ghost p-0.5 disabled:opacity-25"
            aria-label="아래로 이동"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {heading}
            {!entry.is_published && (
              <EyeOff className="size-3.5 shrink-0 text-warn" aria-label="비공개" />
            )}
          </span>
          <span className="block truncate text-2xs text-fg-subtle">
            {[entry.subtitle_ko || entry.subtitle_en, entry.start_date]
              .filter(Boolean)
              .join(" · ") || "내용 없음"}
          </span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="btn btn-ghost btn-icon btn-sm text-danger"
          aria-label="삭제"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <BilingualField
            label={
              entry.category === "award"
                ? "수상명 · 자격증명 · 특허명"
                : entry.category === "education"
                  ? "학교명"
                  : entry.category === "career"
                    ? "회사명"
                    : "활동명"
            }
            ko={entry.title_ko}
            en={entry.title_en}
            onChangeKo={(v) => set("title_ko", v)}
            onChangeEn={(v) => set("title_en", v)}
          />

          <BilingualField
            label={
              entry.category === "award"
                ? "발급 · 주최 기관"
                : entry.category === "education"
                  ? "학위"
                  : entry.category === "career"
                    ? "직책"
                    : "역할"
            }
            ko={entry.subtitle_ko}
            en={entry.subtitle_en}
            onChangeKo={(v) => set("subtitle_ko", v)}
            onChangeEn={(v) => set("subtitle_en", v)}
            placeholderKo={entry.category === "education" ? "학사" : undefined}
            placeholderEn={entry.category === "education" ? "B.S." : undefined}
          />

          {entry.category === "education" && (
            <>
              <MajorsEditor
                majors={entry.majors ?? []}
                onChange={(majors) => set("majors", majors)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <GpaFields
                  gpa={entry.gpa}
                  gpaScale={entry.gpa_scale}
                  onChange={(patch) => onChange({ ...entry, ...patch })}
                />
                <Select
                  label="현재 상태"
                  value={entry.enrollment_status ?? "graduated"}
                  options={ENROLLMENT_OPTIONS}
                  onChange={(status) => set("enrollment_status", status)}
                />
              </div>
            </>
          )}

          {/* Awards and certificates are single-point events — the renderer
              only ever shows their start date — so offering a range and an
              "in progress" flag here just invited filling in fields that go
              nowhere. */}
          {entry.category === "award" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="취득일"
                  type="date"
                  value={entry.start_date ?? ""}
                  onChange={(v) => set("start_date", v || null)}
                />
                <Select
                  label="날짜 표기"
                  value={entry.date_precision}
                  options={PRECISION_OPTIONS}
                  onChange={(v) => set("date_precision", v)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="점수 · 등급"
                  placeholder="예: 950 · IH · 6급"
                  value={entry.score ?? ""}
                  onChange={(v) => set("score", v || null)}
                  hint="어학 시험 점수/등급. 비워두면 표시되지 않습니다."
                />
                <TextInput
                  label="자격 · 특허번호"
                  placeholder="24201050123A"
                  value={entry.credential_id ?? ""}
                  onChange={(v) => set("credential_id", v || null)}
                  hint="발급기관이 부여한 자격번호 또는 특허등록번호. 비워두면 표시되지 않습니다."
                />
              </div>

              <ImageUploader
                label="증빙 이미지"
                hint="자격증 · 상장 · 특허증 사진. 카드 안에 함께 표시됩니다."
                folder="timeline"
                maxWidth={1200}
                value={{ url: entry.image_url }}
                onChange={(next) => set("image_url", next.url)}
              />
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <TextInput
                  label="시작일"
                  type="date"
                  value={entry.start_date ?? ""}
                  onChange={(v) => set("start_date", v || null)}
                />
                <TextInput
                  label="종료일"
                  type="date"
                  value={entry.end_date ?? ""}
                  onChange={(v) => set("end_date", v || null)}
                  disabled={entry.is_current}
                  hint={
                    entry.is_current ? "진행 중이면 비활성화됩니다." : undefined
                  }
                />
                <Select
                  label="날짜 표기"
                  value={entry.date_precision}
                  options={PRECISION_OPTIONS}
                  onChange={(v) => set("date_precision", v)}
                />
              </div>

              <Toggle
                label={entry.category === "career" ? "재직 중" : "진행 중"}
                checked={entry.is_current}
                onChange={(v) => {
                  onChange({
                    ...entry,
                    is_current: v,
                    // Keeping a stale end date alongside "in progress" would
                    // render contradictory text.
                    end_date: v ? null : entry.end_date,
                  });
                }}
              />
            </>
          )}

          <BilingualField
            label="설명"
            multiline
            // Two rows on purpose: a resume line should be short. The box is
            // still a textarea — drag its corner, and newlines and markdown
            // survive — because a single-line input would silently flatten
            // anything already written.
            rows={2}
            ko={entry.description_ko}
            en={entry.description_en}
            onChangeKo={(v) => set("description_ko", v)}
            onChangeEn={(v) => set("description_en", v)}
            hint={
              entry.category === "career"
                ? "어떤 직무였는지 한 줄로. 만든 것들은 아래 '주요 프로젝트'에 나열하세요."
                : "줄 앞에 - 를 붙이면 목록이 됩니다. **굵게**, `코드` 도 가능합니다."
            }
          />

          <TagInput
            label="성과 · 키워드 칩"
            hint="숫자가 있는 성과 한 줄이 가장 잘 읽힙니다. 예: 페이지 로딩 속도 40% 개선"
            value={entry.tags}
            onChange={(tags) => set("tags", tags)}
            colored={false}
            suggestions={allTags}
          />

          {entry.category === "career" && (
            <LinkedProjectsEditor
              items={entry.linked_projects ?? []}
              options={projectOptions}
              onChange={(linked_projects) => set("linked_projects", linked_projects)}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Career rows keep their company name as fixed text, so there is
                no title link to set — project links live in the list above. */}
            {entry.category !== "career" && (
              <UrlInput
                label="관련 링크"
                hint="제목을 이 주소로 연결합니다."
                value={entry.url ?? ""}
                onChange={(v) => set("url", v || null)}
              />
            )}
            <BilingualField
              label="장소"
              ko={entry.location_ko ?? ""}
              en={entry.location_en ?? ""}
              onChangeKo={(v) => set("location_ko", v || null)}
              onChangeEn={(v) => set("location_en", v || null)}
            />
          </div>

          <Toggle
            label="공개"
            hint="끄면 사이트에서 숨겨집니다. 데이터는 남아 있습니다."
            checked={entry.is_published}
            onChange={(v) => set("is_published", v)}
          />
        </div>
      )}
    </li>
  );
}

export function TimelineEditor() {
  const [category, setCategory] = useState<TimelineCategory>("career");
  const [rows, setRows] = useState<TimelineEntry[] | null>(null);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const { status, error, run, reset } = useSaver();

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    void (async () => {
      const [{ data: entries }, { data: projects }] = await Promise.all([
        supabase
          .from("timeline_entries")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("start_date", { ascending: false, nullsFirst: false }),
        // Only published projects: linking to a draft would land on a 404.
        supabase
          .from("projects")
          .select("slug,title_ko,title_en,period_start,period_end,is_ongoing")
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
      ]);

      setRows(normalizeTimelineEntries((entries ?? []) as TimelineEntry[]));
      setProjectOptions(
        (projects ?? []).map((p) => ({
          slug: p.slug as string,
          title:
            (p.title_ko as string) || (p.title_en as string) || (p.slug as string),
          start_date: (p.period_start as string | null) ?? null,
          end_date: (p.period_end as string | null) ?? null,
          is_ongoing: p.is_ongoing === true,
        })),
      );
    })();
  }, []);

  const visible = useMemo(
    () => (rows ?? []).filter((row) => row.category === category),
    [rows, category],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows ?? []) for (const tag of row.tags) set.add(tag);
    return [...set];
  }, [rows]);

  function mutate(next: TimelineEntry[]) {
    setRows(next);
    setDirty(true);
    reset();
  }

  function replaceInCategory(nextVisible: TimelineEntry[]) {
    const others = (rows ?? []).filter((row) => row.category !== category);
    mutate([...others, ...nextVisible]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= visible.length) return;
    const next = [...visible];
    [next[index], next[target]] = [next[target], next[index]];
    replaceInCategory(next);
  }

  function remove(entry: TimelineEntry) {
    if (!confirm(`"${entry.title_ko || entry.title_en || "이 항목"}" 을 삭제할까요?`))
      return;
    if (!isTemp(entry.id)) setDeleted((ids) => [...ids, entry.id]);
    replaceInCategory(visible.filter((row) => row.id !== entry.id));
  }

  async function save() {
    if (!rows) return;
    const supabase = getSupabaseBrowser();

    const ok = await run(async () => {
      if (deleted.length) {
        const { error: deleteError } = await supabase
          .from("timeline_entries")
          .delete()
          .in("id", deleted);
        if (deleteError) throw deleteError;
      }

      // Display order is the array order, per category.
      const ordered = TIMELINE_CATEGORIES.flatMap((cat) =>
        rows
          .filter((row) => row.category === cat)
          .map((row, index) => ({ ...row, sort_order: index })),
      );

      const inserts = ordered
        .filter((row) => isTemp(row.id))
        .map(({ id: _id, ...rest }) => rest);
      const updates = ordered.filter((row) => !isTemp(row.id));

      if (inserts.length) {
        const { error: insertError } = await supabase
          .from("timeline_entries")
          .insert(inserts);
        if (insertError) throw insertError;
      }
      if (updates.length) {
        const { error: upsertError } = await supabase
          .from("timeline_entries")
          .upsert(updates);
        if (upsertError) throw upsertError;
      }

      // Re-read so temporary ids are replaced by real ones.
      const { data } = await supabase
        .from("timeline_entries")
        .select("*")
        .order("sort_order", { ascending: true });
      setRows(normalizeTimelineEntries((data ?? []) as TimelineEntry[]));
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">이력</h1>
        <p className="mt-1 text-sm text-fg-muted">
          이력서 탭에 타임라인으로 표시됩니다. 위아래 화살표로 순서를 바꿉니다.
        </p>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {TIMELINE_CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const count = rows.filter((row) => row.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`btn btn-sm shrink-0 gap-1.5 ${
                category === cat ? "btn-primary" : "btn-secondary"
              }`}
            >
              <config.icon className="size-4" aria-hidden="true" />
              {config.ko}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-2.5">
        {visible.map((entry, index) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={index}
            count={visible.length}
            allTags={allTags}
            projectOptions={projectOptions}
            onChange={(next) =>
              replaceInCategory(
                visible.map((row) => (row.id === entry.id ? next : row)),
              )
            }
            onMove={(direction) => move(index, direction)}
            onRemove={() => remove(entry)}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          replaceInCategory([...visible, blankEntry(category, visible.length)])
        }
        className="btn btn-secondary self-start border-dashed"
      >
        <Plus className="size-4" aria-hidden="true" />
        {CATEGORY_CONFIG[category].ko} 추가
      </button>

      <section>
        <p className="eyebrow mb-2">미리보기</p>
        <div className="rounded-[var(--radius-card)] bg-bg-subtle p-4">
          <TimelineSection
            category={category}
            entries={visible.filter((row) => row.is_published)}
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
