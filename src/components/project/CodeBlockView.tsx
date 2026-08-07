"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeBlockData } from "@/lib/types";

/**
 * No syntax highlighter on purpose — every option worth using either ships a
 * grammar bundle to the browser or has to run at build time, and blocks here are
 * also fetched client-side after mount. Snippets are short excerpts pointing at
 * GitHub, so a filename header and a copy button carry their weight instead.
 */
export function CodeBlockView({ data }: { data: CodeBlockData }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the code is selectable anyway */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="font-mono text-2xs text-fg-muted">
          {data.filename || data.language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="btn btn-ghost btn-sm ml-auto gap-1 px-1.5 py-0.5 text-2xs"
          aria-label="복사"
        >
          {copied ? (
            <Check className="size-3 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-3" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[0.8125rem] leading-relaxed">
        <code className="font-mono">{data.code}</code>
      </pre>
    </div>
  );
}
