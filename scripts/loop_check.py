#!/usr/bin/env python3
"""
Harness Loop Check — 작업을 "끝났다"고 멈추기 전 기계 게이트(loop).

이 프레임워크의 "확인 기준"은 3계층이다:
  ① Step AC      — step{N}.md 의 실행 가능 커맨드. execute.py 세션이 자가검증 (전방 게이트).
  ② 기계 게이트   — lint·build·test green. 이 스크립트가 Stop 시점에 강제.
  ③ 정성 확인     — 누적 diff ↔ 정본 통합 체크리스트(4그룹·14항목) 대조. /loop-check 이 LLM 으로 수행
                    (review.md 표 재사용).

이 스크립트는 ②를 담당하고, /loop-check 커맨드가 ②를 돌린 뒤 ③를 표로 점검하고 --ack 한다.

게이트 커맨드는 CLAUDE.md §명령어 에서 읽는다(스택 비종속). 각 줄은 `<command>  # <comment>`
형식이며, 주석에 `gate: lint|build|test` 를 달면 분류를 강제할 수 있다(npm 외 스택용).

모드:
    --gate     Stop hook 용. scope·ack·스마트 차단. stdin 으로 Stop hook JSON 을 받는다.
    --report   /loop-check 용. 전체 게이트(lint+build+test)+어드바이저리를 사람이 읽게 출력.
    --ack      /loop-check 마지막. 게이트가 green 일 때만 현재 diff 서명을 ack 로 기록(red 우회 불가).

대화형/헤드리스 분기 (HARNESS_HEADLESS=1 이면 헤드리스):
    헤드리스(execute.py 배치) — 기계 게이트만 하드 실패로 적용. ack/체크리스트 주입 없음.
                                 step AC 자가검증이 실질 게이트.
    대화형(사람 세션)        — red=차단 / green+미ack=1회 차단+통합 체크리스트 주입 / ack=통과.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ACK_FILE = ROOT / ".claude" / ".loop-ack"
GATE_TIMEOUT = 600  # 초

# CLAUDE.md 가 아직 템플릿이면 게이트를 걸 수 없다(프로젝트 미구성).
TEMPLATE_MARKERS = ("{프로젝트명}", "{프레임워크 (예:", "{언어 (예:")

# scope 에서 제외할 경로(코드가 아님). 이 외 변경이 있으면 게이트를 돈다.
NON_CODE_PREFIXES = ("docs/", "phases/", ".claude/")
NON_CODE_SUFFIXES = (".md",)


# ---------------------------------------------------------------------------
# git helpers
# ---------------------------------------------------------------------------

def _git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=str(ROOT),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )


def changed_files() -> list[str]:
    """working tree 의 변경/추가 파일(staged+unstaged+untracked) 경로 목록."""
    r = _git("status", "--porcelain")
    if r.returncode != 0:
        return []
    files = []
    for line in r.stdout.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip()
        # rename: "old -> new"
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        files.append(path.strip().strip('"'))
    return files


def is_code_path(path: str) -> bool:
    p = path.replace("\\", "/")
    if any(p.startswith(pre) for pre in NON_CODE_PREFIXES):
        return False
    if any(p.endswith(suf) for suf in NON_CODE_SUFFIXES):
        return False
    return True


def has_code_scope() -> bool:
    return any(is_code_path(f) for f in changed_files())


def diff_signature() -> str:
    """현재 변경 상태의 서명. 코드가 더 바뀌면 서명이 바뀌어 ack 가 무효화된다."""
    status = _git("status", "--porcelain").stdout
    diff = _git("diff", "HEAD").stdout
    h = hashlib.sha1()
    h.update(status.encode("utf-8", "replace"))
    h.update(diff.encode("utf-8", "replace"))
    return h.hexdigest()


# ---------------------------------------------------------------------------
# CLAUDE.md §명령어 파싱
# ---------------------------------------------------------------------------

def _classify(command: str, comment: str) -> str | None:
    """커맨드/주석을 lint·build·test 역할로 분류. 해당 없으면 None."""
    m = re.search(r"gate:\s*(lint|build|test)", comment, re.IGNORECASE)
    if m:
        return m.group(1).lower()
    c = command.lower()
    # dev 서버·E2E·시작 커맨드는 게이트 대상이 아니다.
    if any(skip in c for skip in ("dev", "start", "serve", "playwright", "watch")):
        return None
    if "lint" in c:
        return "lint"
    if "build" in c or "compile" in c or "tsc" in c:
        return "build"
    if "test" in c:
        return "test"
    return None


def parse_gate_commands() -> dict[str, str]:
    """CLAUDE.md §명령어 에서 {role: command} 를 추출한다. 템플릿이면 빈 dict."""
    claude_md = ROOT / "CLAUDE.md"
    if not claude_md.exists():
        return {}
    text = claude_md.read_text(encoding="utf-8")
    if any(marker in text for marker in TEMPLATE_MARKERS):
        return {}

    # `## 명령어` 섹션만 떼어낸다.
    lines = text.splitlines()
    section: list[str] = []
    in_section = False
    for line in lines:
        if re.match(r"^##\s+명령어", line):
            in_section = True
            continue
        if in_section and re.match(r"^##\s+\S", line):
            break
        if in_section:
            section.append(line)

    commands: dict[str, str] = {}
    for raw in section:
        line = raw.strip().strip("`")
        if not line or line.startswith(">") or line.startswith("#"):
            continue
        if "#" in line:
            command, comment = line.split("#", 1)
        else:
            command, comment = line, ""
        command = command.strip()
        if not command:
            continue
        role = _classify(command, comment)
        if role and role not in commands:
            commands[role] = command
    return commands


# ---------------------------------------------------------------------------
# 게이트 실행
# ---------------------------------------------------------------------------

def run_command(command: str) -> tuple[bool, str]:
    """shell 로 실행. (성공여부, 출력) 반환."""
    try:
        r = subprocess.run(
            command, cwd=str(ROOT), shell=True,
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=GATE_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        return False, f"$ {command}\n[TIMEOUT {GATE_TIMEOUT}s]"
    out = (r.stdout or "") + (r.stderr or "")
    return r.returncode == 0, f"$ {command}\n{out.strip()}"


def run_gate(roles: list[str]) -> tuple[bool, list[str]]:
    """주어진 역할 커맨드를 순서대로 실행. (전체통과, [실패한 역할 출력]) 반환."""
    commands = parse_gate_commands()
    failures: list[str] = []
    for role in roles:
        cmd = commands.get(role)
        if not cmd:
            continue  # 정의 안 된 역할은 skip
        ok, output = run_command(cmd)
        if not ok:
            failures.append(f"[{role}] 실패\n{output}")
    return (not failures), failures


# ---------------------------------------------------------------------------
# ack 저장/조회
# ---------------------------------------------------------------------------

def read_ack() -> str | None:
    if ACK_FILE.exists():
        return ACK_FILE.read_text(encoding="utf-8").strip()
    return None


def write_ack(sig: str) -> None:
    ACK_FILE.parent.mkdir(parents=True, exist_ok=True)
    ACK_FILE.write_text(sig, encoding="utf-8")


# ---------------------------------------------------------------------------
# Stop hook 출력
# ---------------------------------------------------------------------------

def _allow() -> int:
    return 0


def _block(reason: str) -> int:
    print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    return 0


CHECKLIST = """\
멈추기 전 loop-check 정성 점검이 필요하다. green 게이트는 통과했으나 아직 ack 되지 않았다.
`/loop-check` 를 실행해 아래 통합 체크리스트(= /review, 4그룹·14항목)를 변경 diff 와 대조해
표로 점검한 뒤 ack 하라 (또는 `python scripts/loop_check.py --ack`):

  [제품·UX]   1 PRD 의도(docs/user/PRD.md) · 2 유저 플로우(docs/user/USER_FLOW.md)
              3 스크린(docs/design/SCREENS.md) · 4 디자인 가이드(docs/design/DESIGN_GUIDE.md, AI 슬롭 금지)
  [구현·구조] 5 아키텍처(docs/dev/ARCHITECTURE.md) · 6 기술 스택(docs/agent/ADR.md)
              7 코딩 컨벤션(docs/dev/CODING_CONVENTION.md) · 8 DB/스키마 충돌(docs/dev/DB.md)
  [규칙·보안] 9 RULES(docs/agent/RULES.md) · 10 보안(docs/security/SECURITY.md) · 11 CRITICAL(CLAUDE.md)
  [품질·게이트] 12 tasks/AC 누락(phases/{task}/index.json) · 13 테스트 존재 · 14 빌드/게이트(이미 green)

