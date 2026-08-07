"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { TextInput } from "@/components/admin/ui/Field";
import { describeError } from "@/lib/admin/useSaver";
import { GITHUB_REPO, SITE_URL } from "@/lib/site";

const TOKEN_KEY = "xj-gh-token";

type DispatchState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string };

/**
 * Triggers a rebuild of the static export.
 *
 * Saving in the admin page is enough for visitors — the public pages
 * revalidate against Supabase on mount. Crawlers, though, read the HTML that
 * was baked at build time, so this button exists to bring that HTML up to date
 * on demand via a `repository_dispatch` event.
 */
export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<DispatchState>({ status: "idle" });

  useEffect(() => {
    try {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- the stored
         token cannot be read during render without desyncing the input's
         server-rendered value from its hydrated one. */
      setToken(localStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  function saveToken(value: string) {
    setToken(value);
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  async function dispatch() {
    setState({ status: "sending" });
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token.trim()}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event_type: "rebuild-site" }),
        },
      );
      // A successful dispatch returns 204 with no body.
      if (response.status !== 204) {
        const detail = await response.text();
        throw new Error(
          `GitHub 응답 ${response.status}. ${detail.slice(0, 200) || "토큰 권한(Contents: Read and write)을 확인하세요."}`,
        );
      }
      setState({ status: "sent" });
    } catch (cause) {
      setState({ status: "error", message: describeError(cause) });
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">설정</h1>
        <p className="mt-1 text-sm text-fg-muted">
          검색엔진이 읽는 정적 HTML을 최신 데이터로 다시 굽습니다.
        </p>
      </div>

      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-bold">지금 재배포</h2>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            어드민에서 저장한 내용은 <strong>방문자에게 이미 즉시 반영</strong>됩니다.
            이 버튼은 검색 노출과 링크 미리보기(OG 이미지)에 쓰이는 정적 HTML을
            갱신할 때만 누르면 됩니다. 새 프로젝트를 만든 뒤에 한 번 눌러두는 것을
            권합니다.
          </p>
        </div>

        <TextInput
          label="GitHub 토큰"
          type="password"
          placeholder="github_pat_..."
          value={token}
          onChange={saveToken}
          hint="이 브라우저에만 저장됩니다(localStorage). 데이터베이스나 리포지토리에는 저장되지 않으며, 기기를 바꾸면 다시 입력해야 합니다."
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void dispatch()}
            disabled={!token.trim() || state.status === "sending"}
            className="btn btn-primary"
          >
            {state.status === "sending" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            재배포 실행
          </button>

          <a
            href={`https://github.com/${GITHUB_REPO}/actions`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            진행 상황 보기
          </a>
        </div>

        {state.status === "sent" && (
          <p className="flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            빌드를 요청했습니다. 1~2분 뒤 반영됩니다.
          </p>
        )}
        {state.status === "error" && (
          <p className="flex items-start gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}
      </section>

      <section className="card flex flex-col gap-2 p-4 text-xs sm:p-5">
        <h2 className="text-sm font-bold">토큰 만드는 방법</h2>
        <ol className="flex flex-col gap-1 pl-4 text-fg-muted [&>li]:list-decimal">
          <li>
            GitHub → Settings → Developer settings → Personal access tokens →
            Fine-grained tokens → <strong>Generate new token</strong>
          </li>
          <li>
            Repository access → Only select repositories →{" "}
            <code className="code-chip">{GITHUB_REPO}</code>
          </li>
          <li>
            Permissions → Repository permissions →{" "}
            <strong>Contents: Read and write</strong>
          </li>
          <li>생성된 토큰을 위 입력란에 붙여넣기</li>
        </ol>
      </section>

      <section className="card flex flex-col gap-2 p-4 text-xs sm:p-5">
        <h2 className="text-sm font-bold">현재 설정</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-fg-muted">
          <dt>사이트 주소</dt>
          <dd className="truncate font-mono">{SITE_URL}</dd>
          <dt>리포지토리</dt>
          <dd className="truncate font-mono">{GITHUB_REPO}</dd>
        </dl>
      </section>
    </div>
  );
}
