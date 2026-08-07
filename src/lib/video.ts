import type { VideoProvider } from "./types";

/** Accepts watch, embed, shorts and youtu.be forms. */
export function youtubeId(url: string): string | null {
  const match =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(
      url,
    );
  return match?.[1] ?? null;
}

export function vimeoId(url: string): string | null {
  const match = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  return match?.[1] ?? null;
}

/** Detects the provider from a pasted URL so the admin does not have to pick. */
export function detectProvider(url: string): VideoProvider {
  if (youtubeId(url)) return "youtube";
  if (vimeoId(url)) return "vimeo";
  return "file";
}

export function embedUrl(provider: VideoProvider, url: string): string | null {
  if (provider === "youtube") {
    const id = youtubeId(url);
    // `autoplay=1` is safe here: the iframe is only created after a click.
    return id
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
      : null;
  }
  if (provider === "vimeo") {
    const id = vimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
  }
  return null;
}

/** Fallback poster when the admin did not upload one. */
export function defaultPoster(
  provider: VideoProvider,
  url: string,
): string | null {
  if (provider !== "youtube") return null;
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
