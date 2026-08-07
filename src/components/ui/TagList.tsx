import { tagStyle } from "@/lib/tagColor";
import { TechIcon } from "./TechIcon";

export interface TagListProps {
  tags: string[] | null | undefined;
  /** `tech` colours each tag by technology; `plain` keeps them neutral. */
  variant?: "tech" | "plain";
  /** Show at most this many, then a "+N" chip. */
  max?: number;
  className?: string;
}

export function TagList({
  tags,
  variant = "tech",
  max,
  className,
}: TagListProps) {
  if (!tags?.length) return null;

  const shown = max ? tags.slice(0, max) : tags;
  const hidden = max ? tags.length - shown.length : 0;

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {shown.map((tag) => (
        <li key={tag}>
          <span
            className={variant === "tech" ? "tag tag-tech" : "tag"}
            style={variant === "tech" ? tagStyle(tag) : undefined}
          >
            {variant === "tech" && <TechIcon tag={tag} />}
            {tag}
          </span>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <span className="tag">+{hidden}</span>
        </li>
      )}
    </ul>
  );
}

/** "✓ 페이지 로딩 속도 40% 개선" — measurable outcomes under a timeline row. */
export function HighlightList({
  items,
  className,
}: {
  items: string[] | null | undefined;
  className?: string;
}) {
  if (!items?.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {items.map((item) => (
        <li key={item} className="highlight-chip">
          {item}
        </li>
      ))}
    </ul>
  );
}
