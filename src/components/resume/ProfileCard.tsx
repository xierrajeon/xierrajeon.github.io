"use client";

import {
  Download,
  Globe,
  Heart,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useLang } from "@/components/providers/AppProviders";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import { tr, translate } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/url";
import { useLikes } from "@/lib/useLikes";
import type { Profile } from "@/lib/types";

type IconComp = ComponentType<SVGProps<SVGSVGElement>>;

interface ContactSlot {
  key: string;
  label: string;
  value: string;
  href: string;
  Icon: IconComp;
  external?: boolean;
}

export function ProfileCard({
  profile,
  /** The resume tab offers the PDF export; the portfolio tab does not. */
  showPrint = false,
}: {
  profile: Profile;
  showPrint?: boolean;
}) {
  const { lang } = useLang();

  const nameKo = profile.name_ko.trim();
  const nameEn = profile.name_en.trim();
  const status = tr(profile.status_ko, profile.status_en, lang);
  const tagline = tr(profile.tagline_ko, profile.tagline_en, lang);
  const bio = tr(profile.bio_ko, profile.bio_en, lang);

  const displayName =
    lang === "ko" && nameKo && nameEn ? nameKo : tr(nameKo, nameEn, lang);
  const secondaryName = lang === "ko" && nameKo && nameEn ? nameEn : "";

  const email = profile.email?.trim() || null;
  const phone = profile.phone?.trim() || null;
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const contactSlots = buildContactSlots(profile, lang);
  const likes = useLikes(0);

  return (
    <section className="card p-5 sm:p-8">
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Left column — photo + status + primary actions. gap-7 so the
            buttons never touch the photo even when the status pill is
            missing (which removes one row from this stack). */}
        <div className="flex w-full flex-col items-center gap-7 lg:w-auto lg:shrink-0">
          <PhotoFrame
            src={profile.photo_url}
            alt={displayName || "profile"}
            onLike={likes.like}
            liked={likes.hasLiked}
            pending={likes.pending}
            likeAria={translate(lang, "profile.likeAria")}
          />

          {status && (
            <span className="status-pill-lg">
              {profile.status_active && (
                <span className="status-dot" aria-hidden="true" />
              )}
              {status}
            </span>
          )}

          <div className="flex w-full flex-col gap-2 sm:w-64">
            {email && (
              <a href={`mailto:${email}`} className="btn btn-primary btn-lg">
                <Mail className="size-4" aria-hidden="true" />
                {translate(lang, "profile.contactMe")}
              </a>
            )}
            {showPrint && (
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-lg no-print"
              >
                <Download className="size-4" aria-hidden="true" />
                {translate(lang, "profile.downloadResume")}
              </button>
            )}
          </div>
        </div>

        {/* Right column — name, bio, contact cards, likes */}
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <div className="flex flex-col items-center gap-1.5 lg:items-start">
            <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-3xl font-bold sm:text-4xl lg:justify-start">
              <span>{displayName}</span>
              {secondaryName && (
                <span className="text-xl font-medium text-fg-subtle sm:text-2xl">
                  ({secondaryName})
                </span>
              )}
            </h1>

            {tagline && (
              <p className="text-base font-semibold text-accent sm:text-lg">
                {tagline}
              </p>
            )}
          </div>

          {bio && (
            <Markdown className="rich-text mt-4 text-left">{bio}</Markdown>
          )}

          {(contactSlots.length > 0 || phone || email) && (
            <>
              <hr className="divider my-6" />
              <ul
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                aria-label={translate(lang, "resume.contact")}
              >
                {email && (
                  <ContactCard
                    href={`mailto:${email}`}
                    label={translate(lang, "profile.email")}
                    value={email}
                    Icon={Mail}
                  />
                )}
                {phone && telHref && (
                  <ContactCard
                    href={telHref}
                    label={translate(lang, "profile.phone")}
                    value={phone}
                    Icon={Phone}
                  />
                )}
                {contactSlots.map((slot) => (
                  <ContactCard
                    key={slot.key}
                    href={slot.href}
                    label={slot.label}
                    value={slot.value}
                    Icon={slot.Icon}
                    external={slot.external}
                  />
                ))}
              </ul>
            </>
          )}

          <div className="mt-5 flex justify-center lg:justify-start">
            <p className="likes-count no-print" aria-live="polite">
              <Heart className="size-4" aria-hidden="true" />
              <strong>{likes.count.toLocaleString()}</strong>
              <span>{translate(lang, "profile.likes")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function PhotoFrame({
  src,
  alt,
  onLike,
  liked,
  pending,
  likeAria,
}: {
  src: string | null;
  alt: string;
  onLike: () => void;
  liked: boolean;
  pending: boolean;
  likeAria: string;
}) {
  return (
    <div className="profile-photo-frame">
      {/* Ambient blurred blobs behind the photo. */}
      <span className="profile-decor-blob" aria-hidden="true" />

      {/* Dotted grid at the top-left, exactly like the reference. */}
      <span className="profile-decor-dots" aria-hidden="true" />

      {/* Orbital rings around the photo — two tilted ellipses. */}
      <svg
        className="profile-decor-ring"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <ellipse
          cx="100"
          cy="100"
          rx="94"
          ry="88"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          transform="rotate(-18 100 100)"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="90"
          ry="82"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="2 4"
          transform="rotate(24 100 100)"
        />
      </svg>

      {/* Two small sparkles at fixed anchor points. */}
      <Sparkles
        className="profile-decor-sparkle"
        style={{
          top: "0.5rem",
          right: "0.25rem",
          width: "1.5rem",
          height: "1.5rem",
        }}
        aria-hidden="true"
      />
      <Sparkles
        className="profile-decor-sparkle"
        style={{
          bottom: "3.5rem",
          left: "-0.25rem",
          width: "1rem",
          height: "1rem",
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      {src ? (
        <SmartImage
          src={src}
          alt={alt}
          width={288}
          height={288}
          priority
          className="profile-photo-image"
        />
      ) : (
        <div
          className="profile-photo-image flex items-center justify-center"
          aria-hidden="true"
        >
          <User className="size-14 text-accent" />
        </div>
      )}

      <button
        type="button"
        onClick={onLike}
        disabled={liked || pending}
        aria-label={likeAria}
        aria-pressed={liked}
        className="heart-button no-print"
        data-liked={liked ? "true" : "false"}
      >
        <Heart
          className="size-5"
          fill={liked ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function ContactCard({
  href,
  label,
  value,
  Icon,
  external = false,
}: {
  href: string;
  label: string;
  value: string;
  Icon: IconComp;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        className="contact-card"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span className="contact-card-icon" aria-hidden="true">
          <Icon className="size-5" />
        </span>
        <span className="contact-card-label">{label}</span>
        <span className="contact-card-value">{value}</span>
      </a>
    </li>
  );
}

/* -------------------------------------------------------------------------- */

function buildContactSlots(profile: Profile, lang: "ko" | "en"): ContactSlot[] {
  const slots: ContactSlot[] = [];

  const github = safeExternalUrl(profile.github_url);
  if (github) {
    slots.push({
      key: "github",
      label: "GitHub",
      value: extractHandle(github, "github") ?? "GitHub",
      href: github,
      Icon: GithubIcon,
      external: true,
    });
  }

  const linkedin = safeExternalUrl(profile.linkedin_url);
  if (linkedin) {
    slots.push({
      key: "linkedin",
      label: "LinkedIn",
      value: extractHandle(linkedin, "linkedin") ?? "LinkedIn",
      href: linkedin,
      Icon: LinkedinIcon,
      external: true,
    });
  }

  const website = safeExternalUrl(profile.website_url);
  if (website) {
    slots.push({
      key: "website",
      label: lang === "ko" ? "웹사이트" : "Website",
      value: extractHandle(website, "website") ?? website,
      href: website,
      Icon: Globe,
      external: true,
    });
  }

  return slots;
}

function extractHandle(
  url: string,
  kind: "github" | "linkedin" | "website",
): string | null {
  try {
    const parsed = new URL(url);
    if (kind === "website") {
      return parsed.host.replace(/^www\./, "");
    }
    if (kind === "linkedin") {
      // /in/xxx or /company/xxx
      const match = /^\/(?:in|company|pub)\/([^/]+)\/?/.exec(parsed.pathname);
      if (match) return decodeURIComponent(match[1]);
    }
    // github and fallback: first path segment
    const first = parsed.pathname.split("/").filter(Boolean)[0];
    return first ? decodeURIComponent(first) : null;
  } catch {
    return null;
  }
}
