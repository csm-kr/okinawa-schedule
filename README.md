# Harness Framework

> 문서를 **정본(source of truth)**으로 삼아, 기획→설계→구현을 **phase·step 단위로 쪼개** Claude 에게 비대화형으로 실행시키는 스펙 주도 개발 하니스.

각 step 은 독립된 Claude 세션에서 실행되고, 정본 문서(`docs/`)와 가드 훅이 매 step 에 주입되어 **맥락 유실·규칙 이탈·검증 누락**을 구조적으로 막는다. "확인 기준"은 step AC → 기계 게이트 → 정성 체크리스트의 3계층으로 강제된다.

---

## 🚀 Quick Start

이 디렉토리에서 Claude Code 를 열고, 아래 한 줄을 입력하면 된다:

```
이 프로젝트에서 /harness commands 를 이용해서 프로젝트를 진행해줘!
```

그러면 Claude 가 `/harness` 워크플로우(A 설치 → B 준비 → C 논의 → D 설계 → E 파일 생성 → F 실행)를 따라:

1. **C. 논의** 단계에서 무엇을 만들지·기술 스택·검증 방식·켤 가드 훅을 함께 정하고, `CLAUDE.md` 의 placeholder 를 이 프로젝트에 맞게 채운다.
2. **D~E** 에서 작업을 phase·step 으로 쪼개 `phases/{task}/step{N}.md` 를 만들어 승인을 받는다.
3. **F** 에서 비대화형으로 실행한다:

```bash
python scripts/execute.py {task}          # phase 순차 실행 (자가 교정 포함)
python scripts/execute.py {task} --push   # 실행 후 원격에 push
```

