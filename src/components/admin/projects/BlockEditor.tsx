"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Heading2,
  Image as ImageIcon,
  Images,
  Layers,
  Link2,
  Minus,
  MessageSquareQuote,
  Play,
  Sparkles,
  Text as TextIcon,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BilingualField,
  Select,
  TextArea,
  TextInput,
  Toggle,
  UrlInput,
} from "../ui/Field";
import { ImageUploader } from "../ui/ImageUploader";
import { TagInput } from "../ui/TagInput";
import { VideoField } from "../ui/VideoField";
import type {
  BlockType,
  GalleryItem,
  ProjectBlock,
  StackGroup,
} from "@/lib/types";

/* --------------------------------------------------------------------------
 * Block catalogue
 *
 * Each entry knows its label, its icon and the `data` a fresh block starts
 * with, so "add a block" needs no per-type branching in the editor below.
 * ------------------------------------------------------------------------ */

interface BlockSpec {
  type: BlockType;
  label: string;
  hint: string;
  icon: LucideIcon;
  makeData: () => ProjectBlock["data"];
}

export const BLOCK_SPECS: BlockSpec[] = [
  {
    type: "heading",
    label: "제목",
    hint: "우측 목차에 항목으로 올라갑니다",
    icon: Heading2,
    makeData: () => ({ text_ko: "", text_en: "", level: 2 }),
  },
  {
    type: "text",
    label: "본문",
    hint: "마크다운 문단",
    icon: TextIcon,
    makeData: () => ({ text_ko: "", text_en: "" }),
  },
  {
    type: "feature",
    label: "기능 소개",
    hint: "스크린샷·영상 + 설명 + 코드 링크",
    icon: Sparkles,
    makeData: () => ({
      title_ko: "",
      title_en: "",
      body_ko: "",
      body_en: "",
      media_url: null,
      media_kind: "image" as const,
      repo_url: null,
      reversed: false,
    }),
  },
  {
    type: "image",
    label: "이미지",
    hint: "설명이 달린 단일 이미지",
    icon: ImageIcon,
    makeData: () => ({
      url: "",
      alt_ko: "",
      alt_en: "",
      caption_ko: "",
      caption_en: "",
      width: null,
      height: null,
      framed: false,
    }),
  },
  {
    type: "gallery",
    label: "이미지 갤러리",
    hint: "여러 장을 격자로",
    icon: Images,
    makeData: () => ({ items: [], columns: 2 as const }),
  },
  {
    type: "video",
    label: "영상",
    hint: "유튜브 링크 또는 짧은 클립",
    icon: Play,
    makeData: () => ({
      provider: "youtube" as const,
      url: "",
      poster_url: null,
      caption_ko: "",
      caption_en: "",
      autoplay: false,
      loop: false,
    }),
  },
  {
    type: "code",
    label: "코드",
    hint: "핵심 부분만 짧게",
    icon: Code2,
    makeData: () => ({
      language: "ts",
      code: "",
      filename: "",
      caption_ko: "",
      caption_en: "",
    }),
  },
  {
    type: "callout",
    label: "강조 박스",
    hint: "판단 근거나 배운 점",
    icon: MessageSquareQuote,
    makeData: () => ({
      icon: "💡",
      tone: "info" as const,
      text_ko: "",
      text_en: "",
    }),
  },
  {
    type: "stack",
    label: "사용 스택 표",
    hint: "그룹별 기술 목록",
    icon: Layers,
    makeData: () => ({ groups: [] }),
  },
  {
    type: "link",
    label: "링크 카드",
    hint: "저장소나 문서로 보내기",
    icon: Link2,
    makeData: () => ({
      url: "",
      label_ko: "",
      label_en: "",
      description_ko: "",
      description_en: "",
    }),
  },
  {
    type: "divider",
    label: "구분선",
    hint: "",
    icon: Minus,
    makeData: () => ({}) as ProjectBlock["data"],
  },
];

export function specFor(type: BlockType): BlockSpec {
  return BLOCK_SPECS.find((spec) => spec.type === type) ?? BLOCK_SPECS[1];
}

