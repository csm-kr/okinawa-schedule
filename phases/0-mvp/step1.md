# Step 1: core-types-and-status

## 읽어야 할 파일

- `/docs/user/PRD.md` (핵심 기능 1·2 = 라이브 타임라인·현재 상태 카드)
- `/docs/dev/DB.md` (데이터 모델 = 단일 진실)
- `/docs/dev/ARCHITECTURE.md` (lib/ 순수 로직 배치)
- `/docs/agent/RULES.md` (R7 시간 tz-aware)
- `/docs/dev/CODING_CONVENTION.md`
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§데이터 모델·§상태 계산)
- step0 산출물: `src/`, `vitest.config.ts`, `package.json`

이전 step에서 만든 Vitest 설정을 확인하고, **테스트를 먼저 작성**한 뒤 구현하라(tdd-guard가
`lib/`의 구현 파일을 테스트 없이 편집하면 차단한다).

## 작업

순수 타입과 시간 로직만 만든다(화면·React 금지). 모두 `Asia/Seoul` 기준 tz-aware.

1. **`src/types/itinerary.ts`** (types/ 면제):
```ts
export type ItemStatus = "past" | "current" | "upcoming";
export type ScheduleItem = { id: string; startTime: string; endTime?: string;
  title: string; location?: string; note?: string };
export type Day = { id: string; date: string; label: string; items: ScheduleItem[] };
export type Itinerary = { title: string; subtitle?: string; timezone: "Asia/Seoul";
  version: number; updatedAt: string; days: Day[] };
export type EventPhase = "before" | "during" | "after";
```
2. **`src/lib/time.ts`** (테스트 먼저: `src/lib/time.test.ts`):
   - `combineKst(date: string, time: string): Date` — `"YYYY-MM-DD"`+`"HH:mm"`를 Asia/Seoul
     인스턴트로 합성. `Intl.DateTimeFormat`(timeZone) 또는 `date-fns-tz` 사용.
   - CRITICAL: `new Date("...")` 로컬 파싱에 의존하지 마라(R7). 기기 tz와 무관하게 KST로 계산.
3. **`src/lib/status.ts`** (테스트 먼저: `src/lib/status.test.ts`):
   - `getItemStatus(item, day, dayItems, now): ItemStatus`
     · 시작=`combineKst(day.date,item.startTime)`. 종료=`endTime`이 있으면 그 시각, 없으면
       같은 day의 **다음 item.startTime**, 마지막 item이면 **시작+60분**.
     · `now < 시작`→upcoming, `시작 ≤ now < 종료`→current, `now ≥ 종료`→past.
   - `findCurrentAndNext(itinerary, now): { current?: {item:ScheduleItem, day:Day}, next?: ... }`
   - `getEventPhase(itinerary, now): EventPhase` — 전체 일정의 첫 시작 전/사이/끝 후.

## Acceptance Criteria

```bash
npm test          # time.test.ts + status.test.ts — 아래 케이스 포함, 모두 통과
npm run build     # 타입 컴파일 통과
```

테스트가 반드시 덮어야 할 케이스(`docs/user/PRD.md` 핵심기능 도출):
- past/current/upcoming 각 판정.
- endTime 있는 경우 / 없으면 다음 item 경계 / 마지막 item 60분 기본.
- **tz 정확성**: `now`를 비-KST 기기 시간으로 줘도 KST 기준으로 판정.
- `findCurrentAndNext`가 day 경계를 넘어 current/next를 찾는다.
- `getEventPhase` before/during/after.

## 검증 절차

1. **AC 리뷰·보정** — 검증 도구(Vitest)는 step0에서 구축됨. 위 케이스가 PRD 핵심기능(라이브 강조)을
   충분히 검증하는지 확인하고 부족하면 테스트를 추가한다.
2. `npm test`, `npm run build` 실행.
3. 아키텍처 체크리스트: `lib/`에 순수 함수로 분리됐는가? RULES R7(tz) 준수? `any` 미사용?
4. `phases/0-mvp/index.json` step1 갱신(`completed`+생성 파일 summary).

## 금지사항

- `new Date()`의 로컬 타임존으로 시각을 계산하지 마라. 이유: RULES R7 — 해외 가족·기기시간 오류 시
  "지금" 강조가 틀어져 제품 핵심 가치가 깨진다.
- 시간/상태 로직을 React 컴포넌트에 넣지 마라. 이유: 순수 함수로 분리해야 Vitest로 검증 가능.
- 테스트 없이 `lib/*.ts` 구현부터 쓰지 마라(tdd-guard가 차단, RULES R9).
- 기존 테스트를 깨뜨리지 마라.
