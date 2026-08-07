import type {
  Profile,
  Project,
  ProjectBlock,
  Skill,
  TimelineEntry,
} from "./types";

/**
 * Placeholder content used when Supabase has no rows yet (or no keys are
 * configured). It exists so the layout is visible from the first `npm run dev`
 * and so a build never fails on an empty database. Real content from the admin
 * page always wins — this is only shown when a table comes back empty.
 */

export const seedProfile: Profile = {
  id: 1,
  name_ko: "전O현",
  name_en: "Xierra Jeon",
  tagline_ko: "제품이 실제로 굴러가게 만드는 데 관심이 많은 개발자",
  tagline_en: "Developer focused on making products actually ship",
  bio_ko:
    "사용자가 멈추는 지점을 찾아 고치는 일을 좋아합니다. 프론트엔드를 주로 다루지만 필요하면 서버와 인프라까지 내려가서 원인을 확인합니다.\n\n**어드민 페이지에서 이 소개글을 바꿔보세요.**",
  bio_en:
    "I like finding the exact point where a user gets stuck, and fixing it. Mostly frontend, but I go down to the server and infra when that is where the cause lives.\n\n**Edit this bio from the admin page.**",
  status_ko: "새로운 기회를 찾는 중",
  status_en: "Open to new opportunities",
  status_active: true,
  photo_url: null,
  og_image_url: null,
  resume_pdf_url: null,
  email: null,
  phone: null,
  location_ko: "서울, 대한민국",
  location_en: "Seoul, South Korea",
  github_url: "https://github.com/xierrajeon",
  linkedin_url: null,
  blog_url: null,
  website_url: null,
};

function entry(e: Partial<TimelineEntry> & Pick<TimelineEntry, "id" | "category">): TimelineEntry {
  return {
    title_ko: "",
    title_en: "",
    subtitle_ko: "",
    subtitle_en: "",
    description_ko: "",
    description_en: "",
    start_date: null,
    end_date: null,
    is_current: false,
    date_precision: "month",
    location_ko: null,
    location_en: null,
    url: null,
    tags: [],
    sort_order: 0,
    is_published: true,
    majors: [],
    gpa: null,
    gpa_scale: null,
    enrollment_status: null,
    ...e,
  };
}

export const seedTimeline: TimelineEntry[] = [
  entry({
    id: "seed-career-1",
    category: "career",
    title_ko: "메디솔랩",
    title_en: "Medissol Lab",
    subtitle_ko: "프론트엔드 개발",
    subtitle_en: "Frontend Engineer",
    description_ko:
      "- 사내 제품의 프론트엔드 전반을 담당하며 화면 설계부터 배포까지 진행\n- 반복되는 UI 패턴을 공용 컴포넌트로 정리해 신규 화면 작업 시간 단축\n- 어드민 도구를 만들어 비개발 직군이 직접 데이터를 관리하도록 이관",
    description_en:
      "- Owned the product frontend end to end, from screen design through deploy\n- Extracted repeated UI patterns into shared components, cutting new-screen turnaround\n- Built internal admin tooling so non-engineers could manage content themselves",
    start_date: "2024-01-01",
    is_current: true,
    location_ko: "서울",
    location_en: "Seoul",
    tags: ["React", "TypeScript", "Next.js"],
    sort_order: 0,
  }),
  entry({
    id: "seed-education-1",
    category: "education",
    title_ko: "OO대학교",
    title_en: "OO University",
    subtitle_ko: "학사",
    subtitle_en: "B.S.",
    start_date: "2018-03-01",
    end_date: "2023-02-01",
    majors: [
      {
        name_ko: "컴퓨터공학과",
        name_en: "Computer Science",
        kind: "primary",
      },
      { name_ko: "경영학과", name_en: "Business Administration", kind: "double" },
    ],
    gpa: 3.8,
    gpa_scale: 4.5,
    enrollment_status: "graduated",
    tags: [],
    sort_order: 0,
  }),
  entry({
    id: "seed-award-1",
    category: "award",
    title_ko: "교내 해커톤 우수상",
    title_en: "University Hackathon, Excellence Award",
    subtitle_ko: "OO대학교 SW중심대학사업단",
    subtitle_en: "OO University SW Program",
    description_ko: "48시간 동안 팀 4명으로 실시간 협업 편집 서비스를 만들어 2위 수상.",
    description_en:
      "Built a realtime collaborative editor with a team of four in 48 hours; placed second.",
    start_date: "2022-10-01",
    date_precision: "month",
    tags: ["WebSocket", "CRDT"],
    sort_order: 0,
  }),
  entry({
    id: "seed-activity-1",
    category: "activity",
    title_ko: "오픈소스 컨트리뷰션 활동",
    title_en: "Open Source Contributions",
    subtitle_ko: "문서 번역 및 버그 수정",
    subtitle_en: "Docs translation and bug fixes",
    description_ko: "사용하던 라이브러리의 한국어 문서를 번역하고, 재현되는 버그 3건을 수정해 머지.",
    description_en:
      "Translated Korean docs for libraries I use daily and landed three reproducible bug fixes.",
    start_date: "2023-05-01",
    is_current: true,
    tags: ["Open Source"],
    sort_order: 0,
  }),
];