/** One-line summary shown on a collapsed block. */
function summarize(block: ProjectBlock): string {
  switch (block.type) {
    case "heading":
    case "text":
      return block.data.text_ko || block.data.text_en || "비어 있음";
    case "feature":
      return block.data.title_ko || block.data.title_en || "비어 있음";
    case "image":
      return block.data.url ? "이미지 1장" : "이미지 없음";
    case "gallery":
      return `${block.data.items?.length ?? 0}장`;
    case "video":
      return block.data.url || "링크 없음";
    case "code":
      return block.data.filename || block.data.language || "코드";
    case "callout":
      return block.data.text_ko || block.data.text_en || "비어 있음";
    case "stack":
      return `${block.data.groups?.length ?? 0}개 그룹`;
    case "link":
      return block.data.url || "링크 없음";
    default:
      return "";
  }
}

/* --------------------------------------------------------------------------
 * Per-type forms
 * ------------------------------------------------------------------------ */

type Patch = (data: Partial<ProjectBlock["data"]>) => void;

function GalleryForm({
  items,
  columns,
  onChange,
}: {
  items: GalleryItem[];
  columns: 2 | 3;
  onChange: (next: { items: GalleryItem[]; columns: 2 | 3 }) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Select
        label="열 수"
        value={String(columns) as "2" | "3"}
        options={[
          { value: "2", label: "2열" },
          { value: "3", label: "3열" },
        ]}
        onChange={(value) =>
          onChange({ items, columns: value === "3" ? 3 : 2 })
        }
      />

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">이미지 {index + 1}</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  items: items.filter((_, i) => i !== index),
                  columns,
                })
              }
              className="btn btn-ghost btn-icon btn-sm text-danger"
              aria-label="이미지 제거"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <ImageUploader
              label="파일"
              folder="projects"
              value={{ url: item.url, width: item.width, height: item.height }}
              onChange={({ url, width, height }) =>
                onChange({
                  items: items.map((existing, i) =>
                    i === index
                      ? { ...existing, url: url ?? "", width, height }
                      : existing,
                  ),
                  columns,
                })
              }
            />
            <BilingualField
              label="설명"
              ko={item.caption_ko}
              en={item.caption_en}
              onChangeKo={(value) =>
                onChange({
                  items: items.map((existing, i) =>
                    i === index ? { ...existing, caption_ko: value } : existing,
                  ),
                  columns,
                })
              }
              onChangeEn={(value) =>
                onChange({
                  items: items.map((existing, i) =>
                    i === index ? { ...existing, caption_en: value } : existing,
                  ),
                  columns,
                })
              }
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange({
            items: [
              ...items,
              {
                url: "",
                alt_ko: "",
                alt_en: "",
                caption_ko: "",
                caption_en: "",
              },
            ],
            columns,
          })
        }
        className="btn btn-secondary btn-sm self-start border-dashed"
      >
        이미지 추가
      </button>
    </div>
  );
}

function StackForm({
  groups,
  onChange,
}: {
  groups: StackGroup[];
  onChange: (groups: StackGroup[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <div key={index} className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">그룹 {index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(groups.filter((_, i) => i !== index))}
              className="btn btn-ghost btn-icon btn-sm text-danger"
              aria-label="그룹 제거"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <BilingualField
              label="그룹명"
              ko={group.label_ko}
              en={group.label_en}
              onChangeKo={(value) =>
                onChange(
                  groups.map((g, i) => (i === index ? { ...g, label_ko: value } : g)),
                )
              }
              onChangeEn={(value) =>
                onChange(
                  groups.map((g, i) => (i === index ? { ...g, label_en: value } : g)),
                )
              }
            />
            <TagInput
              label="기술"
              value={group.items}
              onChange={(items) =>
                onChange(groups.map((g, i) => (i === index ? { ...g, items } : g)))
              }
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...groups, { label_ko: "", label_en: "", items: [] }])
        }
        className="btn btn-secondary btn-sm self-start border-dashed"
      >
        그룹 추가
      </button>
    </div>
  );
}

