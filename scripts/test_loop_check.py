"""
loop_check.py 단위 테스트.

게이트 커맨드 파싱·scope 판정·ack 흐름·Stop hook 분기(대화형/헤드리스)를 검증한다.
실제 lint/build 를 돌리지 않도록 run_gate / git helper 는 monkeypatch 한다.
"""

import importlib
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
import loop_check as lc


# ---------------------------------------------------------------------------
# §명령어 파싱
# ---------------------------------------------------------------------------

NODE_CLAUDE_MD = """\
# 프로젝트: Demo

## 명령어
> 주석 줄은 무시된다.

npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run test         # 단위/컴포넌트/통합
npx playwright test  # E2E (헤드리스)

## 다음 섹션
무관한 내용
"""

TEMPLATE_CLAUDE_MD = """\
# 프로젝트: {프로젝트명}

## 명령어
npm run build
"""

GAME_CLAUDE_MD = """\
# 프로젝트: Game

## 명령어
godot --headless --check-only   # gate: build
gut -gdir=res://test            # gate: test
godot --editor                  # 에디터 (게이트 아님)
"""


@pytest.fixture
def patch_claude_md(monkeypatch, tmp_path):
    """ROOT/CLAUDE.md 를 임시 내용으로 바꿔치우는 헬퍼를 반환한다."""
    def _set(content: str):
        root = tmp_path
        (root / "CLAUDE.md").write_text(content, encoding="utf-8")
        monkeypatch.setattr(lc, "ROOT", root)
        monkeypatch.setattr(lc, "ACK_FILE", root / ".claude" / ".loop-ack")
    return _set


def test_parse_node_commands(patch_claude_md):
    patch_claude_md(NODE_CLAUDE_MD)
    cmds = lc.parse_gate_commands()
    assert cmds["lint"] == "npm run lint"
    assert cmds["build"] == "npm run build"
    assert cmds["test"] == "npm run test"


def test_parse_skips_dev_and_e2e(patch_claude_md):
    patch_claude_md(NODE_CLAUDE_MD)
    cmds = lc.parse_gate_commands()
    # dev 서버와 playwright(E2E)는 게이트 역할로 잡히지 않는다.
    assert all(v not in ("npm run dev", "npx playwright test") for v in cmds.values())


def test_parse_template_returns_empty(patch_claude_md):
    patch_claude_md(TEMPLATE_CLAUDE_MD)
    assert lc.parse_gate_commands() == {}


def test_parse_gate_annotation_for_non_node(patch_claude_md):
    """npm 키워드가 없어도 `gate:` 주석으로 분류된다(스택 비종속)."""
    patch_claude_md(GAME_CLAUDE_MD)
    cmds = lc.parse_gate_commands()
    assert cmds["build"] == "godot --headless --check-only"
    assert cmds["test"] == "gut -gdir=res://test"
    assert "lint" not in cmds


# ---------------------------------------------------------------------------
# scope 판정
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("path,expected", [
    ("src/app/page.tsx", True),
    ("scripts/loop_check.py", True),
    ("docs/user/PRD.md", False),
    ("README.md", False),
    ("phases/0-mvp/index.json", False),
    (".claude/settings.json", False),
])
def test_is_code_path(path, expected):
    assert lc.is_code_path(path) is expected


def test_has_code_scope(monkeypatch):
    monkeypatch.setattr(lc, "changed_files", lambda: ["docs/user/PRD.md", "src/lib/x.ts"])
    assert lc.has_code_scope() is True


def test_has_code_scope_docs_only(monkeypatch):
    monkeypatch.setattr(lc, "changed_files", lambda: ["docs/user/PRD.md", "README.md"])
    assert lc.has_code_scope() is False


# ---------------------------------------------------------------------------
# Stop hook 게이트 분기
# ---------------------------------------------------------------------------

@pytest.fixture
def gate_env(monkeypatch):
    """게이트 분기 테스트용 공통 monkeypatch. 반환값으로 상태를 조절한다."""
    state = {"scope": True, "commands": {"lint": "x", "build": "y"},
             "gate_pass": True, "sig": "SIG", "ack": None}
    monkeypatch.setattr(lc, "has_code_scope", lambda: state["scope"])
    monkeypatch.setattr(lc, "parse_gate_commands", lambda: state["commands"])
    monkeypatch.setattr(lc, "run_gate", lambda roles: (state["gate_pass"], [] if state["gate_pass"] else ["[lint] 실패"]))
    monkeypatch.setattr(lc, "diff_signature", lambda: state["sig"])
    monkeypatch.setattr(lc, "read_ack", lambda: state["ack"])
    monkeypatch.delenv("HARNESS_HEADLESS", raising=False)
    return state


