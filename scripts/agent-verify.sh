#!/usr/bin/env bash
# agent:verify — Run full verification pipeline
# Usage: pnpm agent:verify
# Runs: typecheck -> lint -> test -> build (fails fast)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

cd "${REPO_ROOT}"

STEPS=("typecheck" "lint" "test" "build")
TOTAL=${#STEPS[@]}
CURRENT=0

for step in "${STEPS[@]}"; do
  CURRENT=$((CURRENT + 1))
  log_info "[$CURRENT/$TOTAL] Running: $step"

  if pnpm "$step" 2>&1; then
    log_success "[$CURRENT/$TOTAL] $step passed"
  else
    log_error "[$CURRENT/$TOTAL] $step FAILED"
    log_error "Pipeline stopped. Fix $step errors before continuing."
    exit 1
  fi
done

log_success "=== All Checks Passed ==="
