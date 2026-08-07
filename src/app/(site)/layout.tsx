import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getProfile } from "@/lib/queries.server";

/**
 * Chrome shared by every public page. `/admin` sits outside this group so it
 * gets its own shell.
 */
export default async function SiteLayout({
  children,
}: LayoutProps<"/">) {
  const profile = await getProfile();
  const year = new Date().getFullYear();

  return (
    <>
      <SiteHeader profile={profile} />
      <main id="main" className="flex-1 pt-6 sm:pt-8">
        {children}
      </main>
      <SiteFooter profile={profile} year={year} />
    </>
  );
}