function BlockForm({ block, patch }: { block: ProjectBlock; patch: Patch }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex flex-col gap-3">
          <BilingualField
            label="제목"
            ko={block.data.text_ko}
            en={block.data.text_en}
            onChangeKo={(text_ko) => patch({ text_ko })}
            onChangeEn={(text_en) => patch({ text_en })}
          />
          <Select
            label="단계"
            value={String(block.data.level) as "2" | "3"}
            options={[
              { value: "2", label: "대제목 (목차 1단)" },
              { value: "3", label: "소제목 (목차 2단)" },
            ]}
            onChange={(value) => patch({ level: value === "3" ? 3 : 2 })}
          />
        </div>
      );

    case "text":
      return (
        <BilingualField
          label="본문"
          multiline
          rows={10}
          ko={block.data.text_ko}
          en={block.data.text_en}
          onChangeKo={(text_ko) => patch({ text_ko })}
          onChangeEn={(text_en) => patch({ text_en })}
          hint="**굵게**, `코드`, - 목록, 1. 번호목록, > 인용, [링크](url)"
        />
      );

    case "feature":
      return (
        <div className="flex flex-col gap-3">
          <BilingualField
            label="기능 이름"
            ko={block.data.title_ko}
            en={block.data.title_en}
            onChangeKo={(title_ko) => patch({ title_ko })}
            onChangeEn={(title_en) => patch({ title_en })}
            placeholderKo="`:` 을 치면 바로 자동완성"
          />
          <BilingualField
            label="설명"
            multiline
            rows={4}
            ko={block.data.body_ko}
            en={block.data.body_en}
            onChangeKo={(body_ko) => patch({ body_ko })}
            onChangeEn={(body_en) => patch({ body_en })}
          />
          <Select
            label="첨부 종류"
            value={block.data.media_kind}
            options={[
              { value: "image", label: "스크린샷" },
              { value: "video", label: "영상" },
            ]}
            onChange={(media_kind) => patch({ media_kind })}
          />
          {block.data.media_kind === "image" ? (
            <ImageUploader
              label="스크린샷"
              folder="projects"
              value={{
                url: block.data.media_url,
                width: block.data.media_width,
                height: block.data.media_height,
              }}
              onChange={({ url, width, height }) =>
                patch({
                  media_url: url,
                  media_width: width,
                  media_height: height,
                })
              }
            />
          ) : (
            <VideoField
              label="시연 영상"
              url={block.data.media_url ?? ""}
              onChange={(url) => patch({ media_url: url || null })}
            />
          )}
          <UrlInput
            label="이 기능의 코드 링크"
            placeholder="https://github.com/... (파일이나 라인까지 지정 가능)"
            value={block.data.repo_url ?? ""}
            onChange={(value) => patch({ repo_url: value || null })}
          />
          <Toggle
            label="첨부를 오른쪽에 배치"
            checked={Boolean(block.data.reversed)}
            onChange={(reversed) => patch({ reversed })}
          />
        </div>
      );

    case "image":
      return (
        <div className="flex flex-col gap-3">
          <ImageUploader
            label="이미지"
            folder="projects"
            value={{
              url: block.data.url,
              width: block.data.width,
              height: block.data.height,
            }}
            onChange={({ url, width, height }) =>
              patch({ url: url ?? "", width, height })
            }
          />
          <BilingualField
            label="설명 (캡션)"
            ko={block.data.caption_ko}
            en={block.data.caption_en}
            onChangeKo={(caption_ko) => patch({ caption_ko })}
            onChangeEn={(caption_en) => patch({ caption_en })}
          />
          <BilingualField
            label="대체 텍스트"
            ko={block.data.alt_ko}
            en={block.data.alt_en}
            onChangeKo={(alt_ko) => patch({ alt_ko })}
            onChangeEn={(alt_en) => patch({ alt_en })}
            hint="화면을 못 보는 사용자와 검색엔진이 읽습니다. 무엇이 보이는지 한 줄."
          />
          <Toggle
            label="배경 프레임 넣기"
            hint="UI 스크린샷이 배경과 붙어 보일 때 켜세요."
            checked={Boolean(block.data.framed)}
            onChange={(framed) => patch({ framed })}
          />
        </div>
      );

    case "gallery":
      return (
        <GalleryForm
          items={block.data.items ?? []}
          columns={block.data.columns ?? 2}
          onChange={(next) => patch(next)}
        />
      );

    case "video":
      return (
        <div className="flex flex-col gap-3">
          <VideoField
            url={block.data.url}
            onChange={(url, provider) => patch({ url, provider })}
          />
          <BilingualField
            label="설명"
            ko={block.data.caption_ko}
            en={block.data.caption_en}
            onChangeKo={(caption_ko) => patch({ caption_ko })}
            onChangeEn={(caption_en) => patch({ caption_en })}
            placeholderKo="여기를 누르면 이렇게 반응합니다"
          />
          {block.data.provider === "file" && (
            <div className="flex flex-wrap gap-4">
              <Toggle
                label="자동 재생 (무음)"
                checked={block.data.autoplay}
                onChange={(autoplay) => patch({ autoplay })}
              />
              <Toggle
                label="반복 재생"
                checked={block.data.loop}
                onChange={(loop) => patch({ loop })}
              />
            </div>
          )}
        </div>
      );

    case "code":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="파일명"
              placeholder="useEmojiSearch.ts"
              value={block.data.filename}
              onChange={(filename) => patch({ filename })}
            />
            <TextInput
              label="언어"
              placeholder="ts"
              value={block.data.language}
              onChange={(language) => patch({ language })}
            />
          </div>
          <TextArea
            label="코드"
            rows={10}
            value={block.data.code}
            onChange={(code) => patch({ code })}
            className="input font-mono text-xs"
            spellCheck={false}
          />
          <BilingualField
            label="설명"
            ko={block.data.caption_ko}
            en={block.data.caption_en}
            onChangeKo={(caption_ko) => patch({ caption_ko })}
            onChangeEn={(caption_en) => patch({ caption_en })}
          />
        </div>
      );

    case "callout":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="아이콘 (이모지)"
              value={block.data.icon}
              onChange={(icon) => patch({ icon })}
              maxLength={4}
            />
            <Select
              label="색"
              value={block.data.tone}
              options={[
                { value: "info", label: "정보 (보라)" },
                { value: "success", label: "잘된 점 (초록)" },
                { value: "warn", label: "주의 (노랑)" },
              ]}
              onChange={(tone) => patch({ tone })}
            />
          </div>
          <BilingualField
            label="내용"
            multiline
            rows={3}
            ko={block.data.text_ko}
            en={block.data.text_en}
            onChangeKo={(text_ko) => patch({ text_ko })}
            onChangeEn={(text_en) => patch({ text_en })}
          />
        </div>
      );

    case "stack":
      return (
        <StackForm
          groups={block.data.groups ?? []}
          onChange={(groups) => patch({ groups })}
        />
      );

    case "link":
      return (
        <div className="flex flex-col gap-3">
          <UrlInput
            label="URL"
            value={block.data.url}
            onChange={(url) => patch({ url })}
          />
          <BilingualField
            label="링크 문구"
            ko={block.data.label_ko}
            en={block.data.label_en}
            onChangeKo={(label_ko) => patch({ label_ko })}
            onChangeEn={(label_en) => patch({ label_en })}
          />
          <BilingualField
            label="부가 설명"
            ko={block.data.description_ko}
            en={block.data.description_en}
            onChangeKo={(description_ko) => patch({ description_ko })}
            onChangeEn={(description_en) => patch({ description_en })}
          />
        </div>
      );

    case "divider":
      return (
        <p className="text-xs text-fg-subtle">설정할 항목이 없습니다.</p>
      );

    default:
      return null;
  }
}

/* --------------------------------------------------------------------------
 * Row wrapper
 * ------------------------------------------------------------------------ */

export function BlockCard({
  block,
  index,
  count,
  startOpen = false,
  onChange,
  onMove,
  onRemove,
}: {
  block: ProjectBlock;
  index: number;
  count: number;
  startOpen?: boolean;
  onChange: (next: ProjectBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const spec = specFor(block.type);
  const Icon = spec.icon;

  const patch: Patch = (partial) =>
    onChange({
      ...block,
      data: { ...block.data, ...partial },
    } as ProjectBlock);

  return (
    <li className="card overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
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

        <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-xs font-semibold">{spec.label}</span>
          <span className="block truncate text-2xs text-fg-subtle">
            {summarize(block)}
          </span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="btn btn-ghost btn-icon btn-sm text-danger"
          aria-label="블록 삭제"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border p-3.5">
          <BlockForm block={block} patch={patch} />
        </div>
      )}
    </li>
  );
}
