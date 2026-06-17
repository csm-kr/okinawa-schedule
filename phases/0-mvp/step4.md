# Step 4: admin

## 읽어야 할 파일

- `/docs/user/USER_FLOW.md` (플로우2 편집 경로)
- `/docs/design/SCREENS.md` (화면2·3 구성·카피) · `/docs/design/DESIGN_GUIDE.md` (버튼 56px)
- `/docs/dev/API.md` (login·PUT·409) · `/docs/security/SECURITY.md`
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§화면2·§동시 편집)
- `/docs/agent/RULES.md` (R3·R5·R8)
- step2·step3 산출물: `app/api/admin/login`, `app/api/itinerary`, 공개 컴포넌트·토큰

**웹 AC는 Playwright.** 컴포넌트는 RTL 먼저, 편집 흐름은 Playwright E2E.

## 작업

`/admin` 비밀번호 로그인 + 일정 편집(추가/수정/삭제/저장). 낙관적 동시성.

1. **컴포넌트**(각각 테스트 먼저):
   - `AdminLogin.tsx` — "가족 비밀번호" 입력 + "들어가기"(56px). 오답 시 흔들림 + "비밀번호가 달라요".
     제출 → `POST /api/admin/login`.
   - `AdminForm.tsx` — 날짜 탭, 항목 편집(시각=`<input type="time">`, 제목·장소·메모=큰 필드),
     `[+ 일정 추가]`, 항목 `[삭제]`(분리 배치), 하단 고정 `[저장]`(56px). 로드 시 `version` 보관 →
     `PUT /api/itinerary`에 `expectedVersion`으로 전송. 409 → "다른 곳에서 일정이 바뀌었어요…" 안내.
     성공 → "저장됐어요" 토스트. 시각순 자동정렬(드래그 정렬 없음).
2. **`src/app/admin/page.tsx`**(면제) — 서버에서 세션 쿠키 검증 → 있으면 AdminForm(현재 일정 주입),
   없으면 AdminLogin 렌더.
3. **E2E** `e2e/admin.spec.ts`(`STORAGE_DRIVER=memory`):
   - 오답 비밀번호 → 거부.
   - 정답 → 편집 화면 → 항목 추가 → 저장 → `/`로 이동해 **반영 확인**.
   - 409 경로: 저장 후 stale `version`으로 재저장 시 충돌 안내.

## Acceptance Criteria

```bash
npx playwright test e2e/admin.spec.ts   # 웹 AC: 로그인·추가·저장→공개 반영·409
npm test                                # AdminLogin/AdminForm RTL
npm run build
npm run lint
```

UI 변경 step이므로 **디자인 리뷰 AC**도 통과:
- 버튼 56px·터치타깃≥48px·본문≥18px, 토큰 준수, 슬롭 금지(DESIGN_GUIDE).
- SCREENS.md 화면2·3 카피 일치.
- gstack `/design-review`로 검증.

## 검증 절차

1. **AC 리뷰·보정** — Playwright로 USER_FLOW 플로우2(로그인→편집→저장→반영)를 재현하는지 확인.
2. 위 커맨드 + `/design-review`.
3. 아키텍처 체크리스트: 쓰기 인증을 **서버 route**에서 검증(R3)? `expectedVersion` 전송(R5)?
   API 시그니처(step2)와 일치? R8 접근성?
4. `phases/0-mvp/index.json` step4 갱신.

## 금지사항

- admin 인증을 클라이언트에서만 판단하지 마라. 이유: R3 — 서버 route가 쿠키를 검증해야 우회 불가.
- 저장 시 `expectedVersion`을 빼지 마라. 이유: R5 — 동시 편집 덮어쓰기.
- 비밀번호·쿠키 시크릿을 클라이언트 번들/로그에 노출하지 마라. 이유: R4.
- 버튼/글자 규격(56px·≥18px)을 줄이지 마라. 이유: R8 어르신 가독성.
- 기존 테스트를 깨뜨리지 마라.
