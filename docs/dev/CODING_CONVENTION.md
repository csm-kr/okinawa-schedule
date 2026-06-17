# 코딩 컨벤션

> **Refs**: [ARCHITECTURE](./ARCHITECTURE.md) · [RULES](../agent/RULES.md)

## 스택
- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS
- 저장소: Upstash Redis (`@upstash/redis`)
- 테스트: Vitest + Testing Library(컴포넌트), Playwright(E2E)

## 네이밍
| 대상 | 규칙 | 예 |
|---|---|---|
| 파일 | kebab-case | `status-card.tsx`, `get-item-status.ts` |
| 컴포넌트 | PascalCase | `StatusCard`, `TimelineList` |
| 함수/변수 | camelCase | `getItemStatus`, `currentItem` |
| 타입/인터페이스 | PascalCase | `Itinerary`, `ItineraryStore` |
| 상수 | UPPER_SNAKE | `DEFAULT_DURATION_MIN` |

## 타입 규칙
- `any` 금지. `unknown` + 좁히기.
- API 입출력·도메인 타입은 `types/`에 정의(`Itinerary`, `Day`, `ScheduleItem`, `ItemStatus`).
- 함수 시그니처에 명시적 반환 타입. 특히 `getItemStatus`는 `ItemStatus` 유니온 반환.
- 입력 검증은 zod 스키마로(특히 PUT/login). 스키마에서 타입 추론.

## 디렉토리 배치
- 컴포넌트 `components/`, 타입 `types/`, 순수 로직 `lib/`, 외부 저장소 래퍼 `services/storage/`.
- `getItemStatus` 등 시간 로직은 **화면과 분리된 순수 함수**로 `lib/`에 둔다(테스트 우선).

## 금지 규칙
- CRITICAL: 클라이언트 컴포넌트에서 KV·외부 서비스를 직접 호출하지 않는다(서버 경유).
- CRITICAL: 시간 계산을 `new Date()`의 기기 로컬 tz에 의존하지 않는다. 항상 Asia/Seoul(`Intl`/
  `date-fns-tz`)로 계산한다.
- 비밀(`ADMIN_PASSWORD`·Upstash 토큰)을 클라이언트 번들·로그에 노출하지 않는다.
- `console.log` 커밋 금지. 기본 export 지양(named export 권장).

## 접근성 규칙 (어르신 가독성)
- 본문 ≥18px, 시간/제목은 더 크게. 크기는 rem 기반.
- 터치 타깃 ≥48px(주요 버튼 56px), 대비 AA. 살구색은 면에만(글자는 `ink` 또는 `coral-strong`).

## 커밋
- conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
