# 불변 규칙 (RULES)

> **Refs**: [ISSUES](./ISSUES.md) · [ADR](./ADR.md) · [ARCHITECTURE](../dev/ARCHITECTURE.md) · [SECURITY](../security/SECURITY.md)

절대 어기면 안 되는 규칙. 모든 step·리뷰는 이 규칙을 기준으로 검증한다. CLAUDE.md의 CRITICAL
규칙과 함께 최우선으로 적용된다.

규칙은 두 경로로 추가된다: (1) 설계 시 합의된 불변 조건, (2) [ISSUES](./ISSUES.md)에서 **3회
이상 반복된 이슈가 승격된 것**. 후자는 출처 이슈 번호를 함께 적는다.

## 아키텍처
- R1: 모든 KV·외부 서비스 접근은 서버(Server Component·`app/api/` route handler·`services/`)
  에서만 한다. 클라이언트에서 직접 호출 금지.
- R2: [ARCHITECTURE](../dev/ARCHITECTURE.md)의 디렉토리 구조를 벗어나지 않는다. KV 접근은
  `services/storage`의 `ItineraryStore` 인터페이스로만 한다(직접 Redis 호출 금지).

## 보안
- R3: 쓰기(`PUT /api/itinerary`)는 서버에서 admin 쿠키를 반드시 검증한다([SECURITY](../security/SECURITY.md)).
- R4: 비밀 값(`ADMIN_PASSWORD`·`ADMIN_COOKIE_SECRET`·Upstash 토큰)을 코드·로그·클라이언트
  번들에 노출하지 않는다. 비밀번호 비교는 상수시간.

## 데이터
- R5: 일정 쓰기는 **전체 문서 PUT + 낙관적 동시성**(`expectedVersion`)으로만 한다. version
  불일치 시 409로 거부하고 덮어쓰지 않는다.
- R6: 파괴적 작업(항목 삭제·전체 덮어쓰기)은 명시적 확인 없이 수행하지 않는다.

## 시간 (이 프로젝트 핵심)
- R7: 시간 계산은 항상 **Asia/Seoul(tz-aware)** 로 한다. `new Date()`의 기기 로컬 tz에 의존
  금지. 위반 시 강조가 틀어져 제품 핵심 가치가 깨진다.

## 접근성 (대상=어르신)
- R8: 본문 ≥18px, 터치 타깃 ≥48px(주요 버튼 56px), 대비 AA를 지킨다. 살구색은 면에만 쓰고
  글자/버튼 라벨엔 `coral-strong(#C75B43)`을 쓴다.

## 프로세스
- R9: 새 기능은 테스트를 먼저 작성한다 (TDD). 순수 로직(`getItemStatus`)은 Vitest, 화면 흐름은
  Playwright.
- R10: 기존 테스트를 깨뜨린 채로 step을 완료(completed)로 표시하지 않는다.

## 이슈에서 승격된 규칙
ISSUES.md에서 3회 이상 반복되어 승격된 규칙을 여기에 기록한다(출처 이슈 번호 포함).

- (아직 없음)

> 새 규칙을 추가할 때는 번호를 이어가고, 위반 시 영향을 한 줄로 적는다.
