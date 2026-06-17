# Step 3: public-timeline

## 읽어야 할 파일

- `/docs/user/PRD.md` · `/docs/user/USER_FLOW.md` (플로우1 핵심 경로)
- `/docs/design/DESIGN_GUIDE.md` (팔레트·타입스케일·버튼·슬롭 금지)
- `/docs/design/SCREENS.md` (화면1 구성·카피) · `/docs/design/SCREEN_FLOW.md`
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§화면1·§인터랙션)
- `/docs/agent/RULES.md` (R8 접근성)
- step1·step2 산출물: `src/types`, `src/lib/status.ts`, `src/services/storage`, `app/api/itinerary`

**웹 AC는 Playwright.** 컴포넌트 단위는 RTL(테스트 먼저, tdd-guard), 사용자 흐름은 Playwright E2E.

## 작업

공개 `/` 화면. 서버 컴포넌트가 데이터를 읽고, 클라이언트가 "지금"을 30–60초마다 재계산.

1. **디자인 토큰** `tailwind.config.ts` + `src/app/globals.css`: 팔레트(`cream #FFF9F3`,
   `ink #3D3430`, `ink-muted #8A7F76`, `coral #E07A5F`, `coral-strong #C75B43`, `surface #FFFFFF`,
   `line #EFE4DA`), 타입스케일(본문≥18px, 시간 22/제목 21/상태카드 26), rem 기반.
2. **컴포넌트**(각각 테스트 먼저 — 예 `src/components/status-card.test.tsx`):
   - `TimelineItem.tsx` — `status`(past/current/upcoming)별 스타일(past=ink-muted+○, current=좌측
     coral 바+굵게+큰글씨+"지금"뱃지+●, upcoming=ink+◌).
   - `TimelineList.tsx` — 한 day의 items를 startTime 오름차순 렌더.
   - `DayTabs.tsx` — 날짜 탭(높이≥48px, 선택 강조), 선택 변경 콜백.
   - `StatusCard.tsx` — `findCurrentAndNext`/`getEventPhase` 결과로 "지금 진행 중 / 다음 ▸ / 행사
     전·후" 표시(26/700).
   - `useNow.ts`(훅, 테스트 먼저) — 30–60초 간격으로 현재 시각 tick 반환.
3. **`src/app/page.tsx`**(면제) — 서버 컴포넌트에서 `getStore().get()`으로 읽어 전달. 기본 선택
   날짜 = 오늘(기간 밖이면 1일차). 클라이언트 래퍼가 `useNow`로 강조 갱신.
4. **상태 화면**: `loading.tsx`·`error.tsx`(면제), 빈 상태 "아직 등록된 일정이 없어요"(SCREENS 카피).
5. **E2E** `e2e/timeline.spec.ts`: `STORAGE_DRIVER=memory`로 기동, `beforeEach`에서 login+PUT로
   일정 시드, `page.clock.setFixedTime`으로 시각 고정 → StatusCard가 기대한 current를 강조, 날짜 탭
   전환, 본문 font-size≥18px·터치타깃≥48px 단언.

## Acceptance Criteria

```bash
npx playwright test e2e/timeline.spec.ts   # 웹 AC: 타임라인·강조·탭 (page.clock 고정시간)
npm test                                   # 컴포넌트 RTL + useNow
npm run build
npm run lint
```

UI 변경 step이므로 **디자인 리뷰 AC**도 통과해야 한다:
- DESIGN_GUIDE 토큰·타입스케일 준수(본문≥18px, 살구는 면에만, 글자는 ink/coral-strong).
- AI 슬롭 안티패턴 미사용(glassmorphism·gradient-text·보라/인디고·균일 rounded-2xl·gradient orb 등).
- SCREENS.md 카피·구성과 일치.
- gstack `/design-review`로 변경 화면 검증.

## 검증 절차

1. **AC 리뷰·보정** — Playwright(step0 구축)로 USER_FLOW 플로우1을 재현하는지 확인. 시각 의존
   검증은 `page.clock`으로 결정론적이어야 한다. 컴포넌트는 E2E가 아니라 RTL로 검증(레이어 분리).
2. 위 커맨드 실행 + `/design-review`.
3. 아키텍처 체크리스트: 서버에서만 store 접근(R1)? 토큰·타입 일치(step1·2 시그니처)? R8 접근성?
4. `phases/0-mvp/index.json` step3 갱신.

## 금지사항

- 컴포넌트 단위 검증을 Playwright로만 하지 마라. 이유: harness 레이어 규칙 — 컴포넌트=RTL,
  흐름=Playwright.
- 살구(#E07A5F)를 본문/버튼 글자색으로 쓰지 마라. 이유: 크림 위 대비 부족 → coral-strong 사용(R8).
- 본문 18px 미만, 터치타깃 48px 미만 금지. 이유: 어르신 가독성(R8).
- 클라이언트에서 KV 직접 호출 금지(R1).
- 기존 테스트를 깨뜨리지 마라.
