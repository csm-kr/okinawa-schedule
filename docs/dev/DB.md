# 데이터 저장소 (KV)

> **Refs**: [ARCHITECTURE](./ARCHITECTURE.md) · [API](./API.md) · [STATE](../agent/STATE.md)

> 이 프로젝트는 **관계형 DB(Prisma/SQL)를 쓰지 않는다.** 일정은 작은 단일 문서이므로
> **Upstash Redis 키 1개에 JSON 한 덩어리**로 저장한다. 이유는 [ADR](../agent/ADR.md) ADR-001/002.

## 저장 형태
- Redis key: `itinerary` (단일 문자열, JSON 직렬화).
- 값: 아래 `Itinerary` 타입 1개. 행사 전체(여러 날·여러 항목)를 한 문서에 담는다.

## 스키마 (TypeScript 타입 = 단일 진실 공급원)
```ts
type Itinerary = {
  title: string;        // "조인수·김인숙 여사님 환갑잔치"
  subtitle?: string;    // 날짜범위 등
  timezone: "Asia/Seoul";
  version: number;      // 낙관적 동시성 — 저장 시 +1
  updatedAt: string;    // ISO datetime
  days: Day[];
};
type Day = {
  id: string;
  date: string;         // ISO date "2026-09-19"
  label: string;        // "1일차"
  items: ScheduleItem[];
};
type ScheduleItem = {
  id: string;
  startTime: string;    // "HH:mm" (day.date 기준, KST)
  endTime?: string;     // 선택
  title: string;
  location?: string;    // 위치 텍스트(주소/지명)
  note?: string;
  url?: string;         // 외부 링크(http/https) — 🔗 새 탭
  lat?: number;         // 위도 — 동선 지도 점(좌표 없으면 지도에 안 뜸)
  lng?: number;         // 경도
};
```

## 모델 설명
| 구조 | 역할 | 관계 |
|---|---|---|
| Itinerary | 행사 전체 메타 + 동시성 메타(version/updatedAt) | days 1:N |
| Day | 하루 일정 | items 1:N |
| ScheduleItem | 개별 일정 항목 | — |

## 파생값 (저장하지 않고 계산)
| 파생값 | 계산 방식 | 소스 |
|---|---|---|
| 항목 상태(past/current/upcoming) | `getItemStatus(item, day, now)` (KST) | item·현재 시각 |
| 현재 진행/다음 항목 | days 평탄화 후 now와 비교 | itinerary |
| 항목 정렬 | startTime 오름차순 | day.items |

## 무결성·동시성 규칙
- 쓰기는 항상 **전체 문서 PUT**. 부분 패치 없음(작은 문서).
- **낙관적 동시성**: PUT은 `expectedVersion`을 포함하고, 현재 `version`과 다르면 거부(409).
  성공 시 `version+1`·`updatedAt` 갱신.
- 저장은 `services/storage`의 `ItineraryStore` 인터페이스로만 한다(직접 Redis 호출 금지).
