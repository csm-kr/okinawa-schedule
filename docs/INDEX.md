# 문서 인덱스 (LLM Wiki)

> **이건 `docs/` 정본의 인덱스다.** 프레임워크 자체(워크플로우·실행·구조)에 대한 설명은 루트 [README.md](../README.md) 를 봐라.

이 디렉토리는 **LLM Wiki**(라이브 위키, Karpathy [패턴](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f))다. 역할별 정본 문서가 서로 **Refs**(상대 링크)로 교차 연결되고, 의미 있는 변경은 [LOG.md](./LOG.md)에 append 한다. 유지보수 루프(ingest→query→lint)와 doc-update 라우팅은 [CLAUDE.md](../CLAUDE.md) §LLM Wiki 참조.

- 각 문서는 스켈레톤(`{placeholder}`)이며 프로젝트에 맞게 채운다.
- 각 문서 상단의 `> **Refs**:` 줄이 끊기면(대상 없음) lint에서 고아로 잡는다.
- `scripts/execute.py`가 이 디렉토리 전체(`docs/**/*.md`, 단 이 인덱스 `INDEX.md`는 제외)와 `CLAUDE.md`를 매 step 프롬프트에 가드레일로 주입한다.

## 🧑‍💻 유저 — `user/`
| 문서 | 내용 |
|---|---|
| [PRD](./user/PRD.md) | 제품 정의·목표·핵심 기능·비목표 |
| [USER_JOURNEY](./user/USER_JOURNEY.md) | 페르소나별 시간 축 서사 |
| [USER_FLOW](./user/USER_FLOW.md) | 목표 완료까지의 단계·분기(클릭 단위) |

## 🛠️ 개발자 — `dev/`
| 문서 | 내용 |
|---|---|
| [ARCHITECTURE](./dev/ARCHITECTURE.md) | 구조·프로덕션 스택·교체표 |
| [DB](./dev/DB.md) | Prisma 스키마·파생값 |
| [API](./dev/API.md) | route handler 엔드포인트·권한·상태 코드 |
| [SEQUENCE_DIAGRAM](./dev/SEQUENCE_DIAGRAM.md) | 주요 동작의 컴포넌트 호출 순서 |
| [CODING_CONVENTION](./dev/CODING_CONVENTION.md) | 스택·네이밍·타입·금지 규칙 |
| [ENV](./dev/ENV.md) | 환경 변수·LLM 파이프라인 |

## 🎨 디자이너 — `design/`
| 문서 | 내용 |
|---|---|
| [DESIGN_GUIDE](./design/DESIGN_GUIDE.md) | 토큰·컴포넌트·금지 사항 |
| [SCREENS](./design/SCREENS.md) | 화면별 구성·카피 카탈로그 |
| [SCREEN_FLOW](./design/SCREEN_FLOW.md) | 화면 전환 맵·조건부 UI 상태 |

## 🔒 보안 — `security/`
| 문서 | 내용 |
|---|---|
| [SECURITY](./security/SECURITY.md) | 위협 모델·인증/인가·비밀·데이터 보호 |

## 🤖 에이전트 — `agent/`
| 문서 | 내용 |
|---|---|
| [ADR](./agent/ADR.md) | 주요 결정 기록 |
| [STATE](./agent/STATE.md) | 앱 레벨 vs 서버 영속 상태 |
| [ISSUES](./agent/ISSUES.md) | 개발 중 발생한 이슈·반복 문제(3회+ → RULES 승격) |
| [RULES](./agent/RULES.md) | 절대 어기면 안 되는 불변 규칙 |

## 🔌 플러그인 (워크플로우 필수)
`/harness` 워크플로우(A 단계)는 두 플러그인의 스킬을 사용한다.

### gstack — <https://github.com/garrytan/gstack>
- 설치: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
- 워크플로우에서 쓰는 스킬: `/browse`(웹 브라우징), `/office-hours`(전문가 상담·논의), `/autoplan`(계획), `/design-review`(UI 검증), `/plan-eng-review`·`/plan-ceo-review`·`/plan-design-review`. 전체 목록은 [CLAUDE.md](../CLAUDE.md) §gstack.

### superpowers — <https://github.com/obra/superpowers>
- 설치: `/plugin install superpowers@claude-plugins-official` (또는 `/plugin marketplace add obra/superpowers-marketplace` 후 `/plugin install superpowers@superpowers-marketplace`).
- 워크플로우에서 쓰는 스킬: `brainstorming`(논의·대안 발산), `writing-plans`(step 설계), `subagent-driven-development`(step 구현 위임).

## 🧾 변경 로그
의미 있는 변경은 [LOG.md](./LOG.md)에 append-only로 기록한다(수정·삭제 금지).
