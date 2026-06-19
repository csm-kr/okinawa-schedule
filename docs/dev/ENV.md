# 환경 변수

> **Refs**: [SECURITY](../security/SECURITY.md) · [DB](./DB.md)

## 변수 목록
| 변수 | 용도 | 필수 | 예/기본값 |
|---|---|---|---|
| `STORAGE_DRIVER` | 저장소 구현 선택 | ❌ | `memory`(로컬·테스트) / `upstash`(배포) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `upstash`일 때 ✅ | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST 토큰 | `upstash`일 때 ✅ | — |
| `ADMIN_PASSWORD` | `/admin` 공용 비밀번호 | ✅ | — |
| `ADMIN_COOKIE_SECRET` | 세션 쿠키 서명 시크릿 | ✅ | (긴 랜덤 문자열) |

- **Vercel Upstash(Redis) 연동**: 마켓플레이스 연동은 토큰을 `KV_REST_API_URL`·`KV_REST_API_TOKEN` 이름으로 자동 주입한다. 코드(`services/storage`)가 `UPSTASH_REDIS_REST_*` 가 없으면 이 `KV_REST_API_*`(쓰기 토큰)로 **fallback** 하므로, 대시보드에서 토큰을 수동 복사할 필요가 없다. `KV_REST_API_READ_ONLY_TOKEN`·`KV_URL`·`REDIS_URL` 은 쓰지 않는다.
- 비밀 값은 절대 커밋하지 않는다. 관리 정책은 [SECURITY](../security/SECURITY.md) 참조.
- `env.example`(앞에 점 없음 — 가드가 `.env*` 쓰기를 차단)에 키만 두고 값은 비운다. 배포 절차는 [README §배포](../../README.md).
- 로컬 개발은 `STORAGE_DRIVER=memory`로 KV 없이 동작 가능(검증 우선 원칙).
- 배포(Vercel)에서는 환경 변수로 주입하고, KV 토큰은 서버 전용(클라이언트 노출 금지).

## LLM 파이프라인
해당 없음 (이 프로젝트는 LLM 백그라운드 파이프라인을 사용하지 않는다).
