#!/usr/bin/env bash
# TDD Guard Hook — PreToolUse[Edit|Write|apply_patch]
# Blocks implementation edits when no corresponding test file exists.
#
# Based on:
# https://github.com/jha0313/YOUTUBE/blob/main/harness_demo/scripts/hooks/tdd-guard.sh
#
# The source script checks .tool_input.file_path. This version also supports
# Codex apply_patch input, where changed paths are carried in .tool_input.command.

set -u

INPUT=$(cat)

if [ -z "$INPUT" ]; then
  exit 0
fi

# Pick a working Python. On Windows, `python3` may resolve to the Microsoft Store
# stub (App Execution Alias) which does nothing; fall back to `python` if so.
PYBIN=python3
"$PYBIN" -c '' >/dev/null 2>&1 || PYBIN=python
export PYTHONIOENCODING=utf-8  # ensure the (Korean) deny reason is emitted as UTF-8

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

deny() {
  local reason="$1"
  "$PYBIN" - "$reason" <<'PY'
import json
import sys

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": sys.argv[1],
    }
}, ensure_ascii=False))
PY
}

PATHS=$(
  "$PYBIN" - "$INPUT" <<'PY'
import json
import re
import sys

try:
    payload = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)

tool_input = payload.get("tool_input") or {}
items = []

for key in ("file_path", "path", "filename"):
    value = tool_input.get(key)
    if isinstance(value, str) and value:
        items.append(("update", value))

command = tool_input.get("command") or tool_input.get("cmd") or ""
if isinstance(command, str):
    for line in command.splitlines():
        match = re.match(r"^\*\*\* (Add|Update|Delete) File: (.+)$", line)
        if match:
            items.append((match.group(1).lower(), match.group(2).strip()))
            continue
        match = re.match(r"^\*\*\* Move to: (.+)$", line)
        if match:
            items.append(("update", match.group(1).strip()))

seen = set()
for action, path in items:
    key = (action, path)
    if key in seen:
        continue
    seen.add(key)
    print(f"{action}\t{path}")
PY
)

if [ -z "$PATHS" ]; then
  exit 0
fi

has_test_for() {
  local file_path="$1"
  local dir_name base_name parent_dir ext

  dir_name=$(dirname "$file_path")
  base_name=$(basename "$file_path" | sed -E 's/\.(ts|tsx|js|jsx)$//')
  parent_dir=$(dirname "$dir_name")

  for ext in ts tsx js jsx; do
    [ -f "${dir_name}/${base_name}.test.${ext}" ] && return 0
    [ -f "${dir_name}/${base_name}.spec.${ext}" ] && return 0
    [ -f "${dir_name}/__tests__/${base_name}.test.${ext}" ] && return 0
    [ -f "${dir_name}/__tests__/${base_name}.spec.${ext}" ] && return 0
    [ -f "${parent_dir}/__tests__/${base_name}.test.${ext}" ] && return 0
    [ -f "${parent_dir}/__tests__/${base_name}.spec.${ext}" ] && return 0
    [ -f "${PROJECT_ROOT}/src/__tests__/${base_name}.test.${ext}" ] && return 0
    [ -f "${PROJECT_ROOT}/src/__tests__/${base_name}.spec.${ext}" ] && return 0
  done

  # 이 레포는 컴포넌트 테스트를 src 옆이 아니라 tests/ 아래(tests/component, tests/a11y,
  # tests/unit …)에 kebab-case 파일로 둔다(예: MomentDateDialog → moment-date-dialog.test.tsx).
  # 중앙집중 테스트도 base 또는 kebab 이름으로 인정한다(TDD 강제 유지, 중복 0).
  local file_root kebab
  file_root=$(git -C "$dir_name" rev-parse --show-toplevel 2>/dev/null || echo "$PROJECT_ROOT")
  kebab=$(printf '%s' "$base_name" \
    | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g; s/([A-Z]+)([A-Z][a-z])/\1-\2/g' \
    | tr '[:upper:]' '[:lower:]')
  if [ -d "${file_root}/tests" ] && find "${file_root}/tests" -type f \
       \( -name "${base_name}.test.*" -o -name "${base_name}.spec.*" \
       -o -name "${kebab}.test.*" -o -name "${kebab}.spec.*" \) \
       -print -quit 2>/dev/null | grep -q .; then
    return 0
  fi

  return 1
}

while IFS=$'\t' read -r action file_path; do
  [ -z "$file_path" ] && continue
  [ "$action" = "delete" ] && continue

  case "$file_path" in
    *test*|*spec*|*.test.*|*.spec.*|*__tests__*) continue ;;
  esac

  case "$file_path" in
    *.json|*.css|*.scss|*.md|*.yml|*.yaml|*.env*|*.config.*|*tailwind*|*postcss*|*next.config*|*tsconfig*) continue ;;
  esac

  case "$file_path" in
    */types/*|*/types.ts|*/types.d.ts) continue ;;
  esac

  case "$file_path" in
    */layout.tsx|*/layout.ts|*/page.tsx|*/page.ts|*/loading.tsx|*/error.tsx|*/not-found.tsx|*/globals.css) continue ;;
  esac

  case "$file_path" in
    *.ts|*.tsx|*.js|*.jsx)
      if ! has_test_for "$file_path"; then
        base_name=$(basename "$file_path" | sed -E 's/\.(ts|tsx|js|jsx)$//')
        deny "TDD GUARD: '${base_name}'에 대한 테스트 파일이 존재하지 않습니다. 구현 코드를 작성하기 전에 테스트를 먼저 작성하세요. (테스트 파일 예: ${base_name}.test.ts)"
        exit 0
      fi
      ;;
  esac
done <<< "$PATHS"

exit 0
