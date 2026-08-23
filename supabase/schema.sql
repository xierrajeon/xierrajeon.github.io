-- ============================================================================
-- Portfolio / CV schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run: everything is created with "if not exists" / "or replace".
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Who is allowed to write
--
-- Anyone on the internet can read published rows with the anon key, so writes
-- are gated on an explicit email allowlist rather than on "any logged-in user".
-- That way even an accidental public signup cannot touch your content.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admins enable row level security;

drop policy if exists "admins readable by admins" on public.admins;
create policy "admins readable by admins"
  on public.admins for select
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Shared helper: keep updated_at honest
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profile — a single row (id is pinned to 1) holding the CV header
-- ----------------------------------------------------------------------------
create table if not exists public.profile (
  id            smallint primary key default 1 check (id = 1),
  name_ko       text not null default '',
  name_en       text not null default '',
  tagline_ko    text not null default '',
  tagline_en    text not null default '',
  bio_ko        text not null default '',
  bio_en        text not null default '',
  photo_url     text,
  og_image_url  text,
  resume_pdf_url text,
  email         text,
  phone         text,
  location_ko   text,
  location_en   text,
  github_url    text,
  linkedin_url  text,
  blog_url      text,
  website_url   text,
  updated_at    timestamptz not null default now()
);

-- Columns added after the first release. `add column if not exists` keeps this
-- file runnable as a whole on an existing database.
alter table public.profile add column if not exists status_ko text;
alter table public.profile add column if not exists status_en text;
alter table public.profile add column if not exists status_active boolean not null default false;

-- Resume section layout, reordered from the admin settings page. The values
-- are the section keys the resume view knows how to render, and the default
-- covers all of them so a fresh row renders the full page. Values mirror
-- `RESUME_SECTIONS` in src/lib/types.ts — keep them in sync when adding a
-- section.
alter table public.profile
  add column if not exists section_order text[] not null
  default '{skills,education,career,activity,award}';

insert into public.profile (id) values (1) on conflict (id) do nothing;

drop trigger if exists profile_touch on public.profile;
create trigger profile_touch before update on public.profile
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- timeline_entries — 학력 / 경력 / 수상·자격증·특허 / 활동이력
--
-- Date display rules used by the UI:
--   end_date set              → "2021.03 – 2023.02"
--   end_date null, is_current → "2023.03 – 현재"
--   end_date null, not current→ "2023.03"        (awards, one-off events)
-- ----------------------------------------------------------------------------
create table if not exists public.timeline_entries (
  id             uuid primary key default gen_random_uuid(),
  category       text not null check (category in ('education', 'career', 'award', 'activity')),
  title_ko       text not null default '',
  title_en       text not null default '',
  subtitle_ko    text not null default '',   -- 전공 / 직책 / 주최기관 / 역할
  subtitle_en    text not null default '',
  description_ko text not null default '',   -- markdown, 줄바꿈으로 성과 나열
  description_en text not null default '',
  start_date     date,
  end_date       date,
  is_current     boolean not null default false,
  date_precision text not null default 'month' check (date_precision in ('day', 'month', 'year')),
  location_ko    text,
  location_en    text,
  url            text,
  tags           text[] not null default '{}',
  sort_order     integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Education-only fields, added after the first release.
--
-- `majors` is jsonb because one school routinely carries several majors of
-- different kinds (주전공 / 복수전공 / 이중전공 / 부전공). Shape mirrors
-- `Major` in src/lib/types.ts:
--   [{ "name_ko": "컴퓨터공학과", "name_en": "Computer Science", "kind": "primary" }]
alter table public.timeline_entries
  add column if not exists majors jsonb not null default '[]'::jsonb;

-- GPA is meaningless without its scale: Korean universities use 4.5 or 4.3,
-- some use 4.0, and a few report out of 100.
alter table public.timeline_entries
  add column if not exists gpa numeric(5, 2);
alter table public.timeline_entries
  add column if not exists gpa_scale numeric(5, 2);

alter table public.timeline_entries
  add column if not exists enrollment_status text;

-- Career-only: the projects built at that company. Korean resumes list these
-- briefly and defer the long write-up elsewhere, so each one can point either at
-- a project in the portfolio tab (by slug, resolved to /projects/<slug>) or at
-- an external address. Shape mirrors `LinkedProject` in src/lib/types.ts:
--   [{ "name_ko": "GED", "name_en": "GED", "note_ko": "홈페이지 만들기",
--      "note_en": "Website build", "start_date": "2025-03-01",
--      "end_date": "2025-05-01", "is_ongoing": false,
--      "slug": "ged", "url": null }]
alter table public.timeline_entries
  add column if not exists linked_projects jsonb not null default '[]'::jsonb;

-- Award/certificate-only: the number the issuing body assigned. Certificates
-- are single-point events, so they use `start_date` alone as the date acquired
-- and ignore `end_date` / `is_current`.
alter table public.timeline_entries
  add column if not exists credential_id text;

-- Award/certificate-only: score or grade — TOEIC 950, OPIc IH, HSK 6급. Free
-- text because the shape varies by exam. Hidden when empty.
alter table public.timeline_entries
  add column if not exists score text;

-- Award/certificate/patent-only: a scan of the certificate, award, or patent
-- document. Public storage URL, same bucket as project media. Hidden when null.
alter table public.timeline_entries
  add column if not exists image_url text;

-- Added as a separate statement so re-running the file on a table that already
-- has the column still installs the constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'timeline_entries_enrollment_status_check'
  ) then
    alter table public.timeline_entries
      add constraint timeline_entries_enrollment_status_check
      check (enrollment_status is null or enrollment_status in
        ('enrolled', 'on_leave', 'graduated', 'expected', 'withdrawn'));
  end if;
