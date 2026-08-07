"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { describeError } from "@/lib/admin/useSaver";
import { deleteMedia, uploadMedia } from "@/lib/admin/upload";
import { PhotoCropper } from "./PhotoCropper";

/** Formats we can decode into a canvas — SVG/GIF/AVIF are shipped as-is. */
const CROPPABLE = /^image\/(jpe?g|png|webp|heic|heif|bmp)$/i;

export interface ImageValue {
  url: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Drop or pick an image; it is downscaled to WebP and uploaded, and the
 * resulting dimensions come back with the URL so the public page can reserve
 * space for it.
 */
export function ImageUploader({
  label,
  hint,
  value,
  onChange,
  folder = "media",
  maxWidth,
  aspect = "aspect-[16/10]",
  circle = false,
  cropAspect,
}: {
  label: string;
  hint?: string;
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  folder?: string;
  maxWidth?: number;
  /** Tailwind aspect class for the preview box. */
  aspect?: string;
  circle?: boolean;
  /**
   * When set, opens a crop step before upload with this width/height ratio.
   * Circular masks share the shape via `circle` above; the underlying canvas
   * is still a rectangle since object-cover on the display side does the
   * rounding.
   */
  cropAspect?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cropping, setCropping] = useState<File | null>(null);

  async function upload(source: Blob, name: string) {
    setBusy(true);
    setError(null);
    try {
      // `uploadMedia` takes a File so the storage key gets a sensible name.
      // Cropped blobs come back as WebP, so we mirror that in the filename.
      const asFile =
        source instanceof File
          ? source
          : new File([source], name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            });
      const uploaded = await uploadMedia(asFile, { folder, maxWidth });
      onChange({
        url: uploaded.url,
        width: uploaded.width,
        height: uploaded.height,
      });
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있습니다.");
      return;
    }
    setError(null);
    if (cropAspect && CROPPABLE.test(file.type)) {
      setCropping(file);
      return;
    }
    void upload(file, file.name);
  }

  async function remove() {
    const previous = value.url;
    onChange({ url: null, width: null, height: null });
    if (previous) await deleteMedia(previous);
  }

  return (
    <div className="field">
      <span className="label">{label}</span>

      {value.url ? (
        <div className="flex items-start gap-3">
          <SmartImage
            src={value.url}
            alt=""
            className={`${circle ? "size-20 rounded-full" : `w-32 ${aspect} rounded-lg`} border border-border object-cover`}
          />
          <div className="flex flex-col gap-1.5">
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
              교체
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="btn btn-danger btn-sm"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              삭제
            </button>
            {value.width && value.height ? (
              <p className="text-2xs text-fg-subtle">
                {value.width}×{value.height}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
          disabled={busy}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center transition-colors ${
            dragging
              ? "border-accent bg-accent-soft"
              : "border-border-strong hover:border-accent hover:bg-surface-hover"
          }`}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-accent" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-5 text-fg-subtle" aria-hidden="true" />
          )}
          <span className="text-xs font-medium">
            {busy ? "업로드 중…" : "클릭하거나 이미지를 끌어다 놓으세요"}
          </span>
          <span className="text-2xs text-fg-subtle">
            자동으로 WebP로 변환·축소됩니다
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {error && <p className="text-2xs text-danger">{error}</p>}
      {hint && <p className="text-2xs text-fg-subtle">{hint}</p>}

      {cropping && cropAspect && (
        <PhotoCropper
          file={cropping}
          aspect={cropAspect}
          circle={circle}
          outputWidth={maxWidth}
          onCancel={() => setCropping(null)}
          onConfirm={(blob) => {
            const name = cropping.name;
            setCropping(null);
            void upload(blob, name);
          }}
        />
      )}
    </div>
  );
}
