"use client";

import { Languages, Mail, Moon, Sun } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export function LangToggle() {
  const { lang, toggleLang, t } = useApp();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="btn btn-ghost btn-sm gap-1.5 px-2"
      // The accessible name has to contain the visible "KO"/"EN" text, or
      // voice-control users cannot say what they see.
      aria-label={`${lang === "ko" ? "KO" : "EN"} — ${t("lang.toggle")}`}
      title={t("lang.toggle")}
    >
      <Languages className="size-4" aria-hidden="true" />
      <span className="text-xs font-bold tabular-nums">
        {lang === "ko" ? "KO" : "EN"}
      </span>
    </button>
  );
}

export function ThemeToggle() {
  const { toggleTheme, t } = useApp();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost btn-icon btn-sm"
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
    >
      {/* Both icons ship; CSS picks one so the button never flips after
          hydration. */}
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </button>
  );
}

export function MailButton({ email }: { email: string | null | undefined }) {
  const { t } = useApp();
  if (!email) return null;

  return (
    <a
      href={`mailto:${email}`}
      className="btn btn-ghost btn-icon btn-sm"
      aria-label={t("resume.contact")}
      title={email}
    >
      <Mail className="size-4" aria-hidden="true" />
    </a>
  );
}
