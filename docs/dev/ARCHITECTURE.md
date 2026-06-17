# 아키텍처

> **Refs**: [ADR](../agent/ADR.md) · [DB](./DB.md) · [API](./API.md) · [STATE](../agent/STATE.md) · [RULES](../agent/RULES.md)

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx              # 공개 타임라인 `/` (Server Component, storage.get())
│   ├── admin/page.tsx        # 관리자 로그인+편집 `/admin`
│   └── api/
│       ├── itinerary/route.ts        # GET(공개) · PUT(보호, expectedVersion)
│       └── admin/login/route.ts      # POST 비밀번호 검증 → 쿠키
├── components/               # TimelineList, StatusCard, DayTabs, AdminForm 등
├── types/                    # Itinerary, Day, ScheduleItem, ItemStatus
├── lib/
│   ├── status.ts             # getItemStatus 순수 함수 (tz-aware)
│   ├── time.ts               # KST 변환 헬퍼 (Intl/date-fns-tz)
│   └── auth.ts               # 비밀번호 상수시간 비교, 쿠키 서명/검증
└── services/
    └── storage/              # ItineraryStore 인터페이스 + Upstash/Memory 구현
```

## 패턴
- **Server Components 기본**, 인터랙션(날짜 탭·라이브 강조·admin 폼)만 Client Component.
- 라이브 "지금" 강조는 **클라이언트 시계**로 계산(서버 불필요). 데이터는 서버에서 읽어 전달.
- 데이터 접근은 `services/storage` 인터페이스 뒤로 숨겨 락인 회피 + 오프라인 테스트.

## 데이터 흐름
```
[읽기] 가족 → `/` (Server Component) → storage.get() → Upstash → 렌더
        → Client Component가 30–60초마다 getItemStatus 재계산(강조 갱신)

[쓰기] 편집자 → /admin 폼 → PUT /api/itinerary(expectedVersion)
        → auth 쿠키 검증 → storage.put() → revalidatePath('/') → 공개 즉시 신선
```

## 상태 관리
서버 상태(일정)는 Server Component가 KV에서 읽어 전달. 클라이언트 상태(선택 날짜 탭, 현재
시각 tick, admin 폼 입력값/version)는 useState. 앱 레벨 vs 서버 영속 상태 구분은
[STATE](../agent/STATE.md).

## 프로덕션 스택
| 레이어 | 사용 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | TypeScript strict |
| 스타일 | Tailwind CSS | 토큰은 [DESIGN_GUIDE](../design/DESIGN_GUIDE.md) |
| 저장소 | **Upstash Redis** (JSON 단일 문서) | 스키마는 [DB](./DB.md). 관계형 DB 미사용 |
| 인증 | 공용 비밀번호 + 서명 httpOnly 쿠키 | 계정/회원 없음 |
| 호스팅 | Vercel (무료) | PWA manifest + service worker |

## 교체표 (MVP → 프로덕션)
| 항목 | MVP | 프로덕션 교체 | 교체 트리거 |
|---|---|---|---|
| 저장소 | Upstash Redis(JSON 1개) | 관계형 DB(Postgres) | 다중 행사·구조화 쿼리 필요 시 |
| 로컬 저장소 | MemoryStore/FileStore | Upstash | 배포 환경 |
| 인증 | 공용 비밀번호 1개 | 역할 기반 계정 | 편집자 다수·권한 분리 필요 시 |
