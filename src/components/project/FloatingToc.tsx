"use client";

import { useEffect, useState } from "react";
import { List, X } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { blockAnchorId } from "./BlockRenderer";
import { tr } from "@/lib/i18n";
import type { ProjectBlock } from "@/lib/types";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function buildToc(
  blocks: ProjectBlock[],
  lang: "ko" | "en",
): TocItem[] {
  return blocks
    .filter((block) => block.type === "heading")
    .map((block) => {
      const data = (block as Extract<ProjectBlock, { type: "heading" }>).data;
      return {
        id: blockAnchorId(block.id),
        text: tr(data.text_ko, data.text_en, lang),
        level: data.level === 3 ? 3 : 2,
      } as TocItem;
    })
    .filter((item) => item.text.length > 0);
}

/**
 * Highlights the heading the reader is currently under.
 *
 * Uses a top-of-viewport line rather than `IntersectionObserver` visibility: a
 * short section between two long ones is often never "most visible", which makes
 * a visibility-based version skip entries as you scroll past them.
 */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  // `ids` is rebuilt every render, so depend on its contents instead of the
  // array identity — otherwise the listener is torn down and re-added forever.
  const idKey = ids.join(",");

  useEffect(() => {
    const ids = idKey ? idKey.split(",") : [];
    if (ids.length === 0) return;

    function update() {
      const line = window.innerHeight * 0.25;
      let current = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= line) current = id;
        else break;
      }
      setActive(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [idKey]);

  return active;
}

function TocLinks({
  items,
  active,
  onNavigate,
}: {
  items: TocItem[];
  active: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={onNavigate}
            aria-current={active === item.id ? "true" : undefined}
            className={`block border-l-2 py-1 leading-snug transition-colors ${
              item.level === 3 ? "pl-5 text-[0.8125rem]" : "pl-3 font-medium"
            } ${
              active === item.id
                ? "border-accent text-accent"
                : "border-border text-fg-subtle hover:border-border-strong hover:text-fg"
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FloatingToc({ blocks }: { blocks: ProjectBlock[] }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);

  const items = buildToc(blocks, lang);
  const ids = items.map((item) => item.id);
  const active = useActiveHeading(ids);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Two headings do not justify a table of contents.
  if (items.length < 2) return null;

  return (
    <>
      {/* Desktop: sticky rail in the right column. */}
      <nav
        aria-label={t("project.toc")}
        className="no-print sticky top-[calc(var(--header-h)+1.5rem)] hidden max-h-[calc(100vh-var(--header-h)-4rem)] overflow-y-auto lg:block"
      >
        <p className="eyebrow mb-2.5 flex items-center gap-1.5">
          <List className="size-3.5" aria-hidden="true" />
          {t("project.toc")}
        </p>
        <TocLinks items={items} active={active} />
      </nav>

      {/* Mobile and tablet: floating button that opens a sheet. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="no-print btn btn-primary fixed bottom-5 right-4 z-40 shadow-pop lg:hidden"
      >
        <List className="size-4" aria-hidden="true" />
        {t("project.toc")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <nav
            aria-label={t("project.toc")}
            className="absolute inset-x-3 bottom-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-pop"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">{t("project.toc")}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-icon btn-sm"
                aria-label={t("common.close")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <TocLinks
              items={items}
              active={active}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </>
  );
}
