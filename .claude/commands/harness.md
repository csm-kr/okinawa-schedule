이 프로젝트는 Harness 프레임워크를 사용한다. 아래 워크플로우에 따라 작업을 진행하라.

---

## 워크플로우

> **필수 스킬**: 아래 각 단계에 명시된 gstack / superpowers 스킬을 **반드시 사용한다**.

### A. 스킬/플러그인 설치

작업 전 필요한 플러그인/스킬을 설치한다. 이미 설치되어 있으면 건너뛴다.

- gstack: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
- superpowers: `/plugin install superpowers@claude-plugins-official` (또는 `/plugin marketplace add obra/superpowers-marketplace` 후 `/plugin install superpowers@superpowers-marketplace`)
- 이후 단계에서 사용하는 스킬(`/browse`, `/office-hours`, `brainstorming`, `writing-plans`, `subagent-driven-development`, `/design-review` 등)이 사용 가능한지 확인한다.

### B. 준비

`docs/` 하위 문서를 읽고 프로젝트의 기획·아키텍처·설계 의도를 파악한다. 문서는 관점별 폴더로 분류되어 있다:

| 폴더 | 문서 | 관점 |
|------|------|------|
| `docs/user/` | `PRD.md` · `USER_JOURNEY.md` · `USER_FLOW.md` | 제품·사용자 |
| `docs/agent/` | `ADR.md` · `RULES.md` · `STATE.md` · `ISSUES.md` | 아키텍처 결정·불변 규칙·상태·개발 이슈 |
| `docs/dev/` | `ARCHITECTURE.md` · `CODING_CONVENTION.md` · `DB.md` · `API.md` · `SEQUENCE_DIAGRAM.md` · `ENV.md` | 구현 |
| `docs/design/` | `DESIGN_GUIDE.md` · `SCREENS.md` · `SCREEN_FLOW.md` | 디자인 |
| `docs/security/` | `SECURITY.md` | 보안 |

필요시 Explore 에이전트를 병렬로 사용한다.

### C. 논의

구현을 위해 구체화하거나 기술적으로 결정해야 할 사항이 있으면 사용자에게 제시하고 논의한다.

- 필수 스킬: gstack `/office-hours`(전문가 상담)와 superpowers `brainstorming`(대안 발산)을 사용해 논의를 구체화한다. 두 스킬이 설치된 플러그인에 없으면 A 단계에서 해당 스킬 추가 설치를 요청한다. 결정된 사항은 `docs/agent/ADR.md`에 기록한다.
- **검증 방식·가드 합의**: 프로젝트 유형(웹/모바일/게임/이미지 생성 등)에 따라 산출물을 어떻게 검증할지를 정하고, **어떤 검증 도구가 먼저 필요한지, 어떤 가드 훅(TDD 가드·위험 명령 차단·`.env` 접근 차단·멈춤 게이트 등)을 켤지 사용자에게 알리고 합의한다**. 이 결정은 D 설계의 "검증 도구·훅 우선" 원칙으로 이어진다.
- **CRITICAL — 프레임워크 기본 검증/가드는 web 종속이다. 이 프로젝트 성격(PRD·스택)에 맞게 전부 교체해야 한다**: 기본 제공물은 모두 웹/Node 전제로 짜여 있다. 이 논의에서 아래를 **무엇으로 바꿀지** 합의하고, **실제 교체는 D 설계의 첫 설정 step(가드 훅·도구 설정)에서 구현**한다.
  - **lint·build·test 커맨드** (`CLAUDE.md §명령어`, `loop_check.py`가 멈춤 게이트로 파싱) — 웹=`npm run lint/build/test`. 게임=엔진 빌드·구동, 이미지 생성=생성 결과 검증, 파이썬=`ruff`/`pytest` 등으로 교체. 비-Node 는 §명령어 줄 주석에 `# gate: lint|build|test` 를 달아 게이트 역할을 지정한다.
  - **TDD 가드** (`.claude/hooks/tdd-guard.sh`) — **현재 `.ts/.tsx/.js/.jsx` 전용이고 테스트 탐지 경로도 web 배치(`__tests__/`, `tests/`)를 전제한다.** 이 프로젝트의 구현 파일 확장자(예: `.py`·`.gd`·`.rs`)와 테스트 배치 규칙에 맞게 탐지 로직을 바꾼다. 안 바꾸면 비-web 프로젝트에선 TDD 가드가 무력해진다.
  - **위험 명령 차단** (`.claude/settings.json` 의 `PreToolUse[Bash]` 정규식) — 기본은 `rm -rf`·`git push --force`·`DROP TABLE` 등. 이 프로젝트에서 파괴적인 명령(예: 엔진 `clean`, 데이터셋 삭제 스크립트)을 정규식에 가감한다.
  - **정성 체크리스트**(`/review`·`/loop-check` 14항목) — 이 프로젝트에 없는 렌즈(예: 화면 없는 CLI 는 스크린·디자인 항목)는 N/A 처리 규칙을 합의한다.
