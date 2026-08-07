"use client";

import { MEDIA_BUCKET, getSupabaseBrowser } from "@/lib/supabase";

export interface UploadedMedia {
  url: string;
  path: string;
  width: number | null;
  height: number | null;
}

/** Supabase image transformations are a paid feature, so resizing happens here. */
const DEFAULT_MAX_WIDTH = 1800;
const WEBP_QUALITY = 0.82;

/** Formats that must be uploaded untouched: vectors, and anything animated. */
const PASSTHROUGH = /^image\/(svg\+xml|gif|avif)$/;

function extensionFor(type: string, fallback: string): string {
  const map: Record<string, string> = {
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return map[type] ?? fallback;
}

function safeStem(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      // Storage keys are URLs; keep them boringly ASCII.
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file"
  );
}

function uniquePath(folder: string, name: string, ext: string): string {
  const stamp = Date.now().toString(36);
  const salt = Math.random().toString(36).slice(2, 7);
  return `${folder}/${stamp}-${salt}-${safeStem(name)}.${ext}`;
}

/**
 * Downscales and re-encodes an image to WebP in the browser.
 *
 * A 4MB phone photo dropped straight into Storage would blow through the free
 * tier's egress and wreck Largest Contentful Paint, and the free tier has no
 * server-side transform to lean on — so the work happens before upload, once.
 */
async function compressImage(
  file: File,
  maxWidth: number,
): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("캔버스를 사용할 수 없어 이미지를 변환하지 못했습니다.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!blob) throw new Error("이미지 변환에 실패했습니다.");

  return { blob, width, height, ext: "webp" };
}

async function probeSize(
  file: File,
): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

export interface UploadOptions {
  /** Storage folder, e.g. "profile" or "projects". */
  folder?: string;
  maxWidth?: number;
}

export async function uploadMedia(
  file: File,
  { folder = "media", maxWidth = DEFAULT_MAX_WIDTH }: UploadOptions = {},
): Promise<UploadedMedia> {
  const supabase = getSupabaseBrowser();
  const isImage = file.type.startsWith("image/");
  const recompress = isImage && !PASSTHROUGH.test(file.type);

  let body: Blob = file;
  let ext = extensionFor(file.type, file.name.split(".").pop() ?? "bin");
  let width: number | null = null;
  let height: number | null = null;

  if (recompress) {
    const result = await compressImage(file, maxWidth);
    body = result.blob;
    ext = result.ext;
    width = result.width;
    height = result.height;
  } else if (isImage) {
    ({ width, height } = await probeSize(file));
  }

  const path = uniquePath(folder, file.name, ext);

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, {
      cacheControl: "31536000",
      contentType: recompress ? "image/webp" : file.type || undefined,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, width, height };
}

/** Best-effort cleanup. A failure here is not worth blocking the edit on. */
export async function deleteMedia(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  try {
    await getSupabaseBrowser().storage.from(MEDIA_BUCKET).remove([path]);
  } catch {
    /* orphaned object; harmless */
  }
}
