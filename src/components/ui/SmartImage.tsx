/* eslint-disable @next/next/no-img-element -- see note below */

/**
 * Plain `<img>` rather than `next/image`.
 *
 * `output: "export"` disables the Image Optimization API, so `next/image` would
 * emit the same single-source `<img>` while additionally requiring every
 * Supabase host to be whitelisted in next.config. Sizing is handled where it
 * actually matters instead: the admin uploader downscales and re-encodes to
 * WebP in the browser, and intrinsic dimensions are stored alongside each image
 * so space is reserved before it loads (no layout shift).
 */
export interface SmartImageProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  className?: string;
  /** Set on the one image that is likely the largest element above the fold. */
  priority?: boolean;
  sizes?: string;
}

export function SmartImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: SmartImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
    />
  );
}