end $$;

create index if not exists timeline_entries_category_idx
  on public.timeline_entries (category, sort_order desc, start_date desc);

drop trigger if exists timeline_entries_touch on public.timeline_entries;
create trigger timeline_entries_touch before update on public.timeline_entries
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- projects — one row per portfolio gallery card
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title_ko      text not null default '',
  title_en      text not null default '',
  summary_ko    text not null default '',   -- 카드에 노출되는 한두 줄 요약
  summary_en    text not null default '',
  thumbnail_url text,                       -- 갤러리 카드 커버
  cover_url     text,                       -- 상세 페이지 히어로
  tags          text[] not null default '{}',  -- 사용 스택
  category_ko   text,
  category_en   text,
  repo_url      text,
  demo_url      text,
  period_start  date,
  period_end    date,
  is_ongoing    boolean not null default false,
  role_ko       text,
  role_en       text,
  team_size     integer,
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  is_featured   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_published_idx
  on public.projects (is_published, sort_order desc, period_start desc);

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- project_blocks — the ordered body of a project detail page
--
-- `data` is jsonb so a new block type never needs a migration. Shapes are
-- mirrored exactly in src/lib/types.ts (ProjectBlock):
--   heading  { text_ko, text_en, level: 2|3 }
--   text     { text_ko, text_en }                       -- markdown
--   image    { url, alt_ko, alt_en, caption_ko, caption_en, width, height }
--   gallery  { items: [{ url, alt_ko, alt_en, caption_ko, caption_en }] }
--   video    { provider: 'youtube'|'vimeo'|'file', url, poster_url,
--              caption_ko, caption_en, autoplay, loop }
--   code     { language, code, filename, caption_ko, caption_en }
--   callout  { icon, tone: 'info'|'success'|'warn', text_ko, text_en }
--   feature  { title_ko, title_en, body_ko, body_en, media_url,
--              media_kind: 'image'|'video', repo_url }
--   stack    { groups: [{ label_ko, label_en, items: [text] }] }
--   link     { url, label_ko, label_en, description_ko, description_en }
--   divider  {}
-- ----------------------------------------------------------------------------
create table if not exists public.project_blocks (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type       text not null check (type in (
               'heading', 'text', 'image', 'gallery', 'video', 'code',
               'callout', 'feature', 'stack', 'link', 'divider')),
  data       jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_blocks_project_idx
  on public.project_blocks (project_id, sort_order);

drop trigger if exists project_blocks_touch on public.project_blocks;
create trigger project_blocks_touch before update on public.project_blocks
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- skills — optional grouped stack list on the resume tab
-- ----------------------------------------------------------------------------
create table if not exists public.skills (
  id           uuid primary key default gen_random_uuid(),
  group_ko     text not null default '',
  group_en     text not null default '',
  name         text not null default '',
  level        smallint check (level between 1 and 5),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists skills_touch on public.skills;
create trigger skills_touch before update on public.skills
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
--   read : anon + authenticated, published rows only
--   write: admins only
-- ============================================================================
alter table public.profile         enable row level security;
alter table public.timeline_entries enable row level security;
alter table public.projects        enable row level security;
alter table public.project_blocks  enable row level security;
alter table public.skills          enable row level security;

-- profile (always readable — it is the site header)
drop policy if exists "profile is public" on public.profile;
create policy "profile is public" on public.profile for select using (true);

drop policy if exists "profile writable by admins" on public.profile;
create policy "profile writable by admins" on public.profile for all
  using (public.is_admin()) with check (public.is_admin());

-- timeline_entries
drop policy if exists "published timeline is public" on public.timeline_entries;
create policy "published timeline is public" on public.timeline_entries for select
  using (is_published or public.is_admin());

drop policy if exists "timeline writable by admins" on public.timeline_entries;
create policy "timeline writable by admins" on public.timeline_entries for all
  using (public.is_admin()) with check (public.is_admin());

-- projects
drop policy if exists "published projects are public" on public.projects;
create policy "published projects are public" on public.projects for select
  using (is_published or public.is_admin());

drop policy if exists "projects writable by admins" on public.projects;
create policy "projects writable by admins" on public.projects for all
  using (public.is_admin()) with check (public.is_admin());

-- project_blocks (visible only when the parent project is)
drop policy if exists "blocks of published projects are public" on public.project_blocks;
create policy "blocks of published projects are public" on public.project_blocks for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_blocks.project_id and p.is_published
    )
  );