export const seedSkills: Skill[] = [
  { id: "s1", group_ko: "언어", group_en: "Languages", name: "TypeScript", level: 5, sort_order: 0, is_published: true },
  { id: "s2", group_ko: "언어", group_en: "Languages", name: "Python", level: 3, sort_order: 1, is_published: true },
  { id: "s3", group_ko: "프론트엔드", group_en: "Frontend", name: "React", level: 5, sort_order: 2, is_published: true },
  { id: "s4", group_ko: "프론트엔드", group_en: "Frontend", name: "Next.js", level: 4, sort_order: 3, is_published: true },
  { id: "s5", group_ko: "프론트엔드", group_en: "Frontend", name: "Tailwind CSS", level: 4, sort_order: 4, is_published: true },
  { id: "s6", group_ko: "백엔드 · 인프라", group_en: "Backend · Infra", name: "PostgreSQL", level: 3, sort_order: 5, is_published: true },
  { id: "s7", group_ko: "백엔드 · 인프라", group_en: "Backend · Infra", name: "Supabase", level: 4, sort_order: 6, is_published: true },
  { id: "s8", group_ko: "백엔드 · 인프라", group_en: "Backend · Infra", name: "GitHub Actions", level: 3, sort_order: 7, is_published: true },
];

function project(p: Partial<Project> & Pick<Project, "id" | "slug">): Project {
  return {
    title_ko: "",
    title_en: "",
    summary_ko: "",
    summary_en: "",
    thumbnail_url: null,
    cover_url: null,
    tags: [],
    category_ko: null,
    category_en: null,
    repo_url: null,
    demo_url: null,
    period_start: null,
    period_end: null,
    is_ongoing: false,
    role_ko: null,
    role_en: null,
    team_size: null,
    sort_order: 0,
    is_published: true,
    is_featured: false,
    ...p,
  };
}

