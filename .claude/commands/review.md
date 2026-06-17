이 프로젝트의 변경 사항을 리뷰하라.

> 이건 게이트 없는 **가벼운 수동 점검**이다. 멈추기 전 강제 게이트(기계 게이트 + ack)는 `/loop-check` 이며,
> `/loop-check` 의 정성 절반이 아래 **통합 체크리스트**를 그대로 재사용한다. 작업을 끝내기 전이면 `/review` 대신
> `/loop-check` 을 써라. (`/loop-check` 는 빌트인 `/loop`(인터벌 반복)과 다른 명령이다.)

먼저 변경과 관련된 정본을 읽어라:
- `/CLAUDE.md`
- `/docs/user/PRD.md` · `/docs/user/USER_FLOW.md`
- `/docs/dev/ARCHITECTURE.md` · `/docs/dev/CODING_CONVENTION.md` · `/docs/dev/DB.md`
- `/docs/agent/RULES.md` · `/docs/agent/ADR.md`
- `/docs/security/SECURITY.md`
- `/docs/design/DESIGN_GUIDE.md` · `/docs/design/SCREENS.md` (UI 변경이 있는 경우)

그런 다음 변경된 파일들을 확인하고, 아래 **통합 체크리스트**(4개 그룹)로 변경 diff 를 각 정본과 대조해 검증하라.

## 통합 체크리스트

**제품·UX (의도)** — 요청·범위에서 벗어나지 않았나
1. **PRD 의도 부합** — `docs/user/PRD.md` 목표·핵심 기능·비목표에 부합하는가?
2. **유저 플로우 일치** — `docs/user/USER_FLOW.md` 진입/복귀/실패 경로가 맞는가?
3. **스크린 반영** — `docs/design/SCREENS.md` 인벤토리와 새 라우트/화면이 일치하는가?
4. **디자인 가이드** — (UI 변경 시) `docs/design/DESIGN_GUIDE.md` 토큰·컴포넌트 준수 + AI 슬롭 안티패턴(글래스모피즘, gradient-text, 네온 글로우, 보라/인디고 등) 금지?

**구현·구조**
5. **아키텍처 준수** — `docs/dev/ARCHITECTURE.md` 디렉토리 구조를 따르는가?
6. **기술 스택(ADR)** — `docs/agent/ADR.md` 결정·기술 선택을 벗어나지 않았나?
7. **코딩 컨벤션** — `docs/dev/CODING_CONVENTION.md` 네이밍·타입·금지 규칙을 지켰나?
8. **DB/스키마 충돌** — `docs/dev/DB.md` (+ 마이그레이션) 타임스탬프 순서·중복 컬럼 충돌이 없나?

**규칙·보안**
9. **불변 규칙(RULES)** — `docs/agent/RULES.md` 를 위반하지 않았나?
10. **보안** — `docs/security/SECURITY.md` 인증/인가·비밀 관리 정책을 위반하지 않았나?
11. **CRITICAL 규칙** — `CLAUDE.md` 의 CRITICAL 규칙을 위반하지 않았나?

**품질·게이트**
12. **tasks/AC 누락** — `phases/{task}/index.json` 의 이번 step AC/DoD 항목을 빠뜨리지 않았나?
13. **테스트 존재** — 변경한 구현마다 대응 테스트가 있나?
14. **빌드/게이트** — `CLAUDE.md §명령어` 의 lint·build·test 가 통과하는가?

## 출력 형식

| 구분 | 항목 | 결과 | 비고 |
|------|------|------|------|
| 제품·UX | 1 PRD 의도 부합 | ✅/❌ | {상세} |
| | 2 유저 플로우 일치 | ✅/❌ | {상세} |
| | 3 스크린 반영 | ✅/❌/N/A | {상세} |
| | 4 디자인 가이드 | ✅/❌/N/A | {상세} |
| 구현·구조 | 5 아키텍처 준수 | ✅/❌ | {상세} |
| | 6 기술 스택(ADR) | ✅/❌ | {상세} |
| | 7 코딩 컨벤션 | ✅/❌ | {상세} |
| | 8 DB/스키마 충돌 | ✅/❌/N/A | {상세} |
| 규칙·보안 | 9 불변 규칙(RULES) | ✅/❌ | {상세} |
| | 10 보안 | ✅/❌ | {상세} |
| | 11 CRITICAL 규칙 | ✅/❌ | {상세} |
| 품질·게이트 | 12 tasks/AC 누락 | ✅/❌ | {상세} |
| | 13 테스트 존재 | ✅/❌ | {상세} |
| | 14 빌드/게이트 | ✅/❌ | {상세} |

위반 사항이 있으면 수정 방안을 구체적으로 제시하라.
