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

# Check if new migrations were added and validate them
NEW_MIGRATIONS=$(git diff --name-only --diff-filter=A HEAD 2>/dev/null | grep 'packages/db/src/migrations/.*\.sql$' || true)
if [[ -z "$NEW_MIGRATIONS" ]]; then
  NEW_MIGRATIONS=$(git status --porcelain packages/db/src/migrations/ 2>/dev/null | grep '^\?' | awk '{print $2}' | grep '\.sql$' || true)
fi

if [[ -n "$NEW_MIGRATIONS" ]]; then
  TOTAL=$((TOTAL + 1))
  CURRENT=$((CURRENT + 1))
  log_info "[$CURRENT/$TOTAL] Running: migrate (new migrations detected)"

  if [[ -n "${DATABASE_URL:-}" ]]; then
    if (cd "${REPO_ROOT}/packages/db" && npx drizzle-kit migrate 2>&1); then
      log_success "[$CURRENT/$TOTAL] migrate passed"
    else
      log_error "[$CURRENT/$TOTAL] migrate FAILED"
      log_error "Pipeline stopped. Fix migration errors before continuing."
      exit 1
    fi
  else
    log_warn "[$CURRENT/$TOTAL] migrate SKIPPED — no DATABASE_URL set (migrations will be validated in CI)"
  fi
fi

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
