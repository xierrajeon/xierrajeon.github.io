/**
 * Mirrors supabase/schema.sql. Keep the two in sync when adding columns.
 */

export type Lang = "ko" | "en";

/**
 * Display order for the resume sections and the admin tabs alike — declared
 * once so the two can never drift apart.
 */
export const TIMELINE_CATEGORIES = [
  "education",
  "career",
  "activity",
  "award",
] as const;

export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

/**
 * All sections the resume view can render, in the default display order. The
 * profile stores a permutation of these keys under `section_order`, so admins
 * can rearrange the page from the settings tab without a code change.
 */
export const RESUME_SECTIONS = [
  "skills",
  "education",
  "career",
  "activity",
  "award",
] as const;

export type ResumeSection = (typeof RESUME_SECTIONS)[number];

export type DatePrecision = "day" | "month" | "year";

/**
 * Korean degree programmes distinguish these, and the distinction matters on a
 * resume — a 복수전공 is a second full degree while a 부전공 is not.
 */
export const MAJOR_KINDS = ["primary", "double", "dual", "minor"] as const;

export type MajorKind = (typeof MAJOR_KINDS)[number];

export interface Major {
  name_ko: string;
  name_en: string;
  kind: MajorKind;
}

/**
 * A project built during a career entry.
 *
 * `slug` points at a project in the portfolio tab; `url` covers work that is not
 * in the portfolio (a live service, a company page). `slug` wins when both are
 * set, since an internal link is the more useful destination.
 */
export interface LinkedProject {
  name_ko: string;
  name_en: string;
  /** One line on what it was — "홈페이지 만들기 프로젝트". */
  note_ko: string;
  note_en: string;
  /**
   * When it was worked on. Stored as dates rather than free text so the range
   * formats itself per language, and month precision is assumed — nobody dates
   * a work project to the day on a resume.
   */
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  slug: string | null;
  url: string | null;
}

