# 환갑잔치 가족 안내 웹앱

> 조인수 · 김인숙 여사님 환갑잔치 겸 가족 여행(2박 3일+) 일정을, 가족이 **링크 하나로**
> 현재 시각(Asia/Seoul) 기준으로 확인하는 모바일 웹앱. 회원가입 없음 · PWA(홈화면 추가) ·
> iOS·안드로이드 동일.

카톡에 흩어진 메시지를 뒤지지 않고, 진입 즉시 **"지금 몇 시에 어디서 뭘 하는지"**를 큰 글씨로
짚어준다. 대상 시청자에 60대 이상 어르신 비중이 커서, 가독성·큰 터치 타깃·높은 대비를 최우선으로 한다.

자세한 제품 정의는 [docs/user/PRD.md](./docs/user/PRD.md).

---

## 핵심 기능

1. **날짜별 라이브 타임라인** — 2박 3일+ 날짜 탭. 현재 시각(Asia/Seoul) 기준 "지금 진행 중 /
   다음" 자동 강조. 클라이언트가 30–60초마다 재계산한다.
2. **현재 상태 카드** — 진입 즉시(스크롤 없이) 지금/다음(또는 행사 시작 전·종료 후)을 큰 글씨로 표시.
3. **공용 비밀번호 `/admin`** — 재배포 없이 일정 추가·수정·삭제(모바일 편집). 저장 즉시 공개 `/` 에 반영.
   낙관적 동시성(`expectedVersion`)으로 동시 편집 충돌을 막는다.
4. **PWA** — `manifest` + service worker. 홈화면 추가, 카톡 링크 공유. iOS·안드로이드 동일.
5. **날짜별 동선 지도** — 선택한 날의 장소를 시간순 점·선으로 잇고, 이동 마커(✈️/🚌)가 경로를 따라
   움직인다(Leaflet + OpenStreetMap, API 키 없음). 음식·숙소 항목엔 🔗 지도 링크(새 탭). 좌표 있는 항목만 표시.

> MVP 비목표: 턴바이턴 길찾기/내비게이션 · RSVP · 사진 갤러리 · 방명록 · 카운트다운 · 다국어 · 알림/푸시 · 계정.

## 화면

| 경로 | 설명 | 권한 |
|---|---|---|
| `/` | 공개 라이브 타임라인 + 현재 상태 카드 (Server Component) | public |
| `/admin` | 공용 비밀번호 로그인 → 일정 편집 폼 | 비밀번호 |

## 기술 스택

| 레이어 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | TypeScript strict |
| 스타일 | Tailwind CSS | 토큰은 [DESIGN_GUIDE](./docs/design/DESIGN_GUIDE.md) |
| 저장소 | Upstash Redis (JSON 단일 문서) | 로컬은 인메모리 드라이버로 KV 없이 동작 |
| 인증 | 공용 비밀번호 + 서명 httpOnly 쿠키 | 계정/회원가입 없음 |
| 호스팅 | Vercel (무료) | PWA manifest + service worker |

> 라이브 "지금" 강조는 **클라이언트 시계**로 계산하고, 일정 데이터는 서버에서 읽어 전달한다.
> 데이터 접근은 `services/storage` 인터페이스 뒤로 숨겨 락인을 피하고 오프라인 테스트를 가능하게 한다.
> 구조 상세는 [docs/dev/ARCHITECTURE.md](./docs/dev/ARCHITECTURE.md).

## 빠른 시작 (로컬 개발)

KV 없이도 인메모리 저장소로 바로 띄울 수 있다.

```bash
npm install
cp env.example .env.local   # STORAGE_DRIVER=memory 로 바꾸고, ADMIN_PASSWORD·ADMIN_COOKIE_SECRET 입력
npm run dev                 # http://localhost:3000  (편집은 /admin)
```

`STORAGE_DRIVER=memory` 면 `ADMIN_PASSWORD`·`ADMIN_COOKIE_SECRET` 만 있어도 `/admin` 편집까지 동작한다
(서버 재시작 시 데이터는 초기화). Upstash 토큰은 배포 때만 필요하다.

## 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 빌드 결과 실행
npm run lint         # ESLint
npm run test         # 단위/컴포넌트/통합 (Vitest + RTL)
npx playwright test  # E2E (헤드리스, e2e/*.spec.ts)
```

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                    # 공개 타임라인 `/` (Server Component → storage.get())
│   ├── admin/page.tsx              # 관리자 로그인 + 편집 `/admin`
│   ├── api/
│   │   ├── itinerary/route.ts      # GET(공개) · PUT(admin, expectedVersion)
│   │   └── admin/login/route.ts    # POST 비밀번호 검증 → 서명 쿠키
│   ├── layout.tsx · loading.tsx · error.tsx · globals.css
├── components/                     # StatusCard · TimelineList · DayTabs · AdminForm · use-now 등
├── lib/
│   ├── status.ts                   # getItemStatus 순수 함수 (tz-aware)
│   ├── time.ts                     # KST 변환 헬퍼
│   └── auth.ts                     # 비밀번호 상수시간 비교, 쿠키 서명/검증
├── services/storage/               # ItineraryStore 인터페이스 + Upstash/Memory 구현
└── types/itinerary.ts              # Itinerary · Day · ScheduleItem · ItemStatus

public/                             # manifest.json · sw.js · icon-192/512.png
e2e/                                # Playwright: smoke · timeline · admin · pwa
docs/                               # 정본 문서 (인덱스: docs/INDEX.md)
```

