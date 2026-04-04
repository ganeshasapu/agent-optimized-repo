#!/usr/bin/env bash
# agent:teardown — Clean up agent environment
# Usage: pnpm agent:teardown

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/neon.sh"

log_info "=== Agent Teardown ==="

# Step 1: Stop dev server
if [[ -f "${REPO_ROOT}/.dev-pid" ]]; then
  DEV_PID=$(cat "${REPO_ROOT}/.dev-pid")
  if kill -0 "$DEV_PID" 2>/dev/null; then
    log_info "Stopping dev server (PID: $DEV_PID)..."
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
    log_success "Dev server stopped"
  fi
  rm -f "${REPO_ROOT}/.dev-pid"
fi

# Step 2: Delete Neon branch
if [[ -f "${REPO_ROOT}/.neon-branch-id" ]]; then
  BRANCH_ID=$(cat "${REPO_ROOT}/.neon-branch-id")
  neon_delete_branch "$BRANCH_ID"
fi

# Step 3: Clean up local env
rm -f "${REPO_ROOT}/.env.local"

log_success "=== Agent Teardown Complete ==="
