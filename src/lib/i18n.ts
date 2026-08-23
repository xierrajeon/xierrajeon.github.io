import type { DatePrecision, Lang } from "./types";

/**
 * Picks the field for the active language, falling back to the other one so a
 * half-translated entry renders real text instead of a blank.
 */
export function tr(
  ko: string | null | undefined,
  en: string | null | undefined,
  lang: Lang,
): string {
  const primary = lang === "ko" ? ko : en;
  const secondary = lang === "ko" ? en : ko;
  return primary?.trim() || secondary?.trim() || "";
}

export const DEFAULT_LANG: Lang = "ko";

export const LANGS: Lang[] = ["ko", "en"];

/** UI chrome strings. Content strings live in the database. */
export const dict = {
  ko: {
    "nav.resume": "이력",
    "nav.portfolio": "포트폴리오",
    "nav.menu": "메뉴",
    "nav.skipToContent": "본문으로 건너뛰기",

    "theme.toggle": "테마 전환",
    "lang.toggle": "언어 전환",

    "resume.career": "경력",
    "resume.education": "학력",
    "resume.award": "수상 이력",
    "resume.activity": "활동 이력",
    "resume.skills": "기술 스택",
    "resume.gpa": "학점",
    "resume.linkedProjects": "프로젝트 · 기술수행",
    "resume.credentialId": "자격 · 특허번호",
    "resume.score": "점수",
    "resume.certificate": "증빙 이미지",

    "major.primary": "주전공",
    "major.double": "복수전공",
    "major.dual": "이중전공",
    "major.minor": "부전공",

    "enrollment.enrolled": "재학중",
    "enrollment.on_leave": "휴학중",
    "enrollment.graduated": "졸업",
    "enrollment.expected": "졸업예정",
    "enrollment.withdrawn": "중퇴",

    "resume.contact": "연락처",
    "resume.print": "PDF로 저장",
    "resume.downloadPdf": "이력서 PDF",
    "profile.status": "새로운 기회를 찾는 중",
    "profile.contactMe": "Contact",
    "profile.downloadResume": "이력서 다운로드",
    "profile.email": "Email",
    "profile.phone": "Phone",
    "profile.website": "Website",
    "profile.likes": "명이 이 페이지를 좋아합니다",
    "profile.likeAria": "이 페이지 좋아요",
    "resume.present": "현재",
    "resume.working": "재직 중",
    "resume.ongoing": "지속 중",
    "resume.empty": "아직 등록된 항목이 없습니다.",

    "portfolio.title": "포트폴리오",
    "portfolio.subtitle": "직접 만들고, 붙이고, 고쳐본 것들",
    "portfolio.all": "전체",
    "portfolio.count": "개 프로젝트",
    "portfolio.empty": "아직 공개된 프로젝트가 없습니다.",
    "portfolio.filterByStack": "스택으로 필터",
    "portfolio.featured": "대표",
    "portfolio.details": "상세보기",

    "project.backToList": "포트폴리오로 돌아가기",
    "project.toc": "목차",
    "project.repo": "GitHub",
    "project.demo": "라이브 데모",
    "project.period": "기간",
    "project.role": "역할",
    "project.team": "팀 규모",
    "project.stack": "사용 스택",
    "project.teamUnit": "명",
    "project.viewCode": "코드 보기",
    "project.notFound": "프로젝트를 찾을 수 없습니다.",
    "project.loading": "불러오는 중…",

    "notFound.title": "페이지를 찾을 수 없습니다",
    "notFound.body": "주소가 바뀌었거나 삭제된 페이지입니다.",
    "notFound.home": "이력서로 이동",

    "cta.title": "함께 일하고 싶으신가요?",
    "cta.body":
      "프로젝트 문의나 채용 관련 연락은 아래 이메일로 보내주시면 빠르게 답변 드리겠습니다.",
    "cta.button": "이메일 보내기",
    "footer.rights": "All rights reserved.",

    "common.loading": "불러오는 중…",
    "common.error": "데이터를 불러오지 못했습니다.",
    "common.retry": "다시 시도",
    "common.close": "닫기",
    "common.expand": "펼치기",
    "common.collapse": "접기",
  },
  en: {
    "nav.resume": "Resume",
    "nav.portfolio": "Portfolio",
    "nav.menu": "Menu",
    "nav.skipToContent": "Skip to content",

    "theme.toggle": "Toggle theme",
    "lang.toggle": "Toggle language",

    "resume.career": "Experience",
    "resume.education": "Education",
    "resume.award": "Awards",
    "resume.activity": "Activities",
    "resume.skills": "Skills",
    "resume.gpa": "GPA",
    "resume.linkedProjects": "Projects & Work",
    "resume.credentialId": "Credential / Patent No.",
    "resume.score": "Score",
    "resume.certificate": "certificate image",

    "major.primary": "Major",
    "major.double": "Double Major",
    "major.dual": "Dual Major",
    "major.minor": "Minor",

    "enrollment.enrolled": "Enrolled",
    "enrollment.on_leave": "On leave",
    "enrollment.graduated": "Graduated",
    "enrollment.expected": "Expected graduation",
    "enrollment.withdrawn": "Withdrawn",

    "resume.contact": "Contact",
    "resume.print": "Save as PDF",
    "resume.downloadPdf": "Resume PDF",
    "profile.status": "OPEN TO WORK",
    "profile.contactMe": "Contact",
    "profile.downloadResume": "Download Resume",
    "profile.email": "Email",
    "profile.phone": "Phone",
    "profile.website": "Website",
    "profile.likes": "people like this page",
    "profile.likeAria": "Like this page",
    "resume.present": "Present",
    "resume.working": "Present",
    "resume.ongoing": "Ongoing",
    "resume.empty": "Nothing here yet.",

    "portfolio.title": "Portfolio",
    "portfolio.subtitle": "Things I designed, shipped and rewrote",
    "portfolio.all": "All",
    "portfolio.count": " projects",
    "portfolio.empty": "No published projects yet.",
    "portfolio.filterByStack": "Filter by stack",
    "portfolio.featured": "Featured",
    "portfolio.details": "Details",

    "project.backToList": "Back to portfolio",
    "project.toc": "Contents",
    "project.repo": "GitHub",
    "project.demo": "Live demo",
    "project.period": "Period",
    "project.role": "Role",
    "project.team": "Team",
    "project.stack": "Stack",
    "project.teamUnit": "",
    "project.viewCode": "View code",
    "project.notFound": "Project not found.",
    "project.loading": "Loading…",

    "notFound.title": "Page not found",
    "notFound.body": "The address changed, or this page was removed.",
    "notFound.home": "Go to resume",

    "cta.title": "Want to work together?",
    "cta.body":
      "For project enquiries or hiring, send me an email below and I will get back to you quickly.",
    "cta.button": "Send an email",
    "footer.rights": "All rights reserved.",

    "common.loading": "Loading…",
    "common.error": "Failed to load data.",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.expand": "Expand",
    "common.collapse": "Collapse",
  },
} as const;

