"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Check, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";

const FRAME_WIDTH = 320;

/**
 * Modal that lets the admin drag and zoom a picked image inside a fixed frame
 * before it uploads. Solves the "avatar centred on the wrong part of the face"
 * problem without needing a Supabase image transform.
 *
 * Positions are stored in frame-pixel coordinates: `translate` is where the
 * image's centre sits inside the frame. The scale multiplier is layered on top
 * of `s_min` (the cover-fit scale) so `scale = 1` always fills the frame edge
 * to edge, and dragging past that is clamped away.
 */
export function PhotoCropper({
  file,
  aspect,
  circle = false,
  outputWidth = 1024,
  onCancel,
  onConfirm,
}: {
  file: File;
  /** width / height of the crop frame. 1 for a square, 16/10 for a wide cover. */
  aspect: number;
  /** Draw the frame with a circular mask (avatars). Output is still a rectangle. */
  circle?: boolean;
  /** Longest edge of the produced blob, in pixels. Matches `maxWidth` upstream. */
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const frameW = FRAME_WIDTH;
  const frameH = FRAME_WIDTH / aspect;

  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(frameW / 2);
  const [ty, setTy] = useState(frameH / 2);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origTx: number;
    origTy: number;
  } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- the object
       URL is derived from `file` (an external resource) and its lifetime is
       tied to this effect, so it cannot be computed during render. */
    setObjectUrl(url);
    let cancelled = false;
    createImageBitmap(file).then((bmp) => {
      if (cancelled) {
        bmp.close();
        return;
      }
      setBitmap(bmp);
    });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // ESC closes; matches every other modal-style dialog on the site.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const clampTranslate = useCallback(
    (bmp: ImageBitmap, s: number, x: number, y: number) => {
      const dw = bmp.width * s;
      const dh = bmp.height * s;
      return {
        x: Math.max(frameW - dw / 2, Math.min(dw / 2, x)),
        y: Math.max(frameH - dh / 2, Math.min(dh / 2, y)),
      };
    },
    [frameW, frameH],
  );

  // A new bitmap re-centres and re-clamps at scale 1 — otherwise the previous
  // image's translate would apply to something a different size and the frame
  // would either show blank space or a random slice.
  useEffect(() => {
    if (!bitmap) return;
    /* eslint-disable react-hooks/set-state-in-effect -- resetting the view
       when the source image swaps is the whole point of this effect. */
    setScale(1);
    setTx(frameW / 2);
    setTy(frameH / 2);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [bitmap, frameW, frameH]);

  // Zoom out that would expose blank space is clamped back in.
  useEffect(() => {
    if (!bitmap) return;
    const sMin = Math.max(frameW / bitmap.width, frameH / bitmap.height);
    const s = sMin * scale;
    /* eslint-disable react-hooks/set-state-in-effect -- clamping the offset
       after a scale change is a reaction to zoom, not something computable
       inline. */
    setTx((prev) => clampTranslate(bitmap, s, prev, ty).x);
    setTy((prev) => clampTranslate(bitmap, s, tx, prev).y);
    /* eslint-enable react-hooks/set-state-in-effect */
    // tx/ty referenced above are captured for the initial pass; the setter
    // form re-reads the latest value, so this settles in one render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, bitmap]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!bitmap) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origTx: tx,
      origTy: ty,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!bitmap || !dragRef.current) return;
    const sMin = Math.max(frameW / bitmap.width, frameH / bitmap.height);
    const s = sMin * scale;
    const nx = dragRef.current.origTx + (event.clientX - dragRef.current.startX);
    const ny = dragRef.current.origTy + (event.clientY - dragRef.current.startY);
    const clamped = clampTranslate(bitmap, s, nx, ny);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  async function confirm() {
    if (!bitmap || saving) return;
    setSaving(true);
    try {
      const sMin = Math.max(frameW / bitmap.width, frameH / bitmap.height);
      const s = sMin * scale;
      // Frame origin (0,0) in image-natural coordinates:
      const sx = (bitmap.width * s) / 2 / s - tx / s;
      const sy = (bitmap.height * s) / 2 / s - ty / s;
      const sw = frameW / s;
      const sh = frameH / s;

      const outW = Math.min(outputWidth, Math.round(bitmap.width));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("캔버스를 사용할 수 없어 자를 수 없습니다.");
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error("이미지 변환에 실패했습니다.");
      onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  const sMin = bitmap
    ? Math.max(frameW / bitmap.width, frameH / bitmap.height)
    : 1;
  const s = sMin * scale;
  const displayW = bitmap ? bitmap.width * s : 0;
  const displayH = bitmap ? bitmap.height * s : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">사진 자르기</h2>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="닫기"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className="mx-auto touch-none select-none overflow-hidden border border-border bg-black"
          style={{
            width: frameW,
            height: frameH,
            borderRadius: circle ? "9999px" : "var(--radius-card)",
            position: "relative",
            cursor: bitmap ? "grab" : "default",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {bitmap && objectUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={objectUrl}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: tx - displayW / 2,
                top: ty - displayH / 2,
                width: displayW,
                height: displayH,
                maxWidth: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-fg-subtle">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ZoomOut className="size-3.5 text-fg-subtle" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            disabled={!bitmap}
            aria-label="확대"
            className="flex-1 accent-accent"
          />
          <ZoomIn className="size-3.5 text-fg-subtle" aria-hidden="true" />
        </div>

        <p className="mt-2 text-2xs text-fg-subtle">
          드래그로 위치를 조절하고, 슬라이더로 확대/축소하세요.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn btn-secondary btn-sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!bitmap || saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-3.5" aria-hidden="true" />
            )}
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
