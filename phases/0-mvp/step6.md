# Step 6: deploy-prep

## 읽어야 할 파일

- `/docs/superpowers/specs/2026-06-17-hwangab-family-app-design.md` (§Distribution Plan)
- `/docs/dev/ENV.md` (환경 변수 목록)
- `/docs/dev/ARCHITECTURE.md` (호스팅=Vercel, 저장소=Upstash)
- `/docs/security/SECURITY.md` (R4 비밀)
- step0~5 산출물 전체

이 step은 **배포 준비물**까지만 만든다. 실제 Vercel/Upstash 계정 생성·시크릿 주입은 사용자
개입이 필요하므로 자동 실행하지 않는다.

## 작업

1. **env 템플릿** `env.example`(앞에 점 없는 이름 — `.env*`는 가드가 쓰기 차단함):
   `STORAGE_DRIVER=upstash`, `UPSTASH_REDIS_REST_URL=`, `UPSTASH_REDIS_REST_TOKEN=`,
   `ADMIN_PASSWORD=`, `ADMIN_COOKIE_SECRET=` (값은 모두 비움 — 키만).
2. **README 배포 안내** 섹션: ① Upstash Redis 생성 → REST URL·TOKEN 복사, ② Vercel에 레포 연결,
   ③ 환경 변수 5개를 Vercel에 입력(`STORAGE_DRIVER=upstash`), ④ 배포 → 카톡으로 URL 공유,
   ⑤ `/admin`에서 `ADMIN_PASSWORD`로 로그인해 일정 입력. 로컬은 `STORAGE_DRIVER=memory`.
3. **프로덕션 빌드 확인** `npm run build`로 전체가 빌드되는지 확인.
4. (선택) 전체 회귀 `npx playwright test`.

> 실제 배포(계정·시크릿)가 이 세션에서 요구되면 step을 `blocked`로 두고 `blocked_reason`에
> "Vercel/Upstash 계정·환경 변수 설정 필요(사용자 개입)"를 적는다. 준비물(env.example·README·빌드)
> 까지 끝났으면 `completed`로 둔다.

## Acceptance Criteria

```bash
npm run build          # 프로덕션 빌드 통과
npx playwright test    # (선택) 전체 E2E 회귀 — 웹 AC
```

## 검증 절차

1. **AC 리뷰·보정** — 배포 준비물(env.example·README)이 ENV.md 변수와 일치하는지 확인.
2. `npm run build` 실행(+ 선택 회귀).
3. 아키텍처 체크리스트: 비밀 값이 어디에도 커밋되지 않았는가(R4)? `.env` 파일을 만들지 않았는가?
4. `phases/0-mvp/index.json` step6 갱신(준비 완료=completed / 계정 필요=blocked).

## 금지사항

- 실제 비밀 값(비밀번호·토큰)을 `env.example`·README·커밋에 넣지 마라. 이유: R4 — 키만 둔다.
- `.env` 파일을 생성하지 마라. 이유: 가드가 `.env*` 쓰기를 차단하고, 비밀은 호스팅 env로 주입한다.
- 기존 테스트를 깨뜨리지 마라.
