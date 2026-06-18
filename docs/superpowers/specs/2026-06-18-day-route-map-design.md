> **Refs**: [DB](../../dev/DB.md) · [ARCHITECTURE](../../dev/ARCHITECTURE.md) · [DESIGN_GUIDE](../../design/DESIGN_GUIDE.md) · [SCREENS](../../design/SCREENS.md) · [RULES](../../agent/RULES.md)

# 설계: 일정 항목 링크 + 날짜별 동선 지도(이동 애니메이션)

작성일: 2026-06-18 · 상태: 승인됨(구현 진행)

## 배경 / 목표

가족 안내 웹앱에 두 가지를 추가한다.
1. 음식·숙소 항목에 **🔗 외부 링크**(Google 지도 검색, 새 탭) — 위치를 바로 열어볼 수 있게.
2. 선택한 날짜의 **동선 지도** — 장소를 시간순으로 점·선으로 잇고, **마커가 경로를 이동하는 애니메이션**.
   더불어 오키나와 해변·리조트·자연 항목 제목에 🌴 이모지를 더한다(데모 데이터).

## 데이터 모델 (스키마)

`types/itinerary.ts` 의 `ScheduleItem` 에 **선택 필드** 3개를 추가한다(모두 optional — 기존 "장소는 텍스트만" 설계와 호환, 값 없으면 지도에 안 뜸).

```ts
url?: string;   // 외부 링크(http/https) — 🔗 새 탭
lat?: number;   // 위도
lng?: number;   // 경도
```

- `app/api/itinerary/route.ts` 의 Zod `ScheduleItemSchema` 도 동일하게 확장:
  `url: z.string().url().optional()`, `lat: z.number().optional()`, `lng: z.number().optional()`.
- `docs/dev/DB.md` 의 스키마 표기 갱신.
- 관리자 폼(`admin-form.tsx`)은 항목을 `{...it, ...patch}` 로 보존하므로 url·lat·lng 는 저장 시 유지된다(입력칸 추가는 범위 밖).

## 컴포넌트 / 데이터 흐름

- **순수 로직** `lib/map.ts` (데이터 접근 없음, 단위 테스트 대상):
  - `dayRoute(day: Day): LatLng[]` — 좌표가 있는 항목만 startTime 오름차순으로 모은 좌표열.
  - `pointAlongPath(path: LatLng[], t: number): LatLng` — t∈[0,1] 위치의 보간 좌표(이동 마커용).
- **`DayMap`** (`'use client'`, Leaflet 클라이언트 전용 로드) — `selectedDay` 를 받아 점/선/이동 마커를 그린다.
  KV·외부 서비스 미접근이므로 R1/R2 와 무관(타일은 OSM, 정적 자산).
- **통합**: `timeline-view.tsx` 에서 `TimelineList` **아래**에 `<DayMap day={selectedDay} />` 를 둔다.
  날짜 탭 선택 상태(selectedId)를 공유하므로 지도가 탭과 연동된다.

## 지도 / 애니메이션 상세

- **라이브러리**: `leaflet`(API 키 없음), OSM 타일. 기본 마커 자산 경로 문제를 피하려고 **divIcon(이모지/번호)** 만 사용.
- **마커**: 좌표 항목을 시간순 번호(①②③…)로, **polyline** 으로 연결, `fitBounds` 로 자동 맞춤.
- **이동 마커**: divIcon 이모지(비행일 ✈️, 그 외 🚌)가 `requestAnimationFrame` 으로 경로를 따라 이동(`pointAlongPath`).
- **접근성**: `prefers-reduced-motion: reduce` 면 애니메이션을 끄고 정적 경로만 표시(DESIGN_GUIDE 접근성).
- **높이/대비**: 지도 높이는 모바일에서 충분히 크게(≈16rem~), 본문 대비·터치 규칙 유지.

## 에러 / 경계 처리

- 좌표 있는 항목이 **0개**면 지도를 렌더하지 않는다(빈 지도 방지).
- 좌표 있는 항목이 **1개**면 점만 찍고 선·애니메이션은 생략.
- 타일 로드 실패(오프라인)는 Leaflet 기본 동작에 맡긴다 — 타임라인은 정상.

## 테스트 (TDD)

- 단위(Vitest): `dayRoute`·`pointAlongPath` 경계값; `timeline-item` 의 🔗 링크 렌더(href·target=_blank·rel=noopener); 스키마가 url·lat·lng 수용/잘못된 url 거부.
- E2E(Playwright): 선택 날 지도 컨테이너·이동 마커 존재 확인.

## 알려진 한계 / 위험

- 지도는 **네트워크 필요**(오프라인 PWA 타일 미표시). 타임라인 기능엔 영향 없음.
- 좌표는 **데모 프리셋**(`_seed.json`). 가족 편집기는 텍스트만이라 새 장소는 지도에 안 뜸 — 좌표 입력 UI 는 후속.
- 번들 +Leaflet(~40KB gzip).
