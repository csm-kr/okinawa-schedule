# 프로젝트: 칠순잔치 가족 안내 웹앱

> 조인수·김인숙 여사님 칠순잔치 겸 가족 여행 일정을 가족이 링크 하나로 확인하는 모바일 웹앱 — 회원가입 없음, PWA, 현재 시각 기준 라이브 타임라인 (web 풀스택)

## 📚 LLM Wiki — 이 CLAUDE.md 는 얇은 라우터다

`docs/` 가 **정본(source of truth)**인 라이브 위키다([패턴](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). 세부 규칙·근거는 docs에 있고, 여기엔 **non-negotiable 요약 + 라우팅**만 둔다. 3계층: **원천**(요구사항 원문·외부 자료, 불변) · **위키**(`docs/`, LLM이 소유·Refs로 교차연결) · **스키마**(이 파일).

1. **Read order** — ① CLAUDE.md → ② [docs/INDEX.md](./docs/INDEX.md)(인덱스) → ③ `phases/index.json`(현재 진행 step) → ④ 관련 정본(아래 라우팅) → ⑤ 필요 시 세부 문서 → ⑥ 변경 시 해당 정본 + [docs/LOG.md](./docs/LOG.md) 갱신.
2. **불변 규칙 우선** — 모든 작업은 [docs/agent/RULES.md](./docs/agent/RULES.md)와 이 파일의 CRITICAL을 최우선으로 지킨다.
3. **유지보수 루프 (ingest → query → lint)** — 결정/변경이 생기면 ⓐ 관련 정본을 갱신하고 ⓑ 문서 상단 `> **Refs**:` 교차링크를 보강하고 ⓒ [docs/LOG.md](./docs/LOG.md)에 한 줄 append. 주기적으로 모순·낡은 내용·끊긴 Refs(고아)·누락 교차링크를 lint 한다.
4. **Doc-update 라우팅** — 무엇을 바꾸면 어느 정본을 갱신하는가:

   | 변경 종류 | 갱신할 정본 |
   |---|---|
   | 아키텍처/구조 | `docs/dev/ARCHITECTURE.md` |
   | API/엔드포인트 | `docs/dev/API.md` |
   | DB/스키마 | `docs/dev/DB.md` (+ 마이그레이션) |
   | 코딩 규칙 | `docs/dev/CODING_CONVENTION.md` |
   | 환경/시크릿 | `docs/dev/ENV.md` |
   | 보안/인증/권한 | `docs/security/SECURITY.md` |
   | 디자인/토큰/화면 | `docs/design/DESIGN_GUIDE.md` · `SCREENS.md` · `SCREEN_FLOW.md` |
   | 제품/요구사항 | `docs/user/PRD.md` · `USER_JOURNEY.md` · `USER_FLOW.md` |
   | 주요 결정 | `docs/agent/ADR.md` (append) |
   | 개발 중 이슈 | `docs/agent/ISSUES.md` (3회 반복 → RULES 승격) |
   | 불변 규칙 | `docs/agent/RULES.md` |
   | 상태 모델 | `docs/agent/STATE.md` |

5. **Ref 규칙** — 각 문서는 상단에 `> **Refs**: [문서](상대경로) · …` 한 줄로 관련 정본을 가리킨다. Refs가 끊기면 lint에서 고아로 잡는다.
6. **Completion summary** — 작업 끝에: 바꾼 것 · 읽은 문서 · 갱신한 문서 · 돌린 검증 · 남은 위험 · LOG append 여부.

> 이 파일의 아래 카테고리(기술 스택·아키텍처 규칙·개발 프로세스)는 `/harness` **C. 논의 후, D. Step 설계 전에** 합의 내용으로 채워 완성한다.

## 기술 스택
- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS
- 저장소: Upstash Redis (일정 JSON 단일 문서, 관계형 DB 미사용)
- 배포: Vercel (무료), PWA(manifest + service worker)

## 아키텍처 규칙
- CRITICAL: 모든 KV·외부 서비스 접근은 서버(Server Component·app/api/ route handler·services/)에서만 처리한다. KV 접근은 services/storage 의 ItineraryStore 인터페이스로만(직접 Redis 호출 금지).
- CRITICAL: 클라이언트 컴포넌트에서 KV·외부 서비스를 직접 호출하지 말 것.
- CRITICAL: 시간 계산은 항상 Asia/Seoul(tz-aware)로 한다. new Date()의 기기 로컬 tz에 의존 금지 — 위반 시 "지금" 강조가 틀어져 핵심 가치가 깨진다.
- CRITICAL: 쓰기(PUT /api/itinerary)는 admin 쿠키를 서버에서 검증하고, 낙관적 동시성(expectedVersion)으로만 저장한다.
- 접근성(대상=어르신): 본문 ≥18px, 터치 타깃 ≥48px(주요 56px), 대비 AA. 살구색은 면에만.
- 컴포넌트는 components/, 타입은 types/, 순수 로직은 lib/, 저장소 래퍼는 services/storage/ 에 분리.

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)
- 파괴적 명령(`rm -rf`·`git push --force`·`git reset --hard`·`DROP TABLE`·`db reset`)과 테스트 없는 구현 편집은 `.claude/` hook이 차단한다.

## 명령어
> 아래는 **웹/Node 스택 예시**다. 프로젝트 스택에 맞게 교체한다(게임=엔진 빌드·구동, 이미지 생성=생성 결과 검증 등). 화면/플로우가 있으면 E2E(`npx playwright test`)도 둔다.

npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run test         # 단위/컴포넌트/통합 (Vitest + RTL)
npx playwright test  # E2E (헤드리스) — 화면/플로우가 있을 때

## 플러그인 스킬
워크플로우(`/harness`)는 두 플러그인의 스킬을 사용한다. 설치는 README §플러그인 / 워크플로우 A 단계 참고.

### gstack
- 사용 가능한 스킬: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.
- 워크플로우 사용처: `/browse`(B 준비 자료 조사), `/office-hours`(C 논의), `/autoplan`(D 설계 보조), `/design-review`(UI step 검증).

### superpowers
- 워크플로우에서 쓰는 스킬: `brainstorming`(C 논의·대안 발산), `writing-plans`(D step 설계), `subagent-driven-development`(step 구현 위임). 그 밖의 스킬은 설치된 플러그인이 제공한다.
