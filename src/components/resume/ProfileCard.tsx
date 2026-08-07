"use client";

import { Globe, Mail, MapPin, NotebookPen, Phone, Printer, User } from "lucide-react";
import { useLang } from "@/components/providers/AppProviders";
import {
  GithubIcon,
  LinkedinIcon,
  type IconComponent,
} from "@/components/ui/BrandIcons";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import { tr } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/url";
import type { Profile } from "@/lib/types";

/**
 * Social links stay icon-only — the addresses (github.com/xxx, linkedin.com/in/xxx)
 * would repeat information already conveyed by the logo and get long enough to
 * wrap awkwardly on mobile.
 */
const SOCIAL_LINKS: {
  key: keyof Profile;
  label: string;
  Icon: IconComponent;
}[] = [
  { key: "github_url", label: "GitHub", Icon: GithubIcon },
  { key: "linkedin_url", label: "LinkedIn", Icon: LinkedinIcon },
  { key: "blog_url", label: "Blog", Icon: NotebookPen },
  { key: "website_url", label: "Website", Icon: Globe },
];

export function ProfileCard({
  profile,
  /** The resume tab offers a print action; the portfolio tab does not. */
  showPrint = false,
}: {
  profile: Profile;
  showPrint?: boolean;
}) {
  const { lang, t } = useLang();

  const nameKo = profile.name_ko.trim();
  const nameEn = profile.name_en.trim();
  const status = tr(profile.status_ko, profile.status_en, lang);
  const tagline = tr(profile.tagline_ko, profile.tagline_en, lang);
  const bio = tr(profile.bio_ko, profile.bio_en, lang);
  const location = tr(profile.location_ko, profile.location_en, lang);

  // Korean resumes conventionally show both spellings; English mode does not
  // need the Korean name repeated back.
  const displayName =
    lang === "ko" && nameKo && nameEn ? `${nameKo} (${nameEn})` : tr(nameKo, nameEn, lang);

  return (
    <section className="card p-5 sm:p-7">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-7 sm:text-left">
        <div className="shrink-0">
          {profile.photo_url ? (
            <SmartImage
              src={profile.photo_url}
              alt={displayName}
              width={144}
              height={144}
              priority
              className="size-28 rounded-full object-cover ring-2 ring-border sm:size-36"
            />
          ) : (
            <div
              className="flex size-28 items-center justify-center rounded-full bg-accent-soft ring-2 ring-border sm:size-36"
              aria-hidden="true"
            >
              <User className="size-10 text-accent sm:size-12" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {status && (
            <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
              {profile.status_active && (
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-hidden="true"
                />
              )}
              {status}
            </p>
          )}

          <h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>

          {tagline && (
            <p className="mt-1.5 text-sm font-semibold text-accent sm:text-base">
              {tagline}
            </p>
          )}

          <ContactRows profile={profile} location={location} />

          {bio && <Markdown className="rich-text mt-3">{bio}</Markdown>}
        </div>

        {showPrint && (
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm no-print shrink-0 self-center sm:self-start"
          >
            <Printer className="size-4" aria-hidden="true" />
            {t("resume.print")}
          </button>
        )}
      </div>
    </section>
  );
}

function ContactRows({
  profile,
  location,
}: {
  profile: Profile;
  location: string;
}) {
  const email = profile.email?.trim() || null;
  const phone = profile.phone?.trim() || null;
  // Strip spaces/hyphens for the tel: URI while keeping the leading `+`.
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const socials = SOCIAL_LINKS.flatMap(({ key, label, Icon }) => {
    const href = safeExternalUrl(profile[key] as string | null | undefined);
    return href ? [{ key, label, Icon, href }] : [];
  });

  if (!location && !email && !phone && socials.length === 0) return null;

  const hasContact = email || (phone && telHref);

  return (
    <div className="mt-3 flex flex-col items-center gap-2 sm:items-start">
      {hasContact && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-fg-subtle sm:justify-start">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 hover:text-accent"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              {email}
            </a>
          )}
          {phone && telHref && (
            <a
              href={telHref}
              className="flex items-center gap-1 hover:text-accent"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {phone}
            </a>
          )}
        </div>
      )}
      {location && (
        <p className="flex items-center gap-1 text-xs text-fg-subtle">
          <MapPin className="size-3.5" aria-hidden="true" />
          {location}
        </p>
      )}
      {socials.length > 0 && (
        <ul className="mt-1 flex flex-wrap items-center gap-1">
          {socials.map(({ key, label, Icon, href }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={label}
                title={label}
                className="btn btn-ghost btn-icon btn-sm"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
