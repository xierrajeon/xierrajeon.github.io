"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { defaultPoster, embedUrl } from "@/lib/video";
import type { VideoBlockData } from "@/lib/types";

/**
 * Third-party players are loaded behind a click.
 *
 * A YouTube iframe pulls in roughly a megabyte of script before the visitor has
 * decided to watch anything, which is the single easiest way to lose a
 * Lighthouse performance score. Showing the poster and only mounting the iframe
 * on click costs one extra tap and nothing else.
 */
export function VideoEmbed({
  data,
  title,
}: {
  data: VideoBlockData;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!data.url) return null;

  // Self-hosted clips are cheap, so they render directly.
  if (data.provider === "file") {
    return (
      <video
        className="w-full rounded-xl border border-border bg-black"
        src={data.url}
        poster={data.poster_url ?? undefined}
        controls
        playsInline
        muted={data.autoplay}
        autoPlay={data.autoplay}
        loop={data.loop}
        preload={data.autoplay ? "auto" : "metadata"}
      />
    );
  }

  const src = embedUrl(data.provider, data.url);
  if (!src) return null;

  const poster = data.poster_url ?? defaultPoster(data.provider, data.url);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-border bg-black"
        aria-label={`${title} — 재생`}
      >
        {poster && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={poster}
            alt=""
            className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="size-7 fill-white pl-0.5 text-white" aria-hidden="true" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      <iframe
        src={src}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