export const seedProjects: Project[] = [
  project({
    id: "seed-p1",
    slug: "chat-emoji-picker",
    title_ko: "채팅 이모지 첨부 기능",
    title_en: "Chat Emoji Picker",
    summary_ko: "입력창을 벗어나지 않고 이모지를 고르고, 최근 사용 순으로 기억하는 피커를 만들었습니다.",
    summary_en:
      "A picker that never steals focus from the composer and remembers what you actually use.",
    tags: ["React", "TypeScript", "Zustand", "IndexedDB"],
    category_ko: "기능 개발",
    category_en: "Feature",
    repo_url: "https://github.com/xierrajeon",
    period_start: "2025-03-01",
    period_end: "2025-05-01",
    role_ko: "프론트엔드 단독 개발",
    role_en: "Sole frontend developer",
    team_size: 1,
    sort_order: 0,
    is_featured: true,
  }),
  project({
    id: "seed-p2",
    slug: "portfolio-admin",
    title_ko: "포트폴리오 어드민",
    title_en: "Portfolio Admin",
    summary_ko: "정적 사이트에 붙는 CMS. 저장하면 배포 없이 바로 반영됩니다.",
    summary_en: "A CMS bolted onto a static site — saving publishes instantly, no rebuild.",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "GitHub Actions"],
    category_ko: "도구",
    category_en: "Tooling",
    period_start: "2026-08-01",
    is_ongoing: true,
    role_ko: "기획 · 개발",
    role_en: "Design and development",
    team_size: 1,
    sort_order: 1,
  }),
];

function block(b: Omit<ProjectBlock, "project_id"> & { project_id?: string }): ProjectBlock {
  return { project_id: "seed-p1", ...b } as ProjectBlock;
}