- **CLAUDE.md 완성 (D 설계 전 선행)**: 논의에서 합의된 내용으로 `CLAUDE.md`의 해당 카테고리 placeholder를 이 개발에 맞게 채워 완성한다:
  - **기술 스택 · 아키텍처 CRITICAL 규칙 · 개발 프로세스** — 합의된 값으로 채운다.
  - **명령어** — 프로젝트 스택에 맞게 교체한다(웹=npm/playwright, 게임=엔진 빌드·구동, 이미지 생성=생성 결과 검증 등). 웹 전용 예시를 그대로 두지 마라.
  - **플러그인 스킬** — 이 개발에서 실제로 쓸 gstack/superpowers 스킬만 추려 단계별 사용처를 적는다.
  - LLM Wiki 스키마/라우팅 부분은 그대로 둔다. 이는 D. Step 설계가 확정된 규칙 위에서 이뤄지도록 하기 위함이다.

### D. Step 설계

사용자가 구현 계획 작성을 지시하면 여러 step으로 나뉜 초안을 작성해 피드백을 요청한다.

- 필수 스킬: superpowers `writing-plans`로 step 초안을 구조화하고, 구현 단계에서는 `subagent-driven-development`로 step별 작업을 서브에이전트에 위임한다. 계획 자동화는 gstack `/autoplan`을 사용한다.

> **검증 도구 우선 (Verification tooling first)**: 각 phase의 기능 step에 앞서, 그 프로젝트 유형에 맞는 **검증/시뮬레이션 도구**가 먼저 존재해야 한다. phase의 첫 step(들)에서 이 도구를 만들고 실제로 동작하는지 확인한 뒤에 기능 step으로 진행한다. 검증 도구 없이 기능을 구현하지 마라. 이유: 비대화형(headless)으로 산출물을 검증할 수단이 없으면 AC가 형식적이 되고 execute.py가 통과 여부를 판단할 수 없다. 어떤 도구가 필요한지는 C. 논의에서 사용자에게 알리고 합의한 내용을 따른다.
>
> | 프로젝트 유형 | 먼저 갖출 검증 도구 |
> |---|---|
> | 웹 | Playwright + Chromium 헤드리스 E2E (`docs/user/USER_FLOW.md` 핵심 경로 재현) |
> | 모바일 / 웹 UI·UX | UI/UX 시뮬레이션·검증 도구 — 실제 화면 흐름을 자동 재현·확인 |
> | 게임 | 동일 엔진에서 빌드·구동되는지 확인하는 검증 하니스 |
> | 이미지 생성 | 생성 결과 검증 도구 — 기준 대비 비교·품질 체크 |
> | 그 외 | 산출물을 headless로 검증할 수 있는 전용 도구 |

**가드 훅·도구 설정 (논의 후, 첫 설정 step) — 여기서 web 종속 기본값을 이 프로젝트에 맞게 교체한다**: C 논의에서 합의한 검증 도구·가드 훅 교체안을 phase의 **첫 설정 step**에서 실제로 구현한다. `.claude/hooks/`와 `.claude/settings.json`을 합의안대로 고치고, 동작을 확인한 뒤 기능 step으로 넘어간다.

> **CRITICAL: 아래 기본 제공물은 모두 web/Node 전제다. C 논의 합의대로 이 step에서 교체하지 않으면 비-web 프로젝트에선 가드가 무력해진다.** 무엇을 무엇으로 바꿀지는 C 논의 §검증 방식·가드 합의 참조.

