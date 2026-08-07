# xierrajeon.github.io

개발자 이력서 · 포트폴리오. GitHub Pages에 정적 배포되고, 내용은 `/admin` 에서 관리합니다.

- **공개 사이트** — https://xierrajeon.github.io
- **어드민** — https://xierrajeon.github.io/admin (Supabase 로그인)
- **셋업 순서** — [docs/SETUP.md](docs/SETUP.md)

## 구조

```
src/app/(site)/          공개 페이지 — 이력서 탭 / 포트폴리오 탭 / 프로젝트 상세
src/app/admin/           어드민 (클라이언트 전용, RLS로 보호)
src/app/not-found.tsx    404.html — 아직 빌드되지 않은 프로젝트를 즉시 렌더
src/components/          UI. 공개 컴포넌트를 어드민 미리보기에서 그대로 재사용
src/lib/                 타입 · 쿼리 · i18n · 업로드
supabase/schema.sql      테이블 · RLS · 스토리지 (SQL Editor에 붙여넣기)
```

## 왜 이렇게 만들었나

**GitHub Pages는 서버가 없다.** 그래서 SEO와 "저장하면 즉시 반영"이 정면으로 충돌합니다.
빌드 시점에 Supabase에서 데이터를 읽어 HTML을 굽고(크롤러가 보는 것),
방문자 브라우저에서 최신 데이터로 다시 맞춥니다(사람이 보는 것).
새로 만든 프로젝트는 정적 파일이 아직 없으므로 `404.html` 이 슬러그를 읽어
클라이언트에서 렌더하고, 어드민의 재배포 버튼이 정적 파일을 따라오게 합니다.

**publishable 키는 번들에 들어간다.** 브라우저가 Supabase에 직접 요청하니 숨길 수 없고,
숨길 필요도 없습니다. 실제 방어선은 RLS입니다 — 익명 키로는 `is_published = true` 행만
읽히고, 쓰기는 `admins` 테이블에 등록된 이메일로 로그인해야 합니다.
`service_role` 키는 이 프로젝트에서 쓰지 않습니다.

**이미지는 업로드 전에 브라우저에서 줄인다.** Supabase 이미지 변환은 유료 기능이라,
어드민이 canvas로 WebP 변환·축소한 뒤 올립니다. 원본 크기를 함께 저장해
공개 페이지가 로딩 전에 자리를 잡습니다(CLS 0).

**유튜브 iframe은 클릭 후에 붙인다.** 보기도 전에 1MB 스크립트를 받는 게
성능 점수를 깎는 가장 쉬운 방법이라, 포스터만 먼저 보여줍니다.

## 개발

```bash
npm install
cp .env.example .env.local   # Supabase URL / anon key 채우기
npm run dev
```

```bash
npm run build                # out/ 에 정적 파일 생성
```

`main` 에 push하면 [GitHub Actions](.github/workflows/deploy.yml)가 빌드해서 Pages에 배포합니다.

## Lighthouse (desktop, 정적 빌드 기준)

| 페이지 | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 96 | 100 |
| `/portfolio` | 99 | 100 | 96 | 100 |
| `/projects/[slug]` | 100 | 100 | 96 | 100 |

Best Practices 96은 Supabase 테이블이 아직 없어 발생한 콘솔 404 때문이며,
`supabase/schema.sql` 을 적용하면 사라집니다.
