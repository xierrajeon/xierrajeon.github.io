import type { CSSProperties } from "react";

/**
 * Stack tags are coloured by hue only. `.tag-tech` in globals.css derives its
 * background and text from `--tag-h`, so contrast and dark-mode handling stay
 * in one place and any new tag gets a usable colour without a code change.
 */

/** Hues for technologies whose brand colour people already expect. */
const KNOWN_HUES: Record<string, number> = {
  // blues
  react: 232,
  typescript: 258,
  "next.js": 262,
  nextjs: 262,
  tailwind: 205,
  "tailwind css": 205,
  css: 240,
  docker: 230,
  postgresql: 245,
  postgres: 245,
  supabase: 155,
  // greens
  "node.js": 140,
  nodejs: 140,
  node: 140,
  vue: 158,
  spring: 140,
  mongodb: 145,
  vitest: 120,
  // yellows / oranges
  javascript: 92,
  python: 85,
  aws: 60,
  firebase: 75,
  swift: 40,
  html: 45,
  git: 35,
  // reds / pinks
  "socket.io": 340,
  redis: 25,
  graphql: 340,
  ruby: 20,
  // purples
  zustand: 300,
  redux: 295,
  kotlin: 285,
  flutter: 220,
  java: 20,
  go: 200,
  rust: 30,
  kubernetes: 250,
  "github actions": 270,
  figma: 350,
};

/** Deterministic hue for anything not in the map — stable across renders. */
function hashHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  // Skip 95–125 (muddy yellow-greens at this lightness) by compressing into a
  // range that reads cleanly, then rotating.
  return (hash * 7) % 360;
}

export function tagHue(tag: string): number {
  const key = tag.trim().toLowerCase();
  return KNOWN_HUES[key] ?? hashHue(key);
}

/** Spread onto a `.tag .tag-tech` element. */
export function tagStyle(tag: string): CSSProperties {
  return { "--tag-h": tagHue(tag) } as CSSProperties;
}
