"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/providers/AppProviders";
import { routes } from "@/lib/site";
import type { DictKey } from "@/lib/i18n";

const TABS: { href: string; key: DictKey; koSuffix: string }[] = [
  { href: routes.resume, key: "nav.resume", koSuffix: "서 (CV)" },
  { href: routes.portfolio, key: "nav.portfolio", koSuffix: "" },
];

/** `trailingSlash: true` means paths arrive as "/portfolio/". */
function normalize(path: string): string {
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

export function TabNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { lang, t } = useLang();
  const current = normalize(pathname);

  return (
    <nav
      aria-label={t("nav.menu")}
      className={`flex items-center gap-1 rounded-xl border border-border bg-surface-sunken p-1 ${className ?? ""}`}
    >
      {TABS.map((tab) => {
        // A project detail page still belongs to the portfolio tab.
        const active =
          tab.href === routes.resume
            ? current === "/"
            : current === tab.href || current.startsWith("/projects");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-1.5 text-center text-sm font-semibold transition-colors duration-150 sm:flex-none ${
              active
                ? "bg-surface text-accent shadow-subtle"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            {t(tab.key)}
            {lang === "ko" ? tab.koSuffix : ""}
          </Link>
        );
      })}
    </nav>
  );
}