- **TDD 가드** (`PreToolUse[Write|Edit]` → `.claude/hooks/tdd-guard.sh`): 대응 테스트 파일이 없으면 구현 코드 편집을 차단한다(deny). **현재 `.ts/.tsx/.js/.jsx` 확장자 전용이고 테스트 탐지도 web 배치(`__tests__/`·`tests/`) 전제다.** 이 프로젝트의 구현 확장자(`.py`·`.gd`·`.rs` 등)와 테스트 배치 규칙에 맞게 탐지 로직을 **반드시** 교체한다.
- **위험 명령 차단** (`PreToolUse[Bash]`): `rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`, `db reset` 매칭 시 `exit 2`로 실행을 막는다. 정규식은 이 프로젝트의 파괴적 명령에 맞게 가감한다.
- **`.env` 접근 차단** (`permissions.deny`): `.env*`의 Read/Write/Edit 및 `cat/head/tail/less/more .env*` Bash를 거부한다. (스택 무관 — 대개 그대로 둔다.)
- **멈추기 전 기계 게이트** (`Stop` → `scripts/loop_check.py --gate`): 작업을 "끝났다"고 멈추려 할 때 lint·build(CLAUDE.md §명령어에서 파싱) 를 돌려 red 면 차단한다. **게이트 커맨드는 §명령어를 채워야 작동한다** — 비-Node 는 §명령어 줄 주석에 `# gate: lint|build|test` 를 달아 역할을 지정한다(미구성이면 게이트 skip). 코드(`docs/`·`phases/`·`.claude/`·`*.md` 외) 변경이 없으면 skip. **대화형 세션**에선 green 이어도 `/loop-check` ack 전이면 1회 차단하며 통합 체크리스트를 주입한다. **헤드리스(execute.py 배치, `HARNESS_HEADLESS=1`)** 에선 ack/주입 없이 기계 게이트만 하드 실패로 적용하고, 거기선 step AC 자가검증이 실질 게이트다. (`/loop-check` 는 빌트인 `/loop`(인터벌 반복)과 다른 명령이다.)

> step에서 이 가드를 우회하지 마라. 이유: TDD·안전 규칙은 `docs/agent/RULES.md`의 불변 규칙이며, 훅이 막은 작업은 규칙 위반 신호다.

> **AC ↔ loop 연결**: "확인 기준"은 3계층이다 — ① **step AC**(step{N}.md, execute.py 세션이 자가검증하는 전방 게이트) · ② **기계 게이트**(green; Stop 하드게이트=lint·build, 전체 lint·build·test 는 `/loop-check`·step AC) · ③ **정성 체크리스트**(누적 diff ↔ 정본 대조, `/loop-check`=`/review` 통합 체크리스트 4그룹·14항목 + 기계 게이트 + ack). **CLAUDE.md §명령어의 검증 커맨드 = 모든 step AC의 객관적 공통 부분집합**이며, loop-check(②+③)은 그것을 멈추기 전에 강제하는 의식이다. step AC가 "이 step이 제 일을 했는가"를 묻는다면, loop은 "누적 변경이 여전히 모든 정본과 일관되고 빌드가 통과하는가"를 묻는다. 비-Node 스택은 §명령어 줄 주석에 `# gate: lint|build|test` 를 달아 게이트 커맨드를 지정한다.

설계 원칙:

1. **Scope 최소화** — 하나의 step에서 하나의 레이어 또는 모듈만 다룬다. 여러 모듈을 동시에 수정해야 하면 step을 쪼갠다.
2. **자기완결성** — 각 step 파일은 독립된 Claude 세션에서 실행된다. "이전 대화에서 논의한 바와 같이" 같은 외부 참조는 금지한다. 필요한 정보는 전부 파일 안에 적는다.
3. **사전 준비 강제** — 관련 문서 경로와 이전 step에서 생성/수정된 파일 경로를 명시한다. 세션이 코드를 읽고 맥락을 파악한 뒤 작업하도록 유도한다.
4. **시그니처 수준 지시** — 함수/클래스의 인터페이스만 제시하고 내부 구현은 에이전트 재량에 맡긴다. 단, 설계 의도에서 벗어나면 안 되는 핵심 규칙(멱등성, 보안, 데이터 무결성 등)은 반드시 명시한다.
5. **AC는 PRD에서 도출한다** — 각 step의 Acceptance Criteria는 `docs/user/PRD.md`의 목표·핵심 기능을 리뷰하여, 해당 step이 어떤 요구사항을 충족하는지 근거를 두고 작성한다. "~가 동작해야 한다" 같은 추상적 서술이 아닌 `npm run build && npm test` 같은 실제 실행 가능한 검증 커맨드로 표현한다.
6. **주의사항은 구체적으로** — "조심해라" 대신 "X를 하지 마라. 이유: Y" 형식으로 적는다.
7. **네이밍** — step name은 kebab-case slug로, 해당 step의 핵심 모듈/작업을 한두 단어로 표현한다 (예: `project-setup`, `api-layer`, `auth-flow`).

### E. 파일 생성

사용자가 승인하면 아래 파일들을 생성한다.

#### E-1. `phases/index.json` (전체 현황)

여러 task를 관리하는 top-level 인덱스. 이미 존재하면 `phases` 배열에 새 항목을 추가한다.