export type DictKey = keyof (typeof dict)["ko"];

export function translate(lang: Lang, key: DictKey): string {
  return dict[lang][key] ?? dict.ko[key] ?? key;
}

/* ---------------------------------------------------------------------------
 * Date formatting
 *
 * Dates are stored as ISO date strings and are parsed manually rather than with
 * `new Date(str)` so a "2021-03-01" row never shifts to February in a timezone
 * behind UTC.
 * ------------------------------------------------------------------------- */

function parseIsoDate(
  value: string,
): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function formatDate(
  value: string | null | undefined,
  lang: Lang,
  precision: DatePrecision = "month",
): string {
  if (!value) return "";
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  const { y, m, d } = parsed;
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");

  if (lang === "ko") {
    if (precision === "year") return `${y}`;
    if (precision === "month") return `${y}.${mm}`;
    return `${y}.${mm}.${dd}`;
  }
  const monthName = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m - 1];
  if (precision === "year") return `${y}`;
  if (precision === "month") return `${monthName} ${y}`;
  return `${monthName} ${d}, ${y}`;
}

/**
 * "2021.03 – 2023.02" / "2023.03 – 현재" / "2024.05" (single-point events).
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent: boolean,
  lang: Lang,
  precision: DatePrecision = "month",
): string {
  const from = formatDate(start, lang, precision);
  if (!from) return "";
  if (isCurrent) return `${from} – ${translate(lang, "resume.present")}`;
  const to = formatDate(end, lang, precision);
  if (!to || to === from) return from;
  return `${from} – ${to}`;
}

/** "3년 2개월" / "3 yrs 2 mos", shown next to career entries. */
export function formatDuration(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent: boolean,
  lang: Lang,
  /** Injected so build output stays deterministic where it matters. */
  now?: { y: number; m: number },
): string {
  if (!start) return "";
  const from = parseIsoDate(start);
  if (!from) return "";

  let to: { y: number; m: number };
  if (isCurrent || !end) {
    if (!isCurrent) return "";
    to = now ?? currentYearMonth();
  } else {
    const parsedEnd = parseIsoDate(end);
    if (!parsedEnd) return "";
    to = { y: parsedEnd.y, m: parsedEnd.m };
  }

  const months = (to.y - from.y) * 12 + (to.m - from.m) + 1;
  if (months <= 0) return "";
  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (lang === "ko") {
    if (years && rest) return `${years}년 ${rest}개월`;
    if (years) return `${years}년`;
    return `${rest}개월`;
  }
  if (years && rest)
    return `${years} yr${years > 1 ? "s" : ""} ${rest} mo${rest > 1 ? "s" : ""}`;
  if (years) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${rest} mo${rest > 1 ? "s" : ""}`;
}

function currentYearMonth(): { y: number; m: number } {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

/**
 * "3.80 / 4.5". The score keeps two decimals because a resume distinguishes
 * 3.80 from 3.8x, while the scale is written as typed (4.5, not 4.50).
 */
export function formatGpa(
  gpa: number | string | null | undefined,
  scale: number | string | null | undefined,
): string {
  // Postgres `numeric` can arrive as a string, so both inputs are coerced.
  const score = Number(gpa);
  if (gpa === null || gpa === undefined || gpa === "" || Number.isNaN(score)) {
    return "";
  }
  const max = Number(scale);
  if (!max || Number.isNaN(max)) return score.toFixed(2);
  // `String(4.5)` → "4.5" and `String(4)` → "4"; a scale never needs padding.
  return `${score.toFixed(2)} / ${max}`;
}
