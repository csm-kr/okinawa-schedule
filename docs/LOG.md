# LOG (append-only)

docs 위키의 변경 로그. 의미 있는 변경마다 한 줄을 **추가만** 한다(기존 줄 수정·삭제 금지).
형식: `## [YYYY-MM-DD] {종류} | {요약}` — 종류: `ingest`(새 정본/결정) · `update`(정본 갱신) · `lint`(정합성 점검) · `promote`(ISSUE→RULES 승격).

## [2026-06-13] ingest | 역할별 docs 위키 구성(user·dev·design·security·agent) + LLM Wiki 라우팅·Refs·LOG 도입
## [2026-06-17] ingest | 환갑잔치 가족 안내 웹앱 설계 확정(/harness C) — office-hours+brainstorming. Approach A(Next.js+Upstash KV), 공용 비번 /admin, 라이브 타임라인, 다정 파스텔 큰글씨. design spec: docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md
## [2026-06-17] update | 정본 전체 작성(PRD·USER_JOURNEY·USER_FLOW·ARCHITECTURE·DB(KV)·API·CODING_CONVENTION·ENV·SEQUENCE_DIAGRAM·DESIGN_GUIDE·SCREENS·SCREEN_FLOW·SECURITY·ADR·RULES·STATE·ISSUES) + CLAUDE.md(스택·CRITICAL) 채움
## [2026-06-17] ingest | step3 public-timeline 구현 — 디자인 토큰(tailwind 팔레트·rem 타입스케일) + 공개 `/` 컴포넌트(StatusCard·DayTabs·TimelineList·TimelineItem·useNow·TimelineView)·page/loading/error. SCREENS 카피·R8(18px/48px) 준수, RTL+Playwright(iphone/android) green. 기존 정본과 일치(신규 결정 없음)
## [2026-06-17] update | step4 admin 구현 — AdminLogin/AdminForm(RTL TDD) + admin/page.tsx(서버 쿠키검증→폼/로그인 분기) + E2E admin.spec(오답거부·로그인→추가→저장→반영·stale 409). 로그인 쿠키 `Secure` 를 HTTPS 요청에만 부여하도록 보정(WebKit 이 http 에서 Secure 쿠키 폐기 → 로그인 후 전환 실패). SECURITY 인증 절에 반영
## [2026-06-17] ingest | step5 pwa 구현 — manifest.json(standalone·cream/coral·아이콘 192·512) + 아이콘 PNG(Node 생성) + layout.tsx 메타(theme-color·apple-touch-icon·apple-mobile-web-app-capable는 Next 미방출→`other`로 명시) + sw.js(앱 셸 cache-first, `/`·`/api/itinerary` 데이터 network-first 캐시폴백 — STATE 규칙 준수, 버전 캐시명+activate purge로 stale 방지) + SwRegister(TDD). E2E pwa.spec(iphone/android). 기존 정본(STATE SW 캐시 규칙)과 일치 — 신규 결정 없음
## [2026-06-17] update | step6 deploy-prep — env.example(키만, STORAGE_DRIVER=upstash + URL·TOKEN·ADMIN_PASSWORD·ADMIN_COOKIE_SECRET 값 비움) + README §배포(Upstash→Vercel 레포 연결→환경변수 5개→배포·카톡 공유→/admin 일정 입력, 로컬 memory). ENV.md 파일명 참조를 `.env.example`→`env.example`(가드가 `.env*` 차단)로 보정. 비밀 미커밋(R4)·.env 미생성. build green·playwright 25 passed. 실제 계정·시크릿 주입은 사용자 개입(배포 미실행)
## [2026-06-18] update | README 앱 중심 전면 개편 — 0-mvp 완료 반영. 환갑잔치 웹앱 소개(핵심 기능·화면·스택·데이터 모델·API·환경변수·배포·디자인)로 재작성, Harness 프레임워크 설명은 "개발 방식" 짧은 섹션+docs 링크로 축소. 신규 결정 없음(정본 반영만)
## [2026-06-18] decision | 날짜별 동선 지도 + 항목 🔗 링크 추가(ADR-008) — `ScheduleItem`에 optional url·lat·lng(types+Zod+DB.md). 순수 로직 `lib/map.ts`(dayRoute·pointAlongPath, TDD), `DayMap`(Leaflet+OSM 클라이언트 전용, 번호 마커+polyline+이동 마커 ✈️/🚌 rAF, prefers-reduced-motion 존중)→TimelineView 통합. timeline-item 🔗(새 탭, 탭영역 48px). 초기 "지도 비목표"(PRD) 일부 번복→PRD 핵심기능5 추가·비목표는 "턴바이턴 길찾기"로 한정. spec: specs/2026-06-18-day-route-map-design.md. unit 100 passed
## [2026-06-18] decision | 볼드 모던 리디자인(ADR-009) — 공개 화면 글래스/그라데이션/글로우/모션 + 현재시간 시머·"지금 ✨" 강조 + 🚗 동선 + 지도 번호마커 클릭→링크(dayRoutePoints TDD). 색은 인디고·아이보리 시안 시험 후 크림+살구/코랄 모던으로 정리. 어드민에 위도·경도·링크 입력칸 추가. 접근성(18px/48px/대비/reduced-motion) 유지. DESIGN_GUIDE 안티슬롭표 재구성·PRD 디자인방향·tailwind/globals 정본화. unit 103 green, 토큰값 정본=tailwind.config.ts/globals.css
