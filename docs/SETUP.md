# 셋업 가이드

한 번만 하면 되는 설정입니다. 순서대로 진행하세요.

## 1. Supabase 스키마 생성

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. [`supabase/schema.sql`](../supabase/schema.sql) 전체를 복사해서 붙여넣고 **Run**
3. 같은 SQL Editor에서 아래를 실행해 본인 계정을 관리자로 등록 (이메일은 3번에서 만들 로그인 계정과 동일해야 합니다)

```sql
insert into public.admins (email) values ('your-login@example.com')
on conflict (email) do nothing;
```

> 이 이메일은 리포지토리에 커밋하지 마세요. SQL Editor에서만 직접 실행합니다.

## 2. 공개 회원가입 차단

**Authentication → Sign In / Providers → Email** 에서

- `Confirm email` 은 켜둔 채로,
- **Allow new users to sign up** 을 **끄기**

관리자 계정 하나만 존재해야 하므로, 계정을 먼저 만든 뒤(3번) 이 옵션을 끄는 게 편합니다.

## 3. 관리자 계정 만들기

**Authentication → Users → Add user → Create new user**

- Email: 1번에서 `admins` 에 넣은 이메일
- Password: 원하는 비밀번호
- `Auto Confirm User` 체크

이 계정으로 `/admin` 에 로그인합니다.

## 4. 로컬 환경변수

```bash
cp .env.example .env.local
```

`.env.local` 에 **Settings → Data API** 의 `Project URL` 과 **Settings → API Keys** 의 `anon public` 키를 채웁니다. (`.env.local` 은 git에 올라가지 않습니다.)

```bash
npm run dev
```

- 공개 사이트: http://localhost:3000
- 어드민: http://localhost:3000/admin

## 5. GitHub Actions 시크릿

리포지토리 → **Settings → Secrets and variables → Actions → New repository secret** 로 두 개 등록:

| 이름 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 |

빌드 시점에 Supabase에서 데이터를 읽어 HTML을 굽기 때문에(SEO용) 이 값이 필요합니다.

## 6. GitHub Pages 활성화

리포지토리 → **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경.

이후 `main` 에 push하면 자동 배포됩니다.

## 7. (선택) 어드민 "재배포" 버튼

어드민에서 저장한 내용은 방문자에게 **즉시** 보입니다. 다만 검색엔진 크롤러가 보는 정적 HTML은 다음 빌드 때 갱신되므로, 어드민 설정 화면에서 재배포를 눌러 갱신할 수 있습니다.

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Repository access: `xierrajeon/xierrajeon.github.io` 만 선택
3. Permissions → Repository permissions → **Contents: Read and write** (`repository_dispatch` 발송에 필요)
4. 생성된 토큰을 어드민 → 설정 화면에 붙여넣기

토큰은 브라우저 localStorage에만 저장되며 DB나 리포지토리에는 저장되지 않습니다. 기기를 바꾸면 다시 입력해야 합니다.

## 무료 티어 주의사항

- Storage 1GB / 월 egress 5GB. **긴 영상은 유튜브에 올리고 링크만 붙이세요.** 어드민 영상 블록이 유튜브·Vimeo URL을 지원합니다. 직접 업로드는 짧은 기능 시연 클립(수 MB) 용도로만 쓰는 걸 권합니다.
- 이미지는 어드민에서 업로드할 때 브라우저에서 자동으로 리사이즈·WebP 변환됩니다(Supabase 이미지 변환은 유료라 클라이언트에서 처리).
- 무료 프로젝트는 일정 기간 요청이 전혀 없으면 일시정지됩니다. 사이트에 방문자가 있으면 문제되지 않습니다.