> 처음이면 먼저 A 단계에서 gstack·superpowers 플러그인을 설치한다(아래 [워크플로우](#워크플로우--harness) 참고). Claude 가 설치 여부를 확인하고 안내한다.

---

## 핵심 아이디어

1. **문서 = 정본 (LLM Wiki).** 요구사항·아키텍처·디자인·규칙을 `docs/` 에 역할별로 두고 서로 Refs 로 교차연결한다([Karpathy 패턴](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). `CLAUDE.md` 는 그 위의 **얇은 라우터**다.
2. **작업을 step 으로 쪼갠다.** 하나의 step = 하나의 레이어/모듈. 각 step 파일은 자기완결적이며 읽을 파일·작업·**AC(Acceptance Criteria)**·금지사항을 담는다.
3. **비대화형 실행 + 자가 교정.** `scripts/execute.py` 가 step 을 순차 실행하고, 정본을 가드레일로 주입하고, 실패 시 에러를 피드백해 최대 3회 재시도한다.
4. **가드는 훅으로 강제한다.** TDD·위험 명령·`.env` 접근·멈추기 전 검증을 사람의 선의가 아니라 `.claude/` 훅으로 막는다.

## 디렉토리 구조

```
.
├── CLAUDE.md                 # 얇은 라우터 — non-negotiable 요약 + doc-update 라우팅
├── README.md                 # ← 이 문서 (프레임워크 설명)
├── docs/                     # LLM Wiki (정본). 인덱스는 docs/INDEX.md
│   ├── INDEX.md              # 문서 인덱스 (← 정본 탐색의 시작점)
│   ├── LOG.md                # append-only 변경 로그
│   ├── user/                 # PRD · USER_JOURNEY · USER_FLOW
│   ├── dev/                  # ARCHITECTURE · API · DB · CODING_CONVENTION · ENV · SEQUENCE_DIAGRAM
│   ├── design/               # DESIGN_GUIDE · SCREENS · SCREEN_FLOW
│   ├── security/             # SECURITY
│   └── agent/                # ADR · RULES · STATE · ISSUES
├── phases/                   # 실행 단위
│   ├── index.json            # 전체 phase 현황
│   └── {task}/               # phase 하나
│       ├── index.json        # step 목록·상태
│       └── step{N}.md        # 각 step 지시서 (읽을 파일·작업·AC·금지)
├── scripts/
│   ├── execute.py            # step 순차 실행기 (가드레일 주입·자가 교정·2단계 커밋)
│   └── loop_check.py         # 멈추기 전 기계 게이트 (Stop hook)
└── .claude/
    ├── settings.json         # 권한·훅 설정
    ├── hooks/tdd-guard.sh    # 대응 테스트 없는 구현 편집 차단
    └── commands/             # /harness · /review · /loop-check
```

## 워크플로우 — `/harness`

| 단계 | 내용 | 주요 스킬 |
|---|---|---|
| **A. 설치** | gstack·superpowers 플러그인/스킬 설치 | — |
| **B. 준비** | `docs/` 를 읽고 기획·아키텍처·설계 의도 파악 | `Explore` |
| **C. 논의** | 결정 사항·검증 방식·가드 훅을 사용자와 합의, `CLAUDE.md` 완성 | `/office-hours`, `brainstorming` |
| **D. Step 설계** | 검증 도구 우선 → step 초안 작성, AC 는 PRD 에서 도출 | `writing-plans`, `/autoplan` |
| **E. 파일 생성** | `phases/{task}/index.json` + `step{N}.md` 생성 | — |
| **F. 실행** | `python scripts/execute.py {task}` | `subagent-driven-development` |

자세한 내용은 [.claude/commands/harness.md](./.claude/commands/harness.md).

## 검증 — "확인 기준"의 3계층

| 계층 | 무엇 | 어디 | 판정 | 시점 |
|---|---|---|---|---|
| ① **Step AC** | 이 step 이 PRD 요구를 충족하는가 (실행 가능 커맨드) | `step{N}.md` §AC | execute.py 세션 자가검증 | step 진행 중 (전방 게이트) |
| ② **기계 게이트** | lint·build·test 가 green 인가 (Stop 하드게이트=lint·build, 전체는 `/loop-check`·step AC) | `Stop` hook → `loop_check.py` | 기계 (객관) | 멈추기 직전 |
| ③ **정성 체크리스트** | 누적 diff 가 모든 정본과 어긋나지 않나 (`/loop-check` = `/review` 통합 체크리스트 4그룹·14항목 + 기계 게이트 + ack) | `/loop-check` · `/review` | LLM (diff↔docs 대조) | 멈추기 직전 |

**CLAUDE.md §명령어의 검증 커맨드 = 모든 step AC 의 객관적 공통 부분집합**이고, loop-check(②+③)은 그걸 Stop 시점에 강제한다. 게이트 커맨드는 §명령어 에서 파싱하므로 스택에 종속되지 않는다(비-Node 는 줄 주석에 `# gate: lint|build|test`).

## 가드 훅 (`.claude/`)

- **TDD 가드** (`PreToolUse[Write|Edit]`) — 대응 테스트 파일이 없으면 구현 코드 편집을 차단.
- **위험 명령 차단** (`PreToolUse[Bash]`) — `rm -rf`·`git push --force`·`git reset --hard`·`DROP TABLE`·`db reset` 차단.
- **`.env` 접근 차단** (`permissions.deny`) — `.env*` 의 Read/Write/Edit 및 cat/head/tail 류 차단.
- **멈추기 전 기계 게이트** (`Stop` → `loop_check.py --gate`) — green 아니면 차단. 대화형은 ack 전 1회 차단+통합 체크리스트 주입, 헤드리스(execute.py, `HARNESS_HEADLESS=1`)는 기계 게이트만 적용.

## 명령어

```bash
# 워크플로우 (Claude 세션 안에서)
/harness        # A~F 워크플로우 진행
/loop-check     # 멈추기 전 통합 체크리스트 점검 → ack (빌트인 /loop 인터벌 반복과 다름)
/review         # 게이트 없는 가벼운 수동 리뷰

# 실행 (터미널)
python scripts/execute.py {task}          # phase 순차 실행
python scripts/execute.py {task} --push   # 실행 후 push
python scripts/loop_check.py --report     # 기계 게이트 리포트
python -m pytest scripts/                 # 하니스 자체 테스트
```

## 시작하기

1. 루트에서 `/harness` 를 실행해 A(설치)~C(논의)를 진행하고 `CLAUDE.md` 의 placeholder(기술 스택·아키텍처 규칙·§명령어)를 이 프로젝트에 맞게 채운다.
2. `docs/` 정본을 채운다(인덱스: [docs/INDEX.md](./docs/INDEX.md)).
3. D(설계)~E(파일 생성)로 `phases/{task}/` 를 만든 뒤 `python scripts/execute.py {task}` 로 실행한다.
