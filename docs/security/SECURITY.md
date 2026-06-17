# 보안

> **Refs**: [API](../dev/API.md) · [ENV](../dev/ENV.md) · [RULES](../agent/RULES.md)

위협 모델, 인증/인가, 비밀 관리, 데이터 보호를 정의한다. 이 앱은 **회원가입 없이 가족만**
보는 비공개 안내판이며, 민감 정보는 다루지 않는다(일정 텍스트뿐). 비공개성은 "링크를 아는
사람만" 수준(by obscurity)이고, **편집만 공용 비밀번호로 보호**한다.

## 위협 모델
| 위협 | 영향 | 대응 |
|---|---|---|
| 미인증 쓰기(일정 변조) | 가족에게 잘못된 일정 노출 | PUT은 서명 쿠키 검증 필수(401) |
| 비밀번호 무차별 추측 | 편집 권한 탈취 | 상수시간 비교 + 충분히 긴 비밀번호. (선택) 간단 레이트리밋 |
| KV 토큰 노출 | 저장소 임의 조작 | 토큰 서버 전용, 클라이언트 번들·로그 노출 금지 |
| 쿠키 위조 | 인증 우회 | `ADMIN_COOKIE_SECRET`로 서명, httpOnly·Secure·SameSite |
| XSS(일정 텍스트) | 스크립트 주입 | React 기본 이스케이프, `dangerouslySetInnerHTML` 금지 |
| 링크 유출 | 일정이 외부에 보임 | 민감 정보 미게재. 필요 시 링크 교체로 대응 |

## 인증
- 방식: **공용 비밀번호 1개**(`ADMIN_PASSWORD`) → 검증 성공 시 **서명 httpOnly 쿠키** 발급.
- 비밀번호 비교는 **상수시간**(timing attack 방지).
- 세션: 쿠키 만료(예: 7일). 계정·세션 DB 없음.

## 인가
- 읽기(`GET /api/itinerary`, `/`)는 public.
- 쓰기(`PUT /api/itinerary`)는 admin 쿠키 필요.
- CRITICAL: 쓰기 핸들러는 쿠키 유효성을 서버에서 반드시 검증한다. 엔드포인트별 권한은
  [API](../dev/API.md).

## 비밀 관리
- 비밀은 환경 변수로만 주입한다([ENV](../dev/ENV.md)): `ADMIN_PASSWORD`,
  `ADMIN_COOKIE_SECRET`, `UPSTASH_REDIS_REST_TOKEN`.
- CRITICAL: 비밀 값을 코드·로그·클라이언트 번들에 노출하지 않는다.
- `.env*`는 커밋 금지(가드 훅이 접근 차단). `.env.example`엔 키만.

## 데이터 보호
- 전송 구간: HTTPS 강제(Vercel 기본).
- 저장 구간: 일정 텍스트만 저장(PII·결제·연락처 없음). 비밀번호는 저장하지 않고 env 값과 비교만.
- 가족 공용 비밀번호는 앱 밖(카톡)에서 공유.

## 입력 검증
- 모든 쓰기·로그인 입력은 **zod**로 검증(`Itinerary` 구조, `password` 등).
- 문자열 길이 상한 등 기본 방어. 파일 업로드 없음.
