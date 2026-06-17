# Step 2: storage-and-api

## 읽어야 할 파일

- `/docs/dev/API.md` (엔드포인트·상태코드)
- `/docs/dev/DB.md` (저장 형태·동시성)
- `/docs/security/SECURITY.md` (인증·비밀·입력검증)
- `/docs/agent/RULES.md` (R1·R3·R4·R5)
- `/docs/dev/ENV.md` (STORAGE_DRIVER·Upstash·ADMIN_*)
- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§저장소 추상화·§라우트·§동시성·§인증)
- step1 산출물: `src/types/itinerary.ts`, `src/lib/*`

테스트를 먼저 작성한 뒤 구현하라(`services/`·`lib/auth`·route handler는 tdd-guard가 테스트 없으면
차단). 이 step은 화면이 없으므로 AC는 **Vitest**다(웹 UI가 아니므로 Playwright 불필요).

## 작업

1. **저장소 추상화** (`src/services/storage/`):
   - `types.ts`(면제): `export interface ItineraryStore { get(): Promise<Itinerary|null>;
     put(next: Itinerary, expectedVersion: number): Promise<Itinerary> }`.
   - `memory.ts`(테스트 먼저 `memory.test.ts`): 인메모리 구현. `put`은 `expectedVersion`이 현재
     `version`과 다르면 throw(예: `class VersionConflictError`). 성공 시 `version+1`·`updatedAt` 갱신.
   - `upstash.ts`(테스트 먼저 `upstash.test.ts`, `@upstash/redis` mock): key `itinerary`에 JSON
     get/set. 같은 낙관적 동시성 규칙.
   - `index.ts`(테스트 먼저 `index.test.ts`): `getStore()` — `STORAGE_DRIVER`로 Memory/Upstash 선택.
2. **인증** `src/lib/auth.ts`(테스트 먼저 `auth.test.ts`):
   - `verifyPassword(input: string): boolean` — `ADMIN_PASSWORD`와 **상수시간 비교**(`crypto.timingSafeEqual`).
   - `createSessionCookie(): string` / `verifySessionCookie(value: string|undefined): boolean` —
     `ADMIN_COOKIE_SECRET`로 HMAC 서명/검증. httpOnly·Secure·SameSite 속성은 route에서 설정.
3. **route handlers**:
   - `src/app/api/itinerary/route.ts`(테스트 먼저 `route.test.ts`): `GET`→`{data: Itinerary|null}`.
     `PUT`→ zod로 `{itinerary, expectedVersion}` 검증(400), 세션 쿠키 검증(401), `store.put`
     (VersionConflict→409), 성공 시 `revalidatePath('/')` 후 `{data}`.
   - `src/app/api/admin/login/route.ts`(테스트 먼저 `route.test.ts`): `POST` `{password}` 검증→
     200+`Set-Cookie`(서명 httpOnly) / 401.

> route 테스트는 `Request`를 만들어 export된 `GET`/`PUT`/`POST`를 직접 호출하고 `getStore()`가
> MemoryStore를 반환하도록(`STORAGE_DRIVER=memory`) 한다. **실제 Upstash 네트워크에 의존 금지.**

## Acceptance Criteria

```bash
npm test          # 아래 케이스 포함 통과 (네트워크 없음)
npm run build     # 타입 컴파일 통과
```

테스트가 덮어야 할 케이스(`docs/dev/API.md`·`SECURITY.md` 도출):
- MemoryStore put/get 라운드트립, `version+1`·`updatedAt` 갱신.
- `expectedVersion` 불일치 → 충돌 에러 → PUT 라우트 409.
- 쿠키 없음/무효 → PUT 401.
- zod 검증 실패 → 400.
- `verifyPassword` 정답/오답, login 200/401, Set-Cookie 존재.

## 검증 절차

1. **AC 리뷰·보정** — 검증 도구는 step0 Vitest. 케이스가 API.md 상태코드(400/401/409)와 매핑되는지
   확인하고 부족하면 보강한다.
2. `npm test`, `npm run build` 실행.
3. 아키텍처 체크리스트: KV 접근이 `services/storage` 인터페이스 뒤에만 있는가(R1·R2)? 비밀이 코드/로그에
   노출되지 않는가(R4)? 상수시간 비교(SECURITY)? 전체 PUT+version(R5)?
4. `phases/0-mvp/index.json` step2 갱신.

## 금지사항

- 클라이언트에서 KV·`@upstash/redis`를 import/호출하지 마라. 이유: R1 — 서버 전용.
- `expectedVersion` 없이 또는 검증 없이 덮어쓰지 마라. 이유: R5 — 동시 편집 덮어쓰기.
- 비밀번호를 `===`로 비교하지 마라. 이유: timing 누출(SECURITY).
- 실제 Upstash에 연결하는 테스트를 쓰지 마라. 이유: 헤드리스·오프라인 검증 불가.
- 기존 테스트를 깨뜨리지 마라.
