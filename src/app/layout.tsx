import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { SUPABASE_URL } from "@/lib/env";
import { getProfile } from "@/lib/queries.server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Applies the stored theme and language before first paint. Without this the
 * page would render light/Korean and then snap, which reads as a bug.
 */
const bootScript = `(function(){try{
var t=localStorage.getItem('xj-theme');
var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
if(dark)document.documentElement.classList.add('dark');
var l=localStorage.getItem('xj-lang');
if(l==='en'||l==='ko')document.documentElement.lang=l;
}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = profile.name_ko || profile.name_en || "Portfolio";
  const nameEn = profile.name_en || profile.name_ko;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} | 개발자 이력서 · 포트폴리오`,
      template: `%s | ${name}`,
    },
    description: profile.tagline_ko || profile.tagline_en || undefined,
    applicationName: `${nameEn} Portfolio`,
    authors: [{ name: nameEn, url: profile.github_url ?? SITE_URL }],
    creator: nameEn,
    keywords: [
      name,
      nameEn,
      "개발자 이력서",
      "포트폴리오",
      "developer portfolio",
      "resume",
    ],
    alternates: {
      canonical: "/",
      languages: { ko: "/", en: "/" },
    },
    openGraph: {
      type: "profile",
      siteName: `${name} Portfolio`,
      locale: "ko_KR",
      alternateLocale: "en_US",
      url: SITE_URL,
      title: `${name} | 개발자 이력서 · 포트폴리오`,
      description: profile.tagline_ko || profile.tagline_en || undefined,
      images: profile.og_image_url
        ? [{ url: profile.og_image_url, width: 1200, height: 630, alt: name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | 개발자 이력서 · 포트폴리오`,
      description: profile.tagline_ko || profile.tagline_en || undefined,
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* Every page revalidates against Supabase right after mount, so warm
            the connection while the document is still parsing.

            Two preconnects to the same origin on purpose: the REST calls are
            CORS requests and the profile <img> is not, and a browser keeps
            those on separate connections — a crossorigin-only hint leaves the
            image paying for the handshake itself. */}
        {SUPABASE_URL && (
          <>
            <link rel="preconnect" href={SUPABASE_URL} />
            <link rel="preconnect" href={SUPABASE_URL} crossOrigin="" />
            <link rel="dns-prefetch" href={SUPABASE_URL} />
          </>
        )}
        {/* Stack tags pull ~20 devicon SVGs from this CDN. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
