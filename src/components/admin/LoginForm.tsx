"use client";

import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { TextInput } from "./ui/Field";
import { describeError } from "@/lib/admin/useSaver";
import { getSupabaseBrowser } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      // On success `onAuthStateChange` swaps this form for the admin shell.
      if (authError) throw authError;
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2">
          <LockKeyhole className="size-5 text-accent" aria-hidden="true" />
          <h1 className="text-lg font-bold">관리자 로그인</h1>
        </div>

        <div className="flex flex-col gap-3">
          <TextInput
            label="이메일"
            type="email"
            autoComplete="username"
            value={email}
            onChange={setEmail}
            required
          />
          <TextInput
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary mt-5 w-full"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          로그인
        </button>

        <p className="mt-4 text-2xs leading-relaxed text-fg-subtle">
          Supabase Authentication에 만든 계정으로 로그인합니다. 쓰기 권한은{" "}
          <code className="code-chip">admins</code> 테이블에 등록된 이메일에만
          부여됩니다.
        </p>
      </form>
    </div>
  );
}