```json
{
  "phases": [
    {
      "dir": "0-mvp",
      "status": "pending"
    }
  ]
}
```

- `dir`: task 디렉토리명.
- `status`: `"pending"` | `"completed"` | `"error"` | `"blocked"`. execute.py가 실행 중 자동으로 업데이트한다.
- 타임스탬프(`completed_at`, `failed_at`, `blocked_at`)는 execute.py가 상태 변경 시 자동 기록한다. 생성 시 넣지 않는다.

#### E-2. `phases/{task-name}/index.json` (task 상세)

```json
{
  "project": "<프로젝트명>",
  "phase": "<task-name>",
  "steps": [
    { "step": 0, "name": "project-setup", "status": "pending" },
    { "step": 1, "name": "core-types", "status": "pending" },
    { "step": 2, "name": "api-layer", "status": "pending" }
  ]
}
```

필드 규칙:

- `project`: 프로젝트명 (CLAUDE.md 참조).
- `phase`: task 이름. 디렉토리명과 일치시킨다.
- `steps[].step`: 0부터 시작하는 순번.
- `steps[].name`: kebab-case slug.
- `steps[].status`: 초기값은 모두 `"pending"`.

상태 전이와 자동 기록 필드:

| 전이 | 기록되는 필드 | 기록 주체 |
|------|-------------|----------|
| → `completed` | `completed_at`, `summary` | Claude 세션 (summary), execute.py (timestamp) |
| → `error` | `failed_at`, `error_message` | Claude 세션 (message), execute.py (timestamp) |
| → `blocked` | `blocked_at`, `blocked_reason` | Claude 세션 (reason), execute.py (timestamp) |

`summary`는 step 완료 시 산출물을 한 줄로 요약한 것으로, execute.py가 다음 step 프롬프트에 컨텍스트로 누적 전달한다. 따라서 다음 step에 유용한 정보(생성된 파일, 핵심 결정 등)를 담아야 한다.

`created_at`은 execute.py가 최초 실행 시 task 레벨에 한 번만 기록한다. step 레벨의 `started_at`도 execute.py가 각 step 시작 시 자동 기록한다. 생성 시 넣지 않는다.

#### E-3. `phases/{task-name}/step{N}.md` (각 step마다 1개)

```markdown
# Step {N}: {이름}

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/user/PRD.md`
- `/docs/dev/ARCHITECTURE.md`
- `/docs/agent/ADR.md`
- `/docs/agent/RULES.md`
- `/docs/dev/CODING_CONVENTION.md`
- `/docs/design/DESIGN_GUIDE.md` (UI 변경 시)
- {이전 step에서 생성/수정된 파일 경로}

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

{구체적인 구현 지시. 파일 경로, 클래스/함수 시그니처, 로직 설명을 포함.
코드 스니펫은 인터페이스/시그니처 수준만 제시하고, 구현체는 에이전트에게 맡겨라.
단, 설계 의도에서 벗어나면 안 되는 핵심 규칙은 명확히 박아넣어라.}

## Acceptance Criteria

AC는 **실제로 실행 가능한 커맨드**여야 하며, step의 레이어에 맞는 것만 포함한다(불필요한 커맨드를 전부 넣지 말 것). execute.py는 비대화형으로 돌므로 모든 커맨드는 헤드리스로 통과해야 한다. 각 step의 AC는 `docs/user/PRD.md`의 목표·핵심 기능을 리뷰하여, 이 step이 충족하는 요구사항에 근거해 작성한다.

> 아래 커맨드는 **웹/Node 스택 예시**다. 게임·이미지 생성·모바일 등 다른 유형은 D의 "검증 도구 우선" 표에 맞는 검증 도구/커맨드(엔진 빌드·구동 확인, 생성 결과 비교 등)로 대체한다.

```bash
# 공통 (모든 step)
npm run build                 # 타입/컴파일 에러 없음

# 로직/단위·통합 레이어 (types, lib, api)
npm test                      # Vitest + RTL, TDD

# 화면/플로우 레이어 (app 라우트, 화면 전환)
npx playwright test           # 헤드리스 E2E — 사용자 흐름이 실제로 동작하는지

# 스타일/규칙이 핵심이면
npm run lint
```

> **화면 step의 E2E는 Selenium이 아니라 Playwright를 쓴다.** 헤드리스 실행·자동 대기·스크린샷 비교가 execute.py의 비대화형 실행과 정합하고 설정이 가볍다. 단, 단위/컴포넌트 검증까지 E2E로 하지 말 것 — 그 레이어는 Vitest + RTL이 담당한다. E2E는 `docs/user/USER_FLOW.md`의 핵심 경로(로그인→업로드→분석 등) 검증에만 쓴다.

