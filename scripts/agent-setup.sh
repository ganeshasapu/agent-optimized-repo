#!/usr/bin/env bash
# agent:setup — Create isolated environment for agent development
# Usage: pnpm agent:setup [branch-name]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/neon.sh"

BRANCH_NAME="${1:-$(get_branch_id)}"

log_info "=== Agent Setup ==="
log_info "Branch: $BRANCH_NAME"

# Step 1: Install dependencies
log_info "Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Create Neon branch
DATABASE_URL=$(neon_create_branch "agent-${BRANCH_NAME}")
export DATABASE_URL

# Step 3: Write .env.local
cat > "${REPO_ROOT}/.env.local" << EOF
DATABASE_URL=${DATABASE_URL}
EOF
log_success "Wrote .env.local"

# Step 4: Run migrations
log_info "Running migrations..."
cd "${REPO_ROOT}"
pnpm db:migrate
log_success "Migrations complete"

# Step 5: Start dev server in background
log_info "Starting dev server..."
pnpm dev --filter=@biarritz/web &
DEV_PID=$!
echo "$DEV_PID" > "${REPO_ROOT}/.dev-pid"
log_success "Dev server started (PID: $DEV_PID)"

log_info "Waiting for dev server..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Dev server ready at http://localhost:3000"
    break
  fi
  sleep 1
done

log_success "=== Agent Setup Complete ==="
echo ""
echo "DATABASE_URL=${DATABASE_URL}"
echo "DEV_SERVER=http://localhost:3000"
echo "BRANCH_ID=$(cat "${REPO_ROOT}/.neon-branch-id")"