## 데이터 모델

일정은 KV에 **JSON 단일 문서**(`Itinerary`)로 저장된다. 모든 화면·저장소가 [`src/types/itinerary.ts`](./src/types/itinerary.ts)를 따른다.

```ts
type Itinerary = {
  title: string;
  subtitle?: string;
  timezone: "Asia/Seoul";
  version: number;     // 낙관적 동시성 — 저장 시 +1
  updatedAt: string;   // ISO datetime
  days: Day[];
};
type Day = { id: string; date: string; label: string; items: ScheduleItem[] };
type ScheduleItem = {
  id: string;
  startTime: string;   // "HH:mm" (해당 day.date 기준, KST)
  endTime?: string;
  title: string;
  location?: string;
  note?: string;
  url?: string;        // 외부 링크(http/https) — 🔗 새 탭
  lat?: number;        // 위도 — 동선 지도 점(좌표 없으면 지도에 안 뜸)
  lng?: number;        // 경도
};
```

## API

모든 KV 접근은 서버(Server Component · route handler)에서만 처리한다. 응답은 `{ data }` 또는
`{ error }` 로 통일하고, 입력은 zod로 검증한다. 상세는 [docs/dev/API.md](./docs/dev/API.md).

| 엔드포인트 | 권한 | 설명 |
|---|---|---|
| `GET /api/itinerary` | public | 공개 일정 문서 반환 |
| `PUT /api/itinerary` | admin | 전체 저장(낙관적 동시성) 후 `revalidatePath('/')`. `409` = version 충돌 |
| `POST /api/admin/login` | public | 공용 비밀번호 상수시간 검증 → 서명 httpOnly 쿠키 |

## 환경 변수

키 템플릿은 [`env.example`](./env.example), 정의는 [docs/dev/ENV.md](./docs/dev/ENV.md). 비밀 값은 커밋하지 않는다.

| 변수 | 용도 | 필수 |
|---|---|---|
| `STORAGE_DRIVER` | 저장소 선택 — `memory`(로컬) / `upstash`(배포) | ❌ (기본 동작) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `upstash`일 때 ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST 토큰 | `upstash`일 때 ✅ |
| `ADMIN_PASSWORD` | `/admin` 공용 비밀번호 | ✅ |
| `ADMIN_COOKIE_SECRET` | 세션 쿠키 서명 시크릿 (긴 랜덤 문자열) | ✅ |

## 배포 (Vercel + Upstash Redis)

> 비밀 값은 레포에 커밋하지 않고 **Vercel 환경 변수로만** 주입한다.

1. **Upstash Redis 생성** — [Upstash](https://upstash.com) 콘솔에서 Redis DB를 만들고 **REST URL**과
   **REST TOKEN**을 복사한다(`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
2. **Vercel 에 레포 연결** — [Vercel](https://vercel.com)에서 이 GitHub 레포를 Import 한다(Next.js 자동 감지).
3. **환경 변수 입력** — Settings → Environment Variables 에 위 표의 5개를 넣는다
   (`STORAGE_DRIVER=upstash`, Upstash 토큰 2개, `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`).
   `ADMIN_COOKIE_SECRET` 은 예: `openssl rand -hex 32`.
4. **배포 → URL 공유** — Deploy 후 생긴 공개 URL을 **카톡으로 가족에게 공유**한다(홈화면 추가 시 PWA로 열린다).
5. **일정 입력** — `/admin` 에서 `ADMIN_PASSWORD` 로 로그인해 날짜·일정을 입력·저장하면 공개 `/` 에 바로 반영된다.

## 디자인 & 접근성

- **크림(#FFF9F3) 베이스 + 살구(#E07A5F) 포인트 1색.** 살구는 "지금"을 가리키는 데만 쓴다.
- 본문 ≥18px, 시간·제목은 더 크게, 버튼 ≥48px(주요 56px), 대비 AA. 한 손·세로 스크롤.
- 토큰·컴포넌트·금지(AI 슬롭 안티패턴)는 [docs/design/DESIGN_GUIDE.md](./docs/design/DESIGN_GUIDE.md).

## 개발 방식 (Harness)

이 레포는 문서를 **정본(source of truth)**으로 삼아 기획→설계→구현을 phase·step 단위로 실행하는
스펙 주도 하니스 위에서 개발됐다. 정본은 [`docs/`](./docs/INDEX.md), 워크플로우는
[`.claude/commands/harness.md`](./.claude/commands/harness.md), TDD·위험 명령 가드는 `.claude/` 훅으로 강제한다.

- 정본 문서 인덱스: [docs/INDEX.md](./docs/INDEX.md)
- 불변 규칙: [docs/agent/RULES.md](./docs/agent/RULES.md) · 결정 기록: [docs/agent/ADR.md](./docs/agent/ADR.md)
- 변경 로그: [docs/LOG.md](./docs/LOG.md)
