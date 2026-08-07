"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { TextInput } from "./Field";
import { describeError } from "@/lib/admin/useSaver";
import { deleteMedia, uploadMedia } from "@/lib/admin/upload";
import { detectProvider } from "@/lib/video";
import type { VideoProvider } from "@/lib/types";

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  file: "직접 업로드한 파일",
};

/**
 * Two ways to attach a video, because the free tier makes the choice matter:
 * pasting a YouTube/Vimeo link costs nothing, while an uploaded file eats the
 * 1GB storage and 5GB monthly egress. The provider is inferred from the URL so
 * there is no extra field to get wrong.
 */
export function VideoField({
  url,
  onChange,
  label = "영상",
}: {
  url: string;
  onChange: (url: string, provider: VideoProvider) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = url ? detectProvider(url) : null;
  const isUpload = provider === "file" && url.includes("/storage/v1/object/");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("영상 파일만 올릴 수 있습니다.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("25MB를 넘습니다. 긴 영상은 유튜브에 올리고 링크를 붙여주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(file, { folder: "video" });
      onChange(uploaded.url, "file");
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>

      <TextInput
        value={url}
        onChange={(value) => onChange(value, value ? detectProvider(value) : "file")}
        placeholder="https://youtu.be/... 또는 아래에서 파일 업로드"
        aria-label={`${label} URL`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-secondary btn-sm"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-3.5" aria-hidden="true" />
          )}
          파일 업로드
        </button>

        {isUpload && (
          <button
            type="button"
            onClick={async () => {
              const previous = url;
              onChange("", "file");
              await deleteMedia(previous);
            }}
            className="btn btn-danger btn-sm"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            파일 삭제
          </button>
        )}

        {provider && url && (
          <span className="tag">
            <Film className="size-3" aria-hidden="true" />
            {PROVIDER_LABEL[provider]}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {error && <p className="text-2xs text-danger">{error}</p>}
      <p className="text-2xs text-fg-subtle">
        유튜브 링크는 용량을 쓰지 않고, 클릭할 때까지 플레이어를 불러오지 않아
        페이지가 빠릅니다. 직접 업로드는 짧은 시연 클립(25MB 이하)에만 쓰세요.
      </p>
    </div>
  );
}
