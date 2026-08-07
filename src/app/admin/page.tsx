"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BilingualField,
  TextInput,
  Toggle,
  UrlInput,
} from "@/components/admin/ui/Field";
import { ImageUploader } from "@/components/admin/ui/ImageUploader";
import { SaveBar } from "@/components/admin/ui/SaveBar";
import { ProfileCard } from "@/components/resume/ProfileCard";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useSaver } from "@/lib/admin/useSaver";
import { RESUME_SECTIONS } from "@/lib/types";
import type { Profile } from "@/lib/types";

/**
 * Columns the form owns. `id` and `updated_at` are managed by the database;
 * `section_order` is edited from the settings tab.
 */
type Draft = Omit<Profile, "id" | "updated_at" | "section_order">;

const EMPTY: Draft = {
  name_ko: "",
  name_en: "",
  tagline_ko: "",
  tagline_en: "",
  bio_ko: "",
  bio_en: "",
  status_ko: "",
  status_en: "",
  status_active: false,
  photo_url: null,
  og_image_url: null,
  resume_pdf_url: null,
  email: null,
  phone: null,
  location_ko: null,
  location_en: null,
  github_url: null,
  linkedin_url: null,
  blog_url: null,
  website_url: null,
};

export default function AdminProfilePage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const { status, error, run, reset } = useSaver();

  useEffect(() => {
    getSupabaseBrowser()
      .from("profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        // Strip section_order — the settings tab owns it and this form must not
        // round-trip its value.
        const { section_order: _, ...rest } =
          (data ?? {}) as Partial<Profile>;
        setDraft({ ...EMPTY, ...(rest as Partial<Draft>) });
      });
  }, []);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
    reset();
  }

  async function save() {
    if (!draft) return;
    const ok = await run(async () => {
      const { error: saveError } = await getSupabaseBrowser()
        .from("profile")
        .update(draft)
        .eq("id", 1);
      if (saveError) throw saveError;
    });
    if (ok) setDirty(false);
  }

  if (!draft) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        불러오는 중…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold">프로필</h1>
          <p className="mt-1 text-sm text-fg-muted">
            두 탭 상단에 공통으로 보이는 영역입니다.
          </p>
        </div>

        <section className="card flex flex-col gap-4 p-4 sm:p-5">
          <ImageUploader
            label="프로필 사진"
            value={{ url: draft.photo_url }}
            onChange={({ url }) => set("photo_url", url)}
            folder="profile"
            maxWidth={640}
            circle
            cropAspect={1}
          />

          <BilingualField
            label="이름"
            ko={draft.name_ko}
            en={draft.name_en}
            onChangeKo={(v) => set("name_ko", v)}
            onChangeEn={(v) => set("name_en", v)}
            placeholderKo="홍길동"
            placeholderEn="Gildong Hong"
            hint="한국어 모드에서는 '홍길동 (Gildong Hong)' 형태로 함께 표시됩니다."
          />

          <BilingualField
            label="한 줄 소개"
            ko={draft.tagline_ko}
            en={draft.tagline_en}
            onChangeKo={(v) => set("tagline_ko", v)}
            onChangeEn={(v) => set("tagline_en", v)}
            placeholderKo="Full-Stack Developer | React & Node.js"
            placeholderEn="Full-Stack Developer | React & Node.js"
          />

          <BilingualField
            label="소개글"
            multiline
            rows={7}
            ko={draft.bio_ko}
            en={draft.bio_en}
            onChangeKo={(v) => set("bio_ko", v)}
            onChangeEn={(v) => set("bio_en", v)}
            hint="**굵게**, `코드`, - 목록, [링크](url) 를 쓸 수 있습니다."
          />
        </section>

        <section className="card flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-bold">상태 배지</h2>
          <BilingualField
            label="배지 문구"
            ko={draft.status_ko ?? ""}
            en={draft.status_en ?? ""}
            onChangeKo={(v) => set("status_ko", v)}
            onChangeEn={(v) => set("status_en", v)}
            placeholderKo="새로운 기회를 찾는 중"
            placeholderEn="Open to new opportunities"
            hint="비워두면 배지가 표시되지 않습니다."
          />
          <Toggle
            label="구직 중 표시(초록 점)"
            checked={draft.status_active}
            onChange={(v) => set("status_active", v)}
          />
        </section>

        <section className="card flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-bold">연락처 · 링크</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="이메일"
              type="email"
              value={draft.email ?? ""}
              onChange={(v) => set("email", v || null)}
              hint="입력하면 헤더 메일 버튼과 하단 CTA가 나타납니다."
            />
            <UrlInput
              label="GitHub"
              placeholder="https://github.com/xierrajeon"
              value={draft.github_url ?? ""}
              onChange={(v) => set("github_url", v || null)}
            />
            <UrlInput
              label="LinkedIn"
              value={draft.linkedin_url ?? ""}
              onChange={(v) => set("linkedin_url", v || null)}
            />
            <UrlInput
              label="블로그"
              value={draft.blog_url ?? ""}
              onChange={(v) => set("blog_url", v || null)}
            />
            <UrlInput
              label="웹사이트"
              value={draft.website_url ?? ""}
              onChange={(v) => set("website_url", v || null)}
            />
          </div>
          <BilingualField
            label="지역"
            ko={draft.location_ko ?? ""}
            en={draft.location_en ?? ""}
            onChangeKo={(v) => set("location_ko", v || null)}
            onChangeEn={(v) => set("location_en", v || null)}
            placeholderKo="서울, 대한민국"
            placeholderEn="Seoul, South Korea"
          />
        </section>

        <section className="card flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-bold">공유 이미지 (OG)</h2>
          <ImageUploader
            label="링크 공유 시 보이는 이미지"
            hint="1200×630 권장. 비워두면 텍스트 카드로 표시됩니다."
            value={{ url: draft.og_image_url }}
            onChange={({ url }) => set("og_image_url", url)}
            folder="profile"
            maxWidth={1200}
            cropAspect={1200 / 630}
          />
        </section>

        <SaveBar
          status={status}
          error={error}
          dirty={dirty}
          onSave={() => void save()}
        />
      </div>

      {/* Live preview: the same component the public page renders, so what is
          shown here cannot drift from what visitors get. */}
      <aside className="lg:sticky lg:top-28">
        <p className="eyebrow mb-2">미리보기</p>
        <div className="rounded-[var(--radius-card)] bg-bg-subtle p-3">
          <ProfileCard profile={{ ...draft, id: 1, section_order: [...RESUME_SECTIONS] }} />
        </div>
      </aside>
    </div>
  );
}
