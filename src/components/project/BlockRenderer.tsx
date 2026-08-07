"use client";

import { ArrowUpRight, Code2, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import { TagList } from "@/components/ui/TagList";
import { CodeBlockView } from "./CodeBlockView";
import { VideoEmbed } from "./VideoEmbed";
import { tr, translate } from "@/lib/i18n";
import { detectProvider } from "@/lib/video";
import type { Lang, ProjectBlock } from "@/lib/types";

/**
 * Anchor for a heading block. Derived from the row id rather than the heading
 * text so the fragment stays valid when the language is toggled.
 */
export function blockAnchorId(blockId: string): string {
  return `h-${blockId}`;
}

function Caption({ text }: { text: string }) {
  if (!text) return null;
  return (
    <figcaption className="mt-2 text-center text-xs text-fg-subtle">
      {text}
    </figcaption>
  );
}

const CALLOUT_TONES = {
  info: { className: "bg-accent-soft text-accent", Icon: Info },
  success: { className: "bg-success-soft text-success", Icon: Lightbulb },
  warn: { className: "bg-warn-soft text-warn", Icon: TriangleAlert },
} as const;

function BlockBody({ block, lang }: { block: ProjectBlock; lang: Lang }) {
  switch (block.type) {
    case "heading": {
      const text = tr(block.data.text_ko, block.data.text_en, lang);
      const id = blockAnchorId(block.id);
      return block.data.level === 2 ? (
        <h2
          id={id}
          className="scroll-mt-28 border-b border-border pb-2 text-xl font-bold sm:text-2xl"
        >
          {text}
        </h2>
      ) : (
        <h3 id={id} className="scroll-mt-28 text-lg font-bold">
          {text}
        </h3>
      );
    }

    case "text":
      return (
        <Markdown className="rich-text">
          {tr(block.data.text_ko, block.data.text_en, lang)}
        </Markdown>
      );

    case "image": {
      const { url, width, height, framed } = block.data;
      if (!url) return null;
      const alt = tr(block.data.alt_ko, block.data.alt_en, lang);
      return (
        <figure>
          <div
            className={
              framed
                ? "rounded-xl bg-surface-sunken p-3 sm:p-5"
                : undefined
            }
          >
            <SmartImage
              src={url}
              alt={alt}
              width={width}
              height={height}
              className="w-full rounded-lg border border-border"
            />
          </div>
          <Caption
            text={tr(block.data.caption_ko, block.data.caption_en, lang)}
          />
        </figure>
      );
    }

    case "gallery": {
      const items = block.data.items?.filter((item) => item.url) ?? [];
      if (items.length === 0) return null;
      return (
        <ul
          className={`grid gap-3 ${
            block.data.columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {items.map((item, index) => (
            <li key={`${item.url}-${index}`}>
              <figure>
                <SmartImage
                  src={item.url}
                  alt={tr(item.alt_ko, item.alt_en, lang)}
                  width={item.width}
                  height={item.height}
                  className="w-full rounded-lg border border-border object-cover"
                />
                <Caption text={tr(item.caption_ko, item.caption_en, lang)} />
              </figure>
            </li>
          ))}
        </ul>
      );
    }

    case "video": {
      const caption = tr(block.data.caption_ko, block.data.caption_en, lang);
      return (
        <figure>
          <VideoEmbed data={block.data} title={caption || "video"} />
          {caption && (
            <figcaption className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "code": {
      const caption = tr(block.data.caption_ko, block.data.caption_en, lang);
      return (
        <figure>
          <CodeBlockView data={block.data} />
          <Caption text={caption} />
        </figure>
      );
    }

    case "callout": {
      const tone = CALLOUT_TONES[block.data.tone] ?? CALLOUT_TONES.info;
      const { Icon } = tone;
      return (
        <aside className={`flex gap-3 rounded-xl p-4 ${tone.className}`}>
          <span className="shrink-0 text-base leading-6" aria-hidden="true">
            {block.data.icon || <Icon className="size-5" />}
          </span>
          <Markdown className="rich-text text-sm [&_*]:text-current">
            {tr(block.data.text_ko, block.data.text_en, lang)}
          </Markdown>
        </aside>
      );
    }

    case "feature": {
      const { media_url, media_kind, repo_url, reversed } = block.data;
      const title = tr(block.data.title_ko, block.data.title_en, lang);
      const body = tr(block.data.body_ko, block.data.body_en, lang);

      const media = media_url ? (
        media_kind === "video" ? (
          <VideoEmbed
            data={{
              provider: detectProvider(media_url),
              url: media_url,
              poster_url: null,
              caption_ko: "",
              caption_en: "",
              autoplay: false,
              loop: false,
            }}
            title={title}
          />
        ) : (
          <SmartImage
            src={media_url}
            alt={title}
            width={block.data.media_width}
            height={block.data.media_height}
            className="w-full rounded-xl border border-border"
          />
        )
      ) : null;

      return (
        <div
          className={`card grid items-center gap-5 p-4 sm:p-5 ${
            media ? "md:grid-cols-2" : ""
          }`}
        >
          {media && (
            <div className={reversed ? "md:order-2" : undefined}>{media}</div>
          )}
          <div>
            <h3 className="text-base font-bold">
              <Markdown inline>{title}</Markdown>
            </h3>
            {body && (
              <Markdown className="rich-text mt-2 text-sm">{body}</Markdown>
            )}
            {repo_url && (
              <a
                href={repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm mt-3"
              >
                <Code2 className="size-3.5" aria-hidden="true" />
                {translate(lang, "project.viewCode")}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      );
    }

    case "stack": {
      const groups = block.data.groups ?? [];
      if (groups.length === 0) return null;
      return (
        <div className="card divide-y divide-border">
          {groups.map((group, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <p className="shrink-0 text-sm font-semibold sm:w-32">
                {tr(group.label_ko, group.label_en, lang)}
              </p>
              <TagList tags={group.items} />
            </div>
          ))}
        </div>
      );
    }

    case "link": {
      if (!block.data.url) return null;
      const label =
        tr(block.data.label_ko, block.data.label_en, lang) || block.data.url;
      const description = tr(
        block.data.description_ko,
        block.data.description_en,
        lang,
      );
      return (
        <a
          href={block.data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-interactive flex items-center gap-3 p-4"
        >
          <Code2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{label}</span>
            {description && (
              <span className="block text-xs text-fg-muted">{description}</span>
            )}
          </span>
          <ArrowUpRight
            className="size-4 shrink-0 text-fg-subtle"
            aria-hidden="true"
          />
        </a>
      );
    }

    case "divider":
      return <hr className="divider" />;

    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: { blocks: ProjectBlock[] }) {
  const { lang } = useLang();

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block) => (
        <div
          key={block.id}
          // Headings need extra separation from the block above them.
          className={block.type === "heading" ? "mt-4 first:mt-0" : undefined}
        >
          <BlockBody block={block} lang={lang} />
        </div>
      ))}
    </div>
  );
}
