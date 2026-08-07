import type { Metadata } from "next";
import { ResumeView } from "@/components/resume/ResumeView";
import { PersonJsonLd } from "@/components/seo/JsonLd";
import { getResumeData } from "@/lib/queries.server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "이력서 (CV)",
    description: "학력, 경력, 수상 이력과 대외 활동을 정리한 개발자 이력서입니다.",
    alternates: { canonical: "/" },
  };
}

export default async function ResumePage() {
  // Read at build time so crawlers get fully rendered HTML; ResumeView
  // revalidates against Supabase after mount for visitors.
  const initial = await getResumeData();

  return (
    <>
      <PersonJsonLd data={initial} />
      <ResumeView initial={initial} />
    </>
  );
}
