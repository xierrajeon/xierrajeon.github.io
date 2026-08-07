"use client";

import { Globe, Mail, NotebookPen } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import {
  GithubIcon,
  LinkedinIcon,
  type IconComponent,
} from "@/components/ui/BrandIcons";
import { tr } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/url";
import type { Profile } from "@/lib/types";

const SOCIAL: {
  key: keyof Profile;
  label: string;
  Icon: IconComponent;
}[] = [
  { key: "github_url", label: "GitHub", Icon: GithubIcon },
  { key: "linkedin_url", label: "LinkedIn", Icon: LinkedinIcon },
  { key: "blog_url", label: "Blog", Icon: NotebookPen },
  { key: "website_url", label: "Website", Icon: Globe },
];

export function SiteFooter({
  profile,
  year,
}: {
  profile: Profile;
  /** Resolved at build time so the client never disagrees with the HTML. */
  year: number;
}) {
  const { lang, t } = useLang();
  const name = tr(profile.name_ko, profile.name_en, lang);
  const links = SOCIAL.map((s) => ({
    ...s,
    href: safeExternalUrl(profile[s.key] as string | null),
  })).filter((s) => s.href);

  return (
    <footer className="mt-16 sm:mt-20">
      <div className="container-page">
        {profile.email && (
          <section className="no-print overflow-hidden rounded-[var(--radius-card)] bg-invert-bg px-6 py-10 text-center sm:px-10 sm:py-14">
            <h2 className="text-xl font-bold text-invert-fg sm:text-2xl">
              {t("cta.title")}
            </h2>
            <p className="container-prose mt-3 text-sm leading-relaxed text-invert-fg-muted">
              {t("cta.body")}
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="btn btn-primary mt-6 px-5 py-2.5"
            >
              <Mail className="size-4" aria-hidden="true" />
              {t("cta.button")}
            </a>
          </section>
        )}

        <div className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
          {links.length > 0 && (
            <ul className="flex items-center gap-1">
              {links.map(({ key, label, Icon, href }) => (
                <li key={key}>
                  <a
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-fg-subtle sm:ml-auto">
            © {year} {name}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