export const ENROLLMENT_STATUSES = [
  "enrolled",
  "on_leave",
  "graduated",
  "expected",
  "withdrawn",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface Profile {
  id: number;
  name_ko: string;
  name_en: string;
  tagline_ko: string;
  tagline_en: string;
  bio_ko: string;
  bio_en: string;
  /** e.g. "새로운 기회를 찾는 중" — shown as a badge above the name. */
  status_ko: string | null;
  status_en: string | null;
  /** Adds the pulsing green dot and switches the badge to the accent tone. */
  status_active: boolean;
  photo_url: string | null;
  og_image_url: string | null;
  resume_pdf_url: string | null;
  email: string | null;
  phone: string | null;
  location_ko: string | null;
  location_en: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  blog_url: string | null;
  website_url: string | null;
  /** Order the resume tab renders its sections in. See `RESUME_SECTIONS`. */
  section_order: ResumeSection[];
  updated_at?: string;
}

export interface TimelineEntry {
  id: string;
  category: TimelineCategory;
  title_ko: string;
  title_en: string;
  subtitle_ko: string;
  subtitle_en: string;
  description_ko: string;
  description_en: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  date_precision: DatePrecision;
  location_ko: string | null;
  location_en: string | null;
  url: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;

  /** Career only: projects built there, linked to the portfolio or outward. */
  linked_projects: LinkedProject[];

  /**
   * Award only: the number the issuing body assigned — a licence number for a
   * certificate, a registration number for a patent.
   */
  credential_id: string | null;
  /** Award only: score or grade — TOEIC 950, OPIc IH, HSK 6급. Free text. */
  score: string | null;
  /** Award only: a scan of the certificate / award / patent. Hidden when null. */
  image_url: string | null;

  /* --- education only ---------------------------------------------------- */
  /** One school, potentially several majors of different kinds. */
  majors: Major[];
  gpa: number | null;
  /** The maximum the GPA is out of — 4.5, 4.3, 4.0 or 100. */
  gpa_scale: number | null;
  enrollment_status: EnrollmentStatus | null;
}

export interface Project {
  id: string;
  slug: string;
  title_ko: string;
  title_en: string;
  summary_ko: string;
  summary_en: string;
  thumbnail_url: string | null;
  cover_url: string | null;
  tags: string[];
  category_ko: string | null;
  category_en: string | null;
  repo_url: string | null;
  demo_url: string | null;
  period_start: string | null;
  period_end: string | null;
  is_ongoing: boolean;
  role_ko: string | null;
  role_en: string | null;
  team_size: number | null;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
}

export interface Skill {
  id: string;
  group_ko: string;
  group_en: string;
  name: string;
  level: number | null;
  sort_order: number;
  is_published: boolean;
}

/* ---------------------------------------------------------------------------
 * Project detail body blocks
 *
 * Every block row is { id, project_id, type, sort_order, data }. The `data`
 * shape is discriminated by `type`; ProjectBlock below is the union the
 * renderer and the admin editor both consume.
 * ------------------------------------------------------------------------- */

export interface BlockBase {
  id: string;
  project_id: string;
  sort_order: number;
}

export interface HeadingBlockData {
  text_ko: string;
  text_en: string;
  /** 2 = TOC top level, 3 = nested under the closest level 2. */
  level: 2 | 3;
}

export interface TextBlockData {
  text_ko: string;
  text_en: string;
}

export interface ImageBlockData {
  url: string;
  alt_ko: string;
  alt_en: string;
  caption_ko: string;
  caption_en: string;
  /** Intrinsic size, captured at upload time to reserve space and avoid CLS. */
  width: number | null;
  height: number | null;
  /** Renders on a soft backdrop with a device-ish frame — good for UI shots. */
  framed?: boolean;
}

export interface GalleryItem {
  url: string;
  alt_ko: string;
  alt_en: string;
  caption_ko: string;
  caption_en: string;
  width?: number | null;
  height?: number | null;
}

export interface GalleryBlockData {
  items: GalleryItem[];
  columns: 2 | 3;
}

export type VideoProvider = "youtube" | "vimeo" | "file";

export interface VideoBlockData {
  provider: VideoProvider;
  /** Watch URL for youtube/vimeo, Supabase Storage public URL for `file`. */
  url: string;
  poster_url: string | null;
  caption_ko: string;
  caption_en: string;
  /** `file` only — silent looping clips read as animated GIFs. */
  autoplay: boolean;
  loop: boolean;
}

export interface CodeBlockData {
  language: string;
  code: string;
  filename: string;
  caption_ko: string;
  caption_en: string;
}

export interface CalloutBlockData {
  icon: string;
  tone: "info" | "success" | "warn";
  text_ko: string;
  text_en: string;
}

/**
 * The "이런 기능을 만들었어요" unit: a title, a description, a screenshot or
 * clip, and an optional deep link to the exact code on GitHub.
 */
export interface FeatureBlockData {
  title_ko: string;
  title_en: string;
  body_ko: string;
  body_en: string;
  media_url: string | null;
  media_kind: "image" | "video";
  media_width?: number | null;
  media_height?: number | null;
  repo_url: string | null;
  /** Media on the right instead of the left. */
  reversed?: boolean;
}

export interface StackGroup {
  label_ko: string;
  label_en: string;
  items: string[];
}

export interface StackBlockData {
  groups: StackGroup[];
}

export interface LinkBlockData {
  url: string;
  label_ko: string;
  label_en: string;
  description_ko: string;
  description_en: string;
}

export type DividerBlockData = Record<string, never>;

export type ProjectBlock = BlockBase &
  (
    | { type: "heading"; data: HeadingBlockData }
    | { type: "text"; data: TextBlockData }
    | { type: "image"; data: ImageBlockData }
    | { type: "gallery"; data: GalleryBlockData }
    | { type: "video"; data: VideoBlockData }
    | { type: "code"; data: CodeBlockData }
    | { type: "callout"; data: CalloutBlockData }
    | { type: "feature"; data: FeatureBlockData }
    | { type: "stack"; data: StackBlockData }
    | { type: "link"; data: LinkBlockData }
    | { type: "divider"; data: DividerBlockData }
  );

export type BlockType = ProjectBlock["type"];

export interface ProjectWithBlocks extends Project {
  blocks: ProjectBlock[];
}

/** Everything the resume tab needs, resolved in one pass. */
export interface ResumeData {
  profile: Profile;
  entries: TimelineEntry[];
  skills: Skill[];
}
