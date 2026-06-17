# Step 5: pwa

## 읽어야 할 파일

- `/docs/user/PRD.md` (핵심기능4 = PWA 홈화면)
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§PWA & 접근성 디테일)
- `/docs/design/DESIGN_GUIDE.md` (theme_color #E07A5F, background #FFF9F3)
- `/docs/agent/STATE.md` (SW 데이터 캐시 = network-first)
- step3·step4 산출물: `app/layout.tsx`, 공개·admin 화면

**웹 AC는 Playwright.**

## 작업

홈화면 추가(PWA) + 오프라인 회복용 service worker.

1. **manifest** `public/manifest.json`: `name`="환갑잔치 안내", `short_name`="환갑잔치",
   `display`="standalone", `start_url`="/", `background_color`="#FFF9F3",
   `theme_color`="#E07A5F", `icons`(192·512 PNG — `public/icon-192.png`·`icon-512.png` 생성).
2. **메타** `src/app/layout.tsx`(면제): manifest 링크, `apple-touch-icon`,
   `apple-mobile-web-app-capable`, `theme-color`. (Next `metadata`/`viewport` API 사용 가능.)
3. **service worker** `public/sw.js` + 등록(클라이언트 컴포넌트 `src/components/sw-register.tsx`,
   테스트 먼저): 앱 셸은 캐시, **일정 데이터(`/api/itinerary`·`/`)는 network-first(캐시 폴백)**.
4. **E2E** `e2e/pwa.spec.ts`: `/`에 manifest 링크·`theme-color` 메타 존재, manifest 200 응답,
   모바일 뷰포트(예: iPhone)에서 렌더 깨지지 않음. (가능하면 SW 등록 확인.)

## Acceptance Criteria

```bash
npx playwright test e2e/pwa.spec.ts   # 웹 AC: manifest·메타·모바일 뷰포트
npm run build
npm run lint
```

UI 영향 step이므로 DESIGN_GUIDE 토큰(theme/background 색) 일치 + `/design-review`(선택).

## 검증 절차

1. **AC 리뷰·보정** — Playwright로 manifest/메타/모바일 렌더를 검증하는지 확인.
2. 위 커맨드 실행.
3. 아키텍처 체크리스트: SW가 데이터에 network-first인가(STATE)? manifest 색이 DESIGN_GUIDE와 일치?
4. `phases/0-mvp/index.json` step5 갱신.

## 금지사항

- SW에서 일정 데이터를 cache-first로 제공하지 마라. 이유: 편집 반영이 지연되어 가족이 옛 일정을
  본다(STATE network-first 규칙).
- 캐시가 빌드 간 stale 되지 않게 버전/이름을 관리하라(낡은 셸 고착 금지).
- 기존 테스트를 깨뜨리지 마라.
