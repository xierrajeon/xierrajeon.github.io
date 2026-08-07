import { Suspense } from "react";
import { ProjectEditor } from "@/components/admin/projects/ProjectEditor";

/**
 * The project id travels in a query string rather than a dynamic segment: a
 * static export would otherwise need `generateStaticParams` for every project
 * id, which cannot include projects created after the build.
 */
export default function AdminProjectEditPage() {
  return (
    <Suspense fallback={<p className="py-16 text-sm text-fg-muted">불러오는 중…</p>}>
      <ProjectEditor />
    </Suspense>
  );
}
