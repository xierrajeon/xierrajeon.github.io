"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { tagStyle } from "@/lib/tagColor";

/**
 * Chip input for stack tags and achievement highlights. Commits on Enter or
 * comma; Backspace in an empty box removes the last chip.
 */
export function TagInput({
  label,
  hint,
  value,
  onChange,
  placeholder = "입력 후 Enter",
  colored = true,
  suggestions = [],
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  colored?: boolean;
  /** Tags already used elsewhere, offered as one-tap adds. */
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = raw.trim().replace(/,$/, "");
    if (!tag) return;
    // Case-insensitive dedupe: "React" and "react" are the same tag.
    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  const unused = suggestions.filter(
    (tag) => !value.some((existing) => existing.toLowerCase() === tag.toLowerCase()),
  );

  return (
    <div className="field">
      <span className="label">{label}</span>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2">
        {value.map((tag, index) => (
          <span
            key={tag}
            className={colored ? "tag tag-tech pr-1" : "tag pr-1"}
            style={colored ? tagStyle(tag) : undefined}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="rounded hover:opacity-70"
              aria-label={`${tag} 제거`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={placeholder}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
          aria-label={label}
        />
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unused.slice(0, 12).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="tag tag-button text-2xs"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-2xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