UI를 변경하는 step이면 아래 **디자인 리뷰 AC**도 통과해야 한다:

- `docs/design/DESIGN_GUIDE.md`의 토큰(색상·타이포·간격)과 컴포넌트 규격을 따른다.
- AI 슬롭 안티패턴을 사용하지 않는다: backdrop-filter blur(글래스모피즘), gradient-text, "Powered by AI" 배지, 네온 글로우 애니메이션, 보라/인디고 브랜드 색, 균일한 rounded-2xl, 배경 gradient orb.
- `docs/design/SCREENS.md`의 카피·구성과 일치한다.
- UI 변경 step은 gstack `/design-review` 스킬로 변경 화면을 반드시 검증한다.

## 검증 절차

1. **AC 리뷰·보정** — 실행 전에 이 step의 AC가 `docs/user/PRD.md`의 관련 요구사항을 충분히 검증하는지 점검한다. 기준:
   - AC가 의존하는 **검증 도구가 이미 이 phase에 구축되어 있는가?** 없으면 그 도구 구축을 선행 step으로 분리하고(또는 먼저 만들고) 진행한다 — 검증 도구 우선 원칙.
   - PRD의 어떤 핵심 기능/목표를 이 step이 충족하는지 매핑되는가? 매핑이 비면 AC를 추가한다.
   - step 레이어에 맞는 커맨드만 있는가? (로직=`npm test`, 화면=`npx playwright test`) 무관한 커맨드는 제거하고, 빠진 레이어 검증은 보강한다.
   - AC가 추상적 서술이 아니라 실행 가능한 커맨드/체크리스트로 표현되어 있는가?
   - 보정이 필요하면 step 파일의 AC를 갱신한 뒤 진행한다.
2. 위 AC 커맨드를 실행한다.
3. 아키텍처 체크리스트를 확인한다:
   - `docs/dev/ARCHITECTURE.md` 디렉토리 구조를 따르는가?
   - `docs/agent/ADR.md` 결정과 기술 스택을 벗어나지 않았는가?
   - `docs/dev/CODING_CONVENTION.md` 규칙을 지켰는가?
   - 권한/비밀을 다뤘다면 `docs/security/SECURITY.md`를 위반하지 않았는가?
   - `docs/agent/RULES.md` 불변 규칙과 CLAUDE.md CRITICAL 규칙을 위반하지 않았는가?
   - (UI 변경 시) 위 디자인 리뷰 AC를 모두 통과하는가?
4. 결과에 따라 `phases/{task-name}/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 (API 키, 외부 인증, 수동 설정 등) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- {이 step에서 하지 말아야 할 것. "X를 하지 마라. 이유: Y" 형식}
- 기존 테스트를 깨뜨리지 마라
```

### F. 실행

```bash
python3 scripts/execute.py {task-name}        # 순차 실행
python3 scripts/execute.py {task-name} --push  # 실행 후 push
```

execute.py가 자동으로 처리하는 것:

- `feat-{task-name}` 브랜치 생성/checkout
- 가드레일 주입 — CLAUDE.md + docs/**/*.md(README 제외) 내용을 매 step 프롬프트에 포함
- 컨텍스트 누적 — 완료된 step의 summary를 다음 step 프롬프트에 전달
- 자가 교정 — 실패 시 최대 3회 재시도하며, 이전 에러 메시지를 프롬프트에 피드백
- 2단계 커밋 — 코드 변경(`feat`)과 메타데이터(`chore`)를 분리 커밋
- 타임스탬프 — started_at, completed_at, failed_at, blocked_at 자동 기록

에러 복구:

- **error 발생 시**: `phases/{task-name}/index.json`에서 해당 step의 `status`를 `"pending"`으로 바꾸고 `error_message`를 삭제한 뒤 재실행한다.
- **blocked 발생 시**: `blocked_reason`에 적힌 사유를 해결한 뒤, `status`를 `"pending"`으로 바꾸고 `blocked_reason`을 삭제한 뒤 재실행한다.

이슈 기록·승격:

- step 실행 중 발생한 이슈(`error_message`·`blocked_reason`, 반복되는 실수)는 `docs/agent/ISSUES.md`의 이슈 로그에 남긴다.
- 같은 이슈가 **3회 이상 반복되면** `docs/agent/RULES.md`의 불변 규칙으로 승격해, 이후 step이 같은 실수를 되풀이하지 않도록 한다.