review.md §출력 형식 표로 보고하고, 전부 ✅ 면 ack 하라."""


def cmd_gate(stdin_text: str) -> int:
    try:
        payload = json.loads(stdin_text) if stdin_text.strip() else {}
    except json.JSONDecodeError:
        payload = {}
    stop_hook_active = bool(payload.get("stop_hook_active"))
    headless = os.environ.get("HARNESS_HEADLESS") == "1"

    # 코드 변경이 없으면(순수 docs 등) 게이트 skip.
    if not has_code_scope():
        return _allow()

    # 게이트 커맨드를 못 구하면(CLAUDE.md 템플릿/미구성) 게이트 불가 → 통과.
    if not parse_gate_commands():
        return _allow()

    passed, failures = run_gate(["lint", "build"])

    if not passed:
        # 무한루프 방지: 같은 체인에서 이미 한 번 막았으면 통과시켜 표면화만.
        if stop_hook_active:
            return _allow()
        reason = "기계 게이트(lint/build) 실패. 고친 뒤 다시 멈춰라:\n\n" + "\n\n".join(failures)
        return _block(reason)

    # 게이트 green.
    if headless:
        # 헤드리스: step AC 자가검증이 실질 게이트. ack/주입 없이 통과.
        return _allow()

    # 대화형: ack 확인.
    if read_ack() == diff_signature():
        return _allow()
    if stop_hook_active:
        return _allow()  # 백스톱: 동일 체인 1회만 주입.
    return _block(CHECKLIST)


def cmd_report() -> int:
    commands = parse_gate_commands()
    print("=" * 60)
    print("  Harness Loop Check — report")
    print("=" * 60)

    if not has_code_scope():
        print("  scope: 코드 변경 없음(docs 등) — 기계 게이트 skip.")
        print("  정성 체크리스트 항목만 LLM 이 점검한다.")
        return 0
    if not commands:
        print("  게이트 커맨드를 CLAUDE.md §명령어 에서 찾지 못함(템플릿/미구성).")
        print("  §명령어 를 채우거나 주석에 `gate: lint|build|test` 를 달아라.")
        return 0

    print(f"  게이트 커맨드: {', '.join(f'{k}={v!r}' for k, v in commands.items())}")
    passed, failures = run_gate(["lint", "build", "test"])
    print("-" * 60)
    if passed:
        print("  하드 게이트: ✅ lint·build·test 통과")
    else:
        print("  하드 게이트: ❌ 실패")
        for f in failures:
            print("\n" + f)

    # 어드바이저리(신호만)
    print("-" * 60)
    print("  어드바이저리:")
    code_files = [f for f in changed_files() if is_code_path(f)]
    print(f"   - 변경 코드 파일 수: {len(code_files)}")
    migrations = [f for f in code_files if "migration" in f.lower()]
    if migrations:
        print(f"   - 새 마이그레이션 감지: {migrations}")
    print("-" * 60)
    print("  → 정성 체크리스트(PRD·유저플로우·스크린·아키텍처·RULES·보안 등 14항목)는 review.md 표로 LLM 이 점검.")
    print("  → 전부 ✅ 면: python scripts/loop_check.py --ack")
    return 0 if passed else 1


def cmd_ack() -> int:
    if not has_code_scope():
        print("코드 변경이 없어 ack 가 필요 없다(게이트 skip).")
        return 0
    if not parse_gate_commands():
        print("게이트 커맨드 미구성 — ack 생략.")
        return 0
    passed, failures = run_gate(["lint", "build", "test"])
    if not passed:
        print("ack 거부: 게이트가 red 다(red 우회 불가). 먼저 고쳐라:\n", file=sys.stderr)
        for f in failures:
            print(f, file=sys.stderr)
        return 1
    write_ack(diff_signature())
    print("✅ ack 기록됨. 이번 diff 로는 Stop 게이트를 통과한다.")
    return 0


def main() -> int:
    # Windows 콘솔(cp949)은 em-dash·박스문자·이모지를 못 쓴다 → UTF-8 로 강제.
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    parser = argparse.ArgumentParser(description="Harness Loop Check")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--gate", action="store_true", help="Stop hook 게이트")
    group.add_argument("--report", action="store_true", help="/loop-check 전체 리포트")
    group.add_argument("--ack", action="store_true", help="green 일 때 ack 기록")
    args = parser.parse_args()

    if args.gate:
        return cmd_gate(sys.stdin.read())
    if args.report:
        return cmd_report()
    if args.ack:
        return cmd_ack()
    return 0


if __name__ == "__main__":
    sys.exit(main())