drop policy if exists "blocks writable by admins" on public.project_blocks;
create policy "blocks writable by admins" on public.project_blocks for all
  using (public.is_admin()) with check (public.is_admin());

-- skills
drop policy if exists "published skills are public" on public.skills;
create policy "published skills are public" on public.skills for select
  using (is_published or public.is_admin());

drop policy if exists "skills writable by admins" on public.skills;
create policy "skills writable by admins" on public.skills for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Storage: one public bucket for images and short videos
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 26214400)  -- 25MB per object
on conflict (id) do update set public = true, file_size_limit = 26214400;

drop policy if exists "media is publicly readable" on storage.objects;
create policy "media is publicly readable" on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media writable by admins" on storage.objects;
create policy "media writable by admins" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media updatable by admins" on storage.objects;
create policy "media updatable by admins" on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media deletable by admins" on storage.objects;
create policy "media deletable by admins" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

-- ============================================================================
-- site_likes — visitor heart button on the profile card
--
-- A single-row counter. Anonymous visitors can read the count, but writes are
-- gated behind a SECURITY DEFINER function so the anon key cannot spam
-- arbitrary values into the column. Client-side localStorage prevents casual
-- double-clicks; determined users can bypass it, which is fine — this is a
-- vanity counter, not a vote.
-- ============================================================================
create table if not exists public.site_likes (
  id    smallint primary key default 1 check (id = 1),
  count bigint   not null default 0
);
insert into public.site_likes (id) values (1) on conflict (id) do nothing;

alter table public.site_likes enable row level security;

drop policy if exists "site_likes readable by everyone" on public.site_likes;
create policy "site_likes readable by everyone" on public.site_likes for select
  using (true);

-- No insert/update/delete policies: only the RPC below can mutate this table.

create or replace function public.increment_like()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.site_likes set count = count + 1 where id = 1
  returning count;
$$;

grant execute on function public.increment_like() to anon, authenticated;
