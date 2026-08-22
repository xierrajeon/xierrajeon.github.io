import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectFallback } from "@/components/project/ProjectFallback";
import { getProfile } from "@/lib/queries.server";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

/**
 * Exported as 404.html, which GitHub Pages serves for every unmatched path.
 * That makes it the natural place to handle project pages that exist in the
 * database but were published after the last build.
 */
export default async function NotFound() {
  const profile = await getProfile();

  return (
    <>
      <SiteHeader profile={profile} />
      <main id="main" className="flex-1 pt-6 sm:pt-8">
        <ProjectFallback siteName={profile.name_ko || profile.name_en} />
      </main>
      <SiteFooter profile={profile} year={new Date().getFullYear()} />
    </>
  );
}