def _gate(stdin="{}", capsys=None):
    rc = lc.cmd_gate(stdin)
    return rc


def test_gate_skips_when_no_scope(gate_env, capsys):
    gate_env["scope"] = False
    lc.cmd_gate("{}")
    assert capsys.readouterr().out == ""  # block 출력 없음 = 통과


def test_gate_skips_when_no_commands(gate_env, capsys):
    gate_env["commands"] = {}
    lc.cmd_gate("{}")
    assert capsys.readouterr().out == ""


def test_gate_blocks_on_red(gate_env, capsys):
    gate_env["gate_pass"] = False
    lc.cmd_gate("{}")
    out = json.loads(capsys.readouterr().out)
    assert out["decision"] == "block"
    assert "lint/build" in out["reason"]


def test_gate_red_but_stop_hook_active_passes(gate_env, capsys):
    """무한루프 방지: 같은 체인에서 이미 막았으면 red 여도 통과."""
    gate_env["gate_pass"] = False
    lc.cmd_gate(json.dumps({"stop_hook_active": True}))
    assert capsys.readouterr().out == ""


def test_gate_headless_green_passes_without_ack(gate_env, monkeypatch, capsys):
    monkeypatch.setenv("HARNESS_HEADLESS", "1")
    lc.cmd_gate("{}")
    assert capsys.readouterr().out == ""  # ack 없이도 통과


def test_gate_interactive_green_unacked_blocks_with_checklist(gate_env, capsys):
    gate_env["ack"] = None
    lc.cmd_gate("{}")
    out = json.loads(capsys.readouterr().out)
    assert out["decision"] == "block"
    assert "loop-check" in out["reason"]
    assert "PRD 의도" in out["reason"]  # 통합 체크리스트가 주입됐는지


def test_gate_interactive_green_acked_passes(gate_env, capsys):
    gate_env["ack"] = "SIG"  # diff_signature 와 일치
    lc.cmd_gate("{}")
    assert capsys.readouterr().out == ""


def test_gate_interactive_stale_ack_blocks(gate_env, capsys):
    gate_env["ack"] = "OLD-SIG"  # 코드가 더 바뀌어 서명 불일치
    lc.cmd_gate("{}")
    out = json.loads(capsys.readouterr().out)
    assert out["decision"] == "block"


def test_gate_green_unacked_stop_hook_active_passes(gate_env, capsys):
    gate_env["ack"] = None
    lc.cmd_gate(json.dumps({"stop_hook_active": True}))
    assert capsys.readouterr().out == ""  # 백스톱


# ---------------------------------------------------------------------------
# ack 흐름
# ---------------------------------------------------------------------------

def test_ack_refused_when_red(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(lc, "ACK_FILE", tmp_path / ".loop-ack")
    monkeypatch.setattr(lc, "has_code_scope", lambda: True)
    monkeypatch.setattr(lc, "parse_gate_commands", lambda: {"lint": "x"})
    monkeypatch.setattr(lc, "run_gate", lambda roles: (False, ["[lint] 실패"]))
    rc = lc.cmd_ack()
    assert rc == 1
    assert not (tmp_path / ".loop-ack").exists()


def test_ack_records_sig_when_green(monkeypatch, tmp_path):
    monkeypatch.setattr(lc, "ACK_FILE", tmp_path / ".loop-ack")
    monkeypatch.setattr(lc, "has_code_scope", lambda: True)
    monkeypatch.setattr(lc, "parse_gate_commands", lambda: {"lint": "x"})
    monkeypatch.setattr(lc, "run_gate", lambda roles: (True, []))
    monkeypatch.setattr(lc, "diff_signature", lambda: "NEWSIG")
    rc = lc.cmd_ack()
    assert rc == 0
    assert (tmp_path / ".loop-ack").read_text(encoding="utf-8").strip() == "NEWSIG"


def test_ack_skipped_without_scope(monkeypatch, tmp_path):
    monkeypatch.setattr(lc, "ACK_FILE", tmp_path / ".loop-ack")
    monkeypatch.setattr(lc, "has_code_scope", lambda: False)
    rc = lc.cmd_ack()
    assert rc == 0
