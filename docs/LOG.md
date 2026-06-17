# LOG (append-only)

docs 위키의 변경 로그. 의미 있는 변경마다 한 줄을 **추가만** 한다(기존 줄 수정·삭제 금지).
형식: `## [YYYY-MM-DD] {종류} | {요약}` — 종류: `ingest`(새 정본/결정) · `update`(정본 갱신) · `lint`(정합성 점검) · `promote`(ISSUE→RULES 승격).

## [2026-06-13] ingest | 역할별 docs 위키 구성(user·dev·design·security·agent) + LLM Wiki 라우팅·Refs·LOG 도입
## [2026-06-17] ingest | 환갑잔치 가족 안내 웹앱 설계 확정(/harness C) — office-hours+brainstorming. Approach A(Next.js+Upstash KV), 공용 비번 /admin, 라이브 타임라인, 다정 파스텔 큰글씨. design spec: docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md
## [2026-06-17] update | 정본 전체 작성(PRD·USER_JOURNEY·USER_FLOW·ARCHITECTURE·DB(KV)·API·CODING_CONVENTION·ENV·SEQUENCE_DIAGRAM·DESIGN_GUIDE·SCREENS·SCREEN_FLOW·SECURITY·ADR·RULES·STATE·ISSUES) + CLAUDE.md(스택·CRITICAL) 채움
## [2026-06-17] ingest | step3 public-timeline 구현 — 디자인 토큰(tailwind 팔레트·rem 타입스케일) + 공개 `/` 컴포넌트(StatusCard·DayTabs·TimelineList·TimelineItem·useNow·TimelineView)·page/loading/error. SCREENS 카피·R8(18px/48px) 준수, RTL+Playwright(iphone/android) green. 기존 정본과 일치(신규 결정 없음)
## [2026-06-17] update | step4 admin 구현 — AdminLogin/AdminForm(RTL TDD) + admin/page.tsx(서버 쿠키검증→폼/로그인 분기) + E2E admin.spec(오답거부·로그인→추가→저장→반영·stale 409). 로그인 쿠키 `Secure` 를 HTTPS 요청에만 부여하도록 보정(WebKit 이 http 에서 Secure 쿠키 폐기 → 로그인 후 전환 실패). SECURITY 인증 절에 반영
## [2026-06-17] ingest | step5 pwa 구현 — manifest.json(standalone·cream/coral·아이콘 192·512) + 아이콘 PNG(Node 생성) + layout.tsx 메타(theme-color·apple-touch-icon·apple-mobile-web-app-capable는 Next 미방출→`other`로 명시) + sw.js(앱 셸 cache-first, `/`·`/api/itinerary` 데이터 network-first 캐시폴백 — STATE 규칙 준수, 버전 캐시명+activate purge로 stale 방지) + SwRegister(TDD). E2E pwa.spec(iphone/android). 기존 정본(STATE SW 캐시 규칙)과 일치 — 신규 결정 없음