/** A worked example of every block type, on the emoji-picker project. */
export const seedBlocks: Record<string, ProjectBlock[]> = {
  "chat-emoji-picker": [
    block({
      id: "b1",
      sort_order: 0,
      type: "text",
      data: {
        text_ko:
          "채팅 입력창에서 이모지를 붙이려면 마우스를 옮겨 버튼을 누르고, 패널을 열고, 스크롤해서 찾아야 했습니다. **입력 흐름이 끊기는 게 문제**라고 보고, 손을 키보드에서 떼지 않고도 끝낼 수 있게 다시 만들었습니다.",
        text_en:
          "Attaching an emoji meant reaching for a button, opening a panel, and scrolling to hunt. The real problem was **the typing flow breaking**, so I rebuilt it to finish without leaving the keyboard.",
      },
    }),
    block({
      id: "b2",
      sort_order: 1,
      type: "heading",
      data: { text_ko: "만든 기능", text_en: "What I built", level: 2 },
    }),
    block({
      id: "b3",
      sort_order: 2,
      type: "feature",
      data: {
        title_ko: "`:` 을 치면 바로 자동완성",
        title_en: "Type `:` to autocomplete inline",
        body_ko:
          "입력창에 `:smi` 까지만 치면 후보가 뜨고 `Tab` 으로 확정됩니다. 패널을 열 필요가 없어 평균 입력 시간이 절반으로 줄었습니다.",
        body_en:
          "Typing `:smi` surfaces candidates and `Tab` commits. No panel needed, which halved the average time to insert.",
        media_url: null,
        media_kind: "video",
        repo_url: "https://github.com/xierrajeon",
      },
    }),
    block({
      id: "b4",
      sort_order: 3,
      type: "feature",
      data: {
        title_ko: "최근 사용 이모지 기억",
        title_en: "Remembers what you actually use",
        body_ko:
          "사용 기록을 IndexedDB에 남겨 빈도와 최근성을 함께 점수화합니다. 자주 쓰는 8개가 항상 첫 줄에 옵니다.",
        body_en:
          "Usage lands in IndexedDB and is scored on both frequency and recency, so your top eight always sit in the first row.",
        media_url: null,
        media_kind: "image",
        repo_url: null,
        reversed: true,
      },
    }),
    block({
      id: "b5",
      sort_order: 4,
      type: "heading",
      data: { text_ko: "구현 방식", text_en: "How it works", level: 2 },
    }),
    block({
      id: "b6",
      sort_order: 5,
      type: "text",
      data: {
        text_ko:
          "이모지 데이터는 1,800여 개라 전부 메모리에 올리면 초기 로딩이 느려집니다. 그래서 검색 인덱스만 먼저 올리고, 실제 렌더는 보이는 영역만 그립니다.",
        text_en:
          "There are ~1,800 emoji, so loading them all up front hurts startup. The search index loads first and only the visible rows ever render.",
      },
    }),
    block({
      id: "b7",
      sort_order: 6,
      type: "code",
      data: {
        language: "ts",
        filename: "useEmojiSearch.ts",
        code: `// 초성/영문 이름을 함께 색인해 "웃" 과 "smile" 둘 다 걸리게 한다.
const index = useMemo(
  () => buildIndex(emojiList, (e) => [e.name, e.nameKo, ...e.keywords]),
  [emojiList],
);

const results = useDeferredValue(
  query.length < 1 ? recents : index.search(query, { limit: 40 }),
);`,
        caption_ko: "검색은 deferred value로 감싸서 타이핑을 막지 않게 했습니다.",
        caption_en: "Search is wrapped in a deferred value so it never blocks typing.",
      },
    }),
    block({
      id: "b8",
      sort_order: 7,
      type: "callout",
      data: {
        icon: "💡",
        tone: "info",
        text_ko:
          "가상 스크롤을 직접 구현하려다, 그리드에서는 행 높이가 고정이라 `IntersectionObserver` 만으로 충분하다는 걸 확인하고 의존성을 하나 줄였습니다.",
        text_en:
          "I started writing a virtual scroller, then realised a fixed-height grid only needs `IntersectionObserver` — one dependency less.",
      },
    }),
    block({
      id: "b9",
      sort_order: 8,
      type: "heading",
      data: { text_ko: "사용 스택", text_en: "Stack", level: 2 },
    }),
    block({
      id: "b10",
      sort_order: 9,
      type: "stack",
      data: {
        groups: [
          {
            label_ko: "프론트엔드",
            label_en: "Frontend",
            items: ["React 19", "TypeScript", "Zustand", "Tailwind CSS"],
          },
          {
            label_ko: "저장 · 성능",
            label_en: "Storage & perf",
            items: ["IndexedDB", "IntersectionObserver", "useDeferredValue"],
          },
          {
            label_ko: "테스트",
            label_en: "Testing",
            items: ["Vitest", "Testing Library", "Playwright"],
          },
        ],
      },
    }),
    block({
      id: "b11",
      sort_order: 10,
      type: "link",
      data: {
        url: "https://github.com/xierrajeon",
        label_ko: "해당 기능 소스 보기",
        label_en: "Browse the source",
        description_ko: "피커 컴포넌트와 검색 인덱스 구현만 공개로 분리해 두었습니다.",
        description_en: "The picker component and search index are split out into a public repo.",
      },
    }),
  ],
  "portfolio-admin": [
    block({
      id: "pb1",
      project_id: "seed-p2",
      sort_order: 0,
      type: "text",
      data: {
        text_ko:
          "포트폴리오를 고칠 때마다 리포지토리를 열고 JSON을 편집하는 게 싫어서, 브라우저에서 이력과 프로젝트를 관리하는 어드민을 붙였습니다.",
        text_en:
          "I did not want to edit JSON in a repo every time my portfolio changed, so I bolted on an admin page that manages the resume and projects from the browser.",
      },
    }),
    block({
      id: "pb2",
      project_id: "seed-p2",
      sort_order: 1,
      type: "heading",
      data: { text_ko: "구조", text_en: "Architecture", level: 2 },
    }),
    block({
      id: "pb3",
      project_id: "seed-p2",
      sort_order: 2,
      type: "text",
      data: {
        text_ko:
          "GitHub Pages는 서버가 없으므로, 빌드 시점에 Supabase에서 데이터를 받아 HTML을 굽고(SEO), 방문자 브라우저에서 최신 데이터로 다시 맞춥니다(즉시 반영). 두 요구가 충돌하지 않게 하는 게 핵심이었습니다.",
        text_en:
          "GitHub Pages has no server, so HTML is baked from Supabase at build time for crawlers and re-synced client-side for visitors. Making those two requirements coexist was the whole problem.",
      },
    }),
  ],
};
