#!/usr/bin/env bash
# agent:check — Lightweight check (typecheck + lint only)
# Usage: pnpm agent:check

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

cd "${REPO_ROOT}"

STEPS=("typecheck" "lint")
TOTAL=${#STEPS[@]}
CURRENT=0

for step in "${STEPS[@]}"; do
  CURRENT=$((CURRENT + 1))
  log_info "[$CURRENT/$TOTAL] Running: $step"

  if pnpm "$step" 2>&1; then
    log_success "[$CURRENT/$TOTAL] $step passed"
  else
    log_error "[$CURRENT/$TOTAL] $step FAILED"
    exit 1
  fi
done

log_success "=== Quick Check Passed ==="
