# Sequence Diagram

> **Refs**: [API](./API.md) · [SCREEN_FLOW](../design/SCREEN_FLOW.md)

주요 동작의 컴포넌트 호출 순서를 기술한다. 화면 단위 흐름은
[SCREEN_FLOW](../design/SCREEN_FLOW.md), API 계약은 [API](./API.md) 참조.

## 동작 1: 가족이 공개 타임라인 확인
```
User → Browser: `/` 열기 (링크/홈화면)
Browser → Server Component(page): 렌더 요청
Server Component → storage.get(): 일정 조회
storage → Upstash: GET itinerary
Upstash --> storage: Itinerary JSON
storage --> Server Component: Itinerary
Server Component --> Browser: HTML(초기 상태 카드·타임라인)
Browser → Client Component: 마운트
Client Component → getItemStatus(now KST): 강조 계산
loop 매 30–60초:
  Client Component → getItemStatus(now): 재계산 → 강조 갱신
```

## 동작 2: 편집자가 일정 저장
```
User → /admin: 비밀번호 입력
Browser → POST /api/admin/login: { password }
login route → auth.verify(상수시간 비교): 검증
auth --> login route: ok
login route --> Browser: Set-Cookie(서명 httpOnly)

User → AdminForm: 항목 편집 후 [저장]
Browser → PUT /api/itinerary: { itinerary, expectedVersion } + cookie
itinerary route → auth.checkCookie: 인증 확인
itinerary route → storage.put(next, expectedVersion):
   ├─ version 불일치 → throw → 409 응답
   └─ 일치 → Upstash SET (version+1, updatedAt)
itinerary route → revalidatePath('/'): 공개 캐시 무효화
itinerary route --> Browser: { data: Itinerary } (성공 토스트)
```

## 비동기·백그라운드 동작
- 별도 큐/웹훅 없음. 라이브 강조는 클라이언트 타이머(30–60초)로만 갱신(데이터 refetch 아님).
- 신선도는 admin 저장 시 `revalidatePath('/')` 온디맨드 무효화로 보장.
