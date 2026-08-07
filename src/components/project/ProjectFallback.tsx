"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/providers/AppProviders";
import { ProjectDetailView } from "./ProjectDetailView";
import { isSupabaseConfigured } from "@/lib/env";
import { routes } from "@/lib/site";
import type { ProjectWithBlocks } from "@/lib/types";

/**
 * Rescues project URLs that have no pre-rendered file yet.
 *
 * GitHub Pages answers any unknown path with 404.html, which is this component.
 * A project published in the admin page five minutes ago exists in the database
 * but not on disk, so instead of showing a dead end we look the slug up and
 * render it client-side. The next deploy bakes the real page.
 */
function slugFromPath(pathname: string): string | null {
  const match = /^\/projects\/([^/]+)\/?$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

type State =
  | { status: "checking" }
  | { status: "found"; project: ProjectWithBlocks }
  | { status: "missing" };

export function ProjectFallback() {
  const { t } = useLang();
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    const slug = slugFromPath(window.location.pathname);
    if (!slug || !isSupabaseConfigured) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- the URL
         is only knowable in the browser, and 404.html is pre-rendered as the
         skeleton, so this first correction has to happen after mount. */
      setState({ status: "missing" });
      return;
    }

    let cancelled = false;
    import("@/lib/queries")
      .then((m) => m.getProjectBySlug(slug))
      .then((project) => {
        if (cancelled) return;
        setState(project ? { status: "found", project } : { status: "missing" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "missing" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "checking") {
    return (
      <div className="container-page">
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="skeleton h-40 w-full sm:h-56" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-64 w-full" />
          <p className="sr-only">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (state.status === "found") {
    return <ProjectDetailView initial={state.project} />;
  }

  return (
    <div className="container-page">
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-5xl font-bold text-border-strong">404</p>
        <h1 className="text-lg font-bold">{t("notFound.title")}</h1>
        <p className="text-sm text-fg-muted">{t("notFound.body")}</p>
        <Link href={routes.resume} className="btn btn-primary mt-2">
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}
