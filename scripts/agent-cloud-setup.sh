#!/usr/bin/env bash
# agent:cloud-setup — Set up the cloud agent environment
# This runs as the setup command in claude.ai/code.
# Usage: pnpm agent:cloud-setup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/neon.sh"

BRANCH_NAME="agent-$(date +%s)-${RANDOM}"

log_info "=== Cloud Agent Setup ==="

# Step 1: Install dependencies
log_info "Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Create Neon branch
DATABASE_URL=$(neon_create_branch "$BRANCH_NAME")
export DATABASE_URL

# Step 3: Write .env.local
cat > "${REPO_ROOT}/.env.local" << EOF
DATABASE_URL=${DATABASE_URL}
EOF
log_success "Wrote .env.local"

# Step 4: Run migrations
log_info "Running migrations..."
cd "${REPO_ROOT}/packages/db"
DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate
log_success "Migrations complete"

# Step 5: Install Momentic browsers for e2e tests
log_info "Installing Momentic browsers..."
npx momentic install-browsers --all
log_success "Momentic browsers installed"

# Step 6: Validate MOMENTIC_API_KEY (required for MCP and AI steps)
if [[ -z "${MOMENTIC_API_KEY:-}" ]]; then
  log_error "MOMENTIC_API_KEY is not set — Momentic MCP server will fail and the agent cannot author e2e tests"
  log_error "Set it in the CI secret store or .env.local for local dev"
  exit 1
fi
log_success "MOMENTIC_API_KEY is set"

log_success "=== Cloud Agent Setup Complete ==="
echo ""
echo "DATABASE_URL=${DATABASE_URL}"
echo "NEON_BRANCH_ID=$(cat "${REPO_ROOT}/.neon-branch-id")"
