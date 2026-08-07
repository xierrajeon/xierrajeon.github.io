import type { Metadata } from "next";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { ProjectListJsonLd } from "@/components/seo/JsonLd";
import { getProfile, getPublishedProjects } from "@/lib/queries.server";

export const metadata: Metadata = {
  title: "포트폴리오",
  description:
    "직접 설계하고 구현한 프로젝트 목록입니다. 각 카드를 눌러 기능별 구현 방식과 사용 스택, GitHub 저장소를 볼 수 있습니다.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [profile, projects] = await Promise.all([
    getProfile(),
    getPublishedProjects(),
  ]);

  return (
    <>
      <ProjectListJsonLd projects={projects} />
      <PortfolioView profile={profile} initialProjects={projects} />
    </>
  );
}
