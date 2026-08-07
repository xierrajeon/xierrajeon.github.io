"use client";

import Link from "next/link";
import { Code2 } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import { LangToggle, MailButton, ThemeToggle } from "./HeaderActions";
import { TabNav } from "./TabNav";
import { tr } from "@/lib/i18n";
import { routes } from "@/lib/site";
import type { Profile } from "@/lib/types";

/**
 * Sticky header. The tab switcher is optically centred on desktop and drops to
 * its own full-width row below 768px, where three columns cannot coexist
 * without the name truncating to nothing.
 */
export function SiteHeader({ profile }: { profile: Profile }) {
  const { lang, t } = useLang();
  const name = tr(profile.name_ko, profile.name_en, lang);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <a href="#main" className="sr-only-focusable btn btn-primary btn-sm m-2">
        {t("nav.skipToContent")}
      </a>

      <div className="container-page">
        <div className="relative flex h-14 items-center gap-2">
          <Link
            href={routes.resume}
            className="flex min-w-0 items-center gap-1.5 text-base font-bold tracking-tight"
          >
            <Code2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate">{name}</span>
          </Link>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
            <TabNav className="pointer-events-auto" />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <LangToggle />
            <ThemeToggle />
            <MailButton email={profile.email} />
          </div>
        </div>

        <div className="pb-2 md:hidden">
          <TabNav className="w-full" />
        </div>
      </div>
    </header>
  );
}
