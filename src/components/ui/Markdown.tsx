import { Fragment, type ReactNode } from "react";

/**
 * Minimal markdown renderer for content authored in the admin page.
 *
 * Deliberately not `react-markdown`: the supported syntax is small and fixed,
 * and building React elements directly means no HTML is ever parsed, so a
 * pasted `<script>` renders as literal text instead of executing. It also keeps
 * roughly 40KB out of the bundle.
 *
 * Supported: `##`/`###` headings, `-`/`*` and `1.` lists, `>` quotes,
 * `**bold**`, `*italic*`, `` `code` ``, `[text](url)`, blank-line paragraphs.
 */

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_PATTERN).filter((part) => part !== "");

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="code-chip">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      // Only absolute http(s), mailto and in-page anchors — a `javascript:` URL
      // pasted into the admin must not become a live link.
      const safe = /^(https?:\/\/|mailto:|#|\/)/i.test(href);
      if (!safe) return <Fragment key={key}>{label}</Fragment>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Chunk =
  | { kind: "p"; lines: string[] }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "h"; level: 3 | 4; text: string };

function chunk(source: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (const raw of lines) {
    const line = raw.trimEnd();
    const last = chunks.at(-1);

    if (!line.trim()) {
      // A blank line closes whatever block was open.
      if (last) chunks.push({ kind: "p", lines: [] });
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      chunks.push({
        kind: "h",
        level: heading[1].length <= 3 ? 3 : 4,
        text: heading[2],
      });
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else chunks.push({ kind: "ul", items: [bullet[1]] });
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      if (last?.kind === "ol") last.items.push(ordered[1]);
      else chunks.push({ kind: "ol", items: [ordered[1]] });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      if (last?.kind === "quote") last.lines.push(quote[1]);
      else chunks.push({ kind: "quote", lines: [quote[1]] });
      continue;
    }

    if (last?.kind === "p" && last.lines.length) last.lines.push(line);
    else chunks.push({ kind: "p", lines: [line] });
  }

  return chunks.filter((c) => c.kind !== "p" || c.lines.length > 0);
}

export interface MarkdownProps {
  children: string | null | undefined;
  className?: string;
  /** Render a single paragraph without the wrapper — for card summaries. */
  inline?: boolean;
}

export function Markdown({ children, className, inline }: MarkdownProps) {
  const source = children?.trim();
  if (!source) return null;

  if (inline) return <>{renderInline(source, "i")}</>;

  return (
    <div className={className ?? "rich-text"}>
      {chunk(source).map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case "h":
            return block.level === 3 ? (
              <h3 key={key}>{renderInline(block.text, key)}</h3>
            ) : (
              <h4 key={key}>{renderInline(block.text, key)}</h4>
            );
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={key}>
                {renderInline(block.lines.join(" "), key)}
              </blockquote>
            );
          default:
            return <p key={key}>{renderInline(block.lines.join(" "), key)}</p>;
        }
      })}
    </div>
  );
}
