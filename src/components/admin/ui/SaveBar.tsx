"use client";

import { Check, Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { SaveStatus } from "@/lib/admin/useSaver";

export function StatusText({
  status,
  error,
  dirty,
}: {
  status: SaveStatus;
  error?: string | null;
  dirty?: boolean;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        저장 중…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-start gap-1.5 text-xs text-danger">
        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {error ?? "저장에 실패했습니다."}
      </span>
    );
  }
  if (status === "saved" && !dirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-success">
        <Check className="size-3.5" aria-hidden="true" />
        저장됨 · 사이트에 바로 반영됩니다
      </span>
    );
  }
  if (dirty) {
    return <span className="text-xs text-warn">저장하지 않은 변경이 있습니다</span>;
  }
  return null;
}

/**
 * Sticky action bar. Pinned to the bottom of the viewport so the save button is
 * reachable from anywhere in a long form on a phone.
 */
export function SaveBar({
  status,
  error,
  dirty,
  onSave,
  children,
  saveLabel = "저장",
}: {
  status: SaveStatus;
  error?: string | null;
  dirty?: boolean;
  onSave: () => void;
  children?: ReactNode;
  saveLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={status === "saving"}
          className="btn btn-primary"
        >
          {status === "saving" && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {saveLabel}
        </button>
        {children}
        <div className="ml-auto min-w-0">
          <StatusText status={status} error={error} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
