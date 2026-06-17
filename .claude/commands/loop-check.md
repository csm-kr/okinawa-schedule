---
description: 멈추기 전 점검(loop-check) — 기계 게이트+통합 정성 체크리스트(4그룹·14항목)를 돌리고 통과 시 ack (Stop hook 해제). 빌트인 /loop(인터벌 반복)과 다르다.
allowed-tools: Bash(python:*), Bash(python3:*), Read, Grep, Glob
---

작업을 "끝났다"고 멈추기 전 한 바퀴 점검한다. 이 프레임워크의 "확인 기준"은 3계층이며
(① step AC · ② 기계 게이트 · ③ 정성 체크리스트), `/loop-check` 는 ②를 돌린 뒤 ③를 표로 점검하고 ack 한다.
정성 절반은 `/review`(review.md)의 **통합 체크리스트(4그룹·14항목)**를 그대로 재사용한다.

> 이름 주의: 빌트인 `/loop`(프롬프트를 인터벌마다 반복 실행)과는 **다른** 명령이다. 여기 loop 은
> "끝내기 전 한 바퀴 점검하는 loop"(LOOP-CHECKLIST)를 뜻한다.

> **이 게이트는 대화형 세션 한정이다.** execute.py 배치(`claude -p`)는 `HARNESS_HEADLESS=1` 로 돌아
> Stop hook 이 기계 게이트만 적용하고(ack/주입 없음), 거기선 step AC 자가검증이 실질 게이트다.

순서:

1. **기계 게이트 실행**: `python scripts/loop_check.py --report` 를 돌려 출력을 읽는다.
   (`python3` 가 동작하지 않으면 `python` 으로 대체.)
   - lint·build·test 결과와 어드바이저리(변경 코드 파일 수·새 마이그레이션)를 확인한다.
   - 코드(`docs/`·`phases/`·`.claude/`·`*.md` 외) 변경이 없다고 나오면 기계 게이트는 skip — 정성 항목만 본다.
   - 게이트 커맨드는 `CLAUDE.md §명령어` 에서 읽는다(스택 비종속). 못 찾으면 §명령어 를 채우거나
     주석에 `# gate: lint|build|test` 를 달아라.

2. **정성(LLM) 항목 자가확인** — `/review`(review.md)의 **통합 체크리스트(4그룹·14항목)**를 그대로 쓴다.
   변경 diff(`git diff` / 변경 파일)를 각 정본과 대조한다(먼저 `CLAUDE.md`·관련 정본을 읽는다):
   - **제품·UX** — 1 PRD 의도(`docs/user/PRD.md`) · 2 유저 플로우(`docs/user/USER_FLOW.md`) ·
     3 스크린(`docs/design/SCREENS.md`) · 4 디자인 가이드(`docs/design/DESIGN_GUIDE.md`, AI 슬롭 금지)
   - **구현·구조** — 5 아키텍처(`docs/dev/ARCHITECTURE.md`) · 6 기술 스택(`docs/agent/ADR.md`) ·
     7 코딩 컨벤션(`docs/dev/CODING_CONVENTION.md`) · 8 DB/스키마 충돌(`docs/dev/DB.md` + 마이그레이션)
   - **규칙·보안** — 9 불변 규칙(`docs/agent/RULES.md`) · 10 보안(`docs/security/SECURITY.md`) ·
     11 CRITICAL(`CLAUDE.md`)
   - **품질·게이트** — 12 tasks/AC 누락(`phases/{task}/index.json` + step AC) · 13 테스트 존재 ·
     14 빌드/게이트(1번 기계 게이트 결과로 판정)

3. **표로 보고** (review.md §출력 형식 과 동일):

   | 구분 | 항목 | 결과 | 비고 |
   |------|------|------|------|
   | 제품·UX | 1 PRD 의도 부합 | ✅/❌ | … |
   | | 2 유저 플로우 일치 | ✅/❌ | … |
   | | 3 스크린 반영 | ✅/❌/N/A | … |
   | | 4 디자인 가이드 | ✅/❌/N/A | … |
   | 구현·구조 | 5 아키텍처 준수 | ✅/❌ | … |
   | | 6 기술 스택(ADR) | ✅/❌ | … |
   | | 7 코딩 컨벤션 | ✅/❌ | … |
   | | 8 DB/스키마 충돌 | ✅/❌/N/A | … |
   | 규칙·보안 | 9 불변 규칙(RULES) | ✅/❌ | … |
   | | 10 보안 | ✅/❌ | … |
   | | 11 CRITICAL 규칙 | ✅/❌ | … |
   | 품질·게이트 | 12 tasks/AC 누락 | ✅/❌ | … |
   | | 13 테스트 존재 | ✅/❌ | … |
   | | 14 빌드/게이트 | ✅/❌ | … |

   ❌ 가 있으면 **고친 뒤 1번부터 다시** 돈다. 얼버무리지 않는다.

4. **전부 ✅ 면 ack**: `python scripts/loop_check.py --ack` 를 실행한다. 게이트가 green 이어야만 ack 가
   기록되어 Stop hook 이 이번 diff 를 통과시킨다. (게이트 red 면 ack 거부 — red 우회 불가.)
   ack 는 diff 서명에 묶이므로, 코드를 더 고치면 서명이 바뀌어 재점검이 강제된다.

$ARGUMENTS 가 있으면 그 범위에 집중해 점검한다.
