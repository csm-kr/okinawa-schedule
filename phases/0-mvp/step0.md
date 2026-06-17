# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/user/PRD.md`
- `/docs/dev/ARCHITECTURE.md`
- `/docs/agent/ADR.md`
- `/docs/agent/RULES.md`
- `/docs/dev/CODING_CONVENTION.md`
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (설계 정본)
- `/CLAUDE.md` (§명령어 — 게이트가 파싱)
- `/.claude/hooks/tdd-guard.sh`, `/.claude/settings.json` (가드 동작 확인)

이 step은 **검증 도구 우선** 원칙에 따라, 기능 코드 전에 **Vitest + Playwright 검증 하니스와
가드 훅**을 먼저 세운다.

## 작업

이 프로젝트는 **이미 web/Next 스택**이므로 프레임워크 기본 가드(tdd-guard `.ts/.tsx`, 위험명령
차단, `.env` 차단, Stop 게이트)가 그대로 적합하다. 교체가 아니라 **세팅 + 동작 확인**이 목표다.

1. **Next.js 15 스캐폴드 (수동)** — 루트가 비어있지 않으므로(`docs/`, `.claude/`, `scripts/`,
   `CLAUDE.md`, `README.md` 존재) `create-next-app`으로 덮어쓰지 말고 수동 구성한다:
   - `package.json` scripts: `dev`(next dev), `build`(next build), `start`(next start),
     `lint`(next lint), `test`(vitest run).
   - 의존성: `next@15` `react` `react-dom` `typescript` `@types/react` `@types/node`
     `tailwindcss` `postcss` `autoprefixer` `eslint` `eslint-config-next`.
   - dev 의존성(테스트): `vitest` `@vitejs/plugin-react` `@testing-library/react`
     `@testing-library/jest-dom` `jsdom` `@playwright/test`.
   - `tsconfig.json`(strict: true), `next.config.mjs`, `tailwind.config.ts`(일단 기본,
     팔레트는 step3), `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`(placeholder
     "환갑잔치" 헤딩), `src/app/globals.css`.
   - 소스 루트는 `src/`.
2. **Vitest 설정** — `vitest.config.ts`(environment jsdom, `@vitejs/plugin-react`, setup에서
   `@testing-library/jest-dom`). `npm test`로 실행.
3. **Playwright 설정 (아이폰·안드로이드 기기 에뮬레이션)** — `playwright.config.ts`: `testDir: 'e2e'`,
   `webServer`로 `npm run build && npm run start`(포트 3000) 기동, headless. **`projects`를 모바일
   2종으로 정의**:
   - `iphone` — `...devices['iPhone 13']`(엔진=WebKit/Mobile Safari, iOS 거동 검증)
   - `android` — `...devices['Pixel 5']`(엔진=Chromium/Mobile Chrome)
   - (선택) `desktop` 프로젝트는 두지 않아도 됨 — 이 앱은 모바일 전용.
   브라우저 설치: `npx playwright install chromium webkit`(안드로이드=chromium, 아이폰=webkit).
4. **스모크 테스트(검증 하니스 동작 확인)**:
   - Vitest: `src/lib/smoke.test.ts` — 단순 통과 테스트(예: 순수 함수 호출 결과 단언).
   - Playwright: `e2e/smoke.spec.ts` — `/` 로드 후 "환갑잔치" 텍스트가 보이는지 단언. **iphone·android
     두 프로젝트 모두에서** 통과해야 한다.
5. **가드 동작 확인(수정하지 말 것)** — tdd-guard가 `types/`·`page.tsx`/`layout.tsx`·설정파일은
   면제하고, `lib/`·`components/`·`services/`·route handler의 `.ts/.tsx`는 대응 테스트가 없으면
   차단함을 인지한다(이후 step은 테스트 먼저 작성). `.claude/`·`docs/`는 수정하지 않는다.

> 코드 스니펫은 인터페이스/설정 수준만 제시하고, 구현체는 재량에 맡긴다. 단, `src/` 구조·스크립트
> 이름(`build`/`lint`/`test`)은 CLAUDE.md §명령어·게이트와 일치해야 하므로 바꾸지 마라.

## Acceptance Criteria

```bash
npm run build          # Next 프로덕션 빌드/타입체크 통과
npm test               # Vitest 스모크 통과
npx playwright install chromium webkit   # 아이폰(webkit)·안드로이드(chromium) 엔진 설치
npx playwright test    # iphone·android 두 프로젝트에서 스모크 E2E 통과
npm run lint           # ESLint 통과
```

## 검증 절차

1. **AC 리뷰·보정** — 이 step은 검증 도구(Vitest·Playwright)를 **구축하는** step이다. 위 4개 커맨드가
   실제로 green인지 확인한다. Playwright는 `npx playwright install chromium` 선행.
2. 위 AC 커맨드를 실행한다.
3. 아키텍처 체크리스트:
   - `docs/dev/ARCHITECTURE.md` 디렉토리 구조(`src/app|components|types|lib|services`)를 따르는가?
   - 스택이 `docs/agent/ADR.md`(Next15+TS+Tailwind)와 일치하는가?
   - `.claude/`·`docs/`를 건드리지 않았는가?
4. 결과를 `phases/0-mvp/index.json`의 step0에 반영(`completed`+`summary` / `error` / `blocked`).

## 금지사항

- `create-next-app`으로 현재 디렉토리를 덮어쓰지 마라. 이유: `docs/`·`.claude/`·`scripts/` 정본·가드가
  삭제될 위험.
- `.claude/`·`docs/`·`scripts/`·`CLAUDE.md §명령어`를 수정하지 마라. 이유: C에서 확정된 가드·게이트
  규칙이며 변경 시 이후 step 검증이 깨진다.
- 기능 화면/로직을 이 step에서 구현하지 마라. 이유: 이 step의 책임은 검증 하니스·스캐폴드뿐이다.
- 기존 테스트를 깨뜨리지 마라.
