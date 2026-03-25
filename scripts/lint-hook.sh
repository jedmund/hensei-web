#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
file_path=$(echo "$input" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path || '')")

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

if echo "$file_path" | grep -qE '\.(js|ts|svelte|json|css|scss|md|html|yaml|yml)$'; then
  pnpm exec prettier --write "$file_path" 2>/dev/null || true
fi

if echo "$file_path" | grep -qE '\.(js|ts|svelte)$'; then
  pnpm exec eslint --cache --fix "$file_path" 2>/dev/null || true
fi
