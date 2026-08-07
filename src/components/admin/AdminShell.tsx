"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderKanban,
  Layers,
  ListOrdered,
  Loader2,
  LogOut,
  Settings,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/HeaderActions";
import { LoginForm } from "./LoginForm";
import { useAuth } from "@/lib/admin/session";

const NAV = [
  { href: "/admin", label: "프로필", icon: UserCog, exact: true },
  { href: "/admin/timeline", label: "이력", icon: ListOrdered },
  { href: "/admin/projects", label: "포트폴리오", icon: FolderKanban },
  { href: "/admin/skills", label: "기술 스택", icon: Layers },
  { href: "/admin/settings", label: "설정", icon: Settings },
] as const;

function normalize(path: string): string {
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center">
      <div className="card max-w-md p-8 text-center">{children}</div>
    </div>
  );
}

/**
 * Gate plus chrome for the admin area.
 *
 * The gate is a convenience, not the security boundary — the static bundle is
 * public, so anyone can open /admin. What stops them is Row Level Security: the
 * anon key can only read published rows, and every write policy requires an
 * email listed in `admins`.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = normalize(usePathname());

  if (auth.status === "loading") {
    return (
      <Centered>
        <Loader2
          className="mx-auto size-6 animate-spin text-fg-subtle"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-fg-muted">확인 중…</p>
      </Centered>
    );
  }

  if (auth.status === "unconfigured") {
    return (
      <Centered>
        <ShieldAlert className="mx-auto size-6 text-warn" aria-hidden="true" />
        <h1 className="mt-3 text-base font-bold">Supabase 설정이 필요합니다</h1>
        <p className="mt-2 text-sm text-fg-muted">
          <code className="code-chip">.env.local</code> 에{" "}
          <code className="code-chip">NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
          <code className="code-chip">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를
          채운 뒤 다시 시작하세요.
        </p>
      </Centered>
    );
  }

  if (auth.status === "anonymous") return <LoginForm />;

  if (auth.status === "forbidden") {
    return (
      <Centered>
        <ShieldAlert className="mx-auto size-6 text-danger" aria-hidden="true" />
        <h1 className="mt-3 text-base font-bold">쓰기 권한이 없습니다</h1>
        <p className="mt-2 text-sm text-fg-muted">
          <strong>{auth.email}</strong> 은 관리자로 등록되지 않았습니다. Supabase
          SQL Editor에서 아래를 실행하세요.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-sunken p-3 text-left text-2xs">
          <code>{`insert into public.admins (email)\nvalues ('${auth.email}')\non conflict (email) do nothing;`}</code>
        </pre>
        <button
          type="button"
          onClick={auth.signOut}
          className="btn btn-secondary btn-sm mt-4"
        >
          <LogOut className="size-4" aria-hidden="true" />
          로그아웃
        </button>
      </Centered>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="container-page flex h-14 items-center gap-3">
          <p className="flex items-center gap-1.5 font-bold">
            <Settings className="size-4 text-accent" aria-hidden="true" />
            어드민
          </p>
          <p className="hidden truncate text-xs text-fg-subtle sm:block">
            {auth.email}
          </p>
          <div className="ml-auto flex items-center gap-0.5">
            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost btn-sm gap-1.5"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">사이트 보기</span>
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={auth.signOut}
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="container-page">
          <nav
            aria-label="어드민 메뉴"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
          >
            {NAV.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`btn btn-sm shrink-0 gap-1.5 ${
                    active ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main" className="container-page flex-1 py-6">
        {children}
      </main>
    </>
  );
}
