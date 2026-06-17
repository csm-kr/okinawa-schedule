# 상태 모델

> **Refs**: [DB](../dev/DB.md) · [ARCHITECTURE](../dev/ARCHITECTURE.md)

앱 레벨(휘발성) 상태와 서버 영속 상태를 구분한다. 저장 스키마는 [DB](../dev/DB.md).

## 앱 레벨 상태 (클라이언트, 휘발성)
| 상태 | 위치 | 수명 | 비고 |
|---|---|---|---|
| 선택된 날짜 탭 | useState | 컴포넌트 | 기본=오늘(기간 밖이면 1일차) |
| 현재 시각 tick | useState + interval(30–60s) | 마운트 동안 | 강조 재계산 트리거 |
| admin 폼 입력값 | useState/form | 저장까지 | 시각·제목·장소·메모 |
| admin 로드 시 version | useState | 저장까지 | PUT의 expectedVersion |
| 비밀번호 입력값 | useState | 로그인까지 | 제출 후 폐기 |
| 토스트/에러 표시 | useState | 일시 | 저장 성공·409·네트워크 |

## 서버 영속 상태 (KV)
| 상태 | 키/모델 | 갱신 시점 |
|---|---|---|
| 일정 문서 | Upstash `itinerary` (Itinerary JSON) | admin 저장 시 |
| admin 세션 | 서명 httpOnly 쿠키 | 로그인 시 발급 / 만료·로그아웃 시 제거 |

## 파생/캐시 상태
| 상태 | 도출 방식 | 무효화 시점 |
|---|---|---|
| 항목 상태(past/current/upcoming) | `getItemStatus(item, day, now)` (KST) | 매 tick(30–60s) |
| 현재/다음 항목 | days 평탄화 후 now 비교 | 매 tick |
| `/` 페이지 캐시 | Next 캐시 | admin 저장 시 `revalidatePath('/')` |
| SW 데이터 캐시 | network-first 캐시 | 온라인 응답 수신 시 |

## 동기화 규칙
- **KV가 단일 진실 공급원(SSOT).** 클라이언트는 강조만 로컬 재계산하고 데이터는 서버에서 받는다.
- admin 저장 성공 시 `version+1`·`updatedAt` 갱신 + `revalidatePath('/')`로 공개 화면 신선화.
- 동시 편집은 낙관적 동시성(version)으로 보호.
