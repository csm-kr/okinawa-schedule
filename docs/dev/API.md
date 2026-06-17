# API

> **Refs**: [ARCHITECTURE](./ARCHITECTURE.md) · [SECURITY](../security/SECURITY.md) · [SEQUENCE_DIAGRAM](./SEQUENCE_DIAGRAM.md)

route handler 엔드포인트, 권한, 상태 코드를 정의한다.

## 공통 규칙
- 모든 데이터(KV) 접근은 서버(Server Component·`app/api/` route handler)에서만 처리한다.
- 응답은 `{ data }` 또는 `{ error }` 형태로 통일한다.
- 입력은 zod로 검증한다. 인증/인가 정책은 [SECURITY](../security/SECURITY.md) 참조.

## 엔드포인트

### `GET /api/itinerary`
| 항목 | 내용 |
|---|---|
| 설명 | 공개 일정 문서를 반환 |
| 권한 | public |
| 요청 | 없음 |
| 응답 | `{ data: Itinerary }` (없으면 빈 기본 구조 또는 `null`) |
| 상태 코드 | 200 / 500 |

### `PUT /api/itinerary`
| 항목 | 내용 |
|---|---|
| 설명 | 일정 문서 전체 저장(낙관적 동시성) 후 `revalidatePath('/')` |
| 권한 | admin (서명 httpOnly 쿠키 필요) |
| 요청 | `{ itinerary: Itinerary, expectedVersion: number }` (zod 검증) |
| 응답 | `{ data: Itinerary }` (version+1, updatedAt 갱신) |
| 상태 코드 | 200 / 400 검증 실패 / 401 미인증(쿠키 없음/무효) / 409 version 불일치 / 500 |

### `POST /api/admin/login`
| 항목 | 내용 |
|---|---|
| 설명 | 공용 비밀번호 검증(상수시간) 후 서명 httpOnly 쿠키 발급 |
| 권한 | public |
| 요청 | `{ password: string }` |
| 응답 | `{ data: { ok: true } }` + `Set-Cookie` |
| 상태 코드 | 200 / 400 / 401 비밀번호 불일치 |

> (선택) `POST /api/admin/logout` — 쿠키 제거. 구현 시 200.

## 에러 코드 규약
| 코드 | 의미 | 사용 시점 |
|---|---|---|
| 400 | 입력 검증 실패 | zod 스키마 불일치 |
| 401 | 미인증 | admin 쿠키 없음/무효, 비밀번호 불일치 |
| 409 | 충돌 | `expectedVersion` ≠ 현재 version (동시 편집) |
| 500 | 서버 오류 | KV 접근 실패 등 |
