#!/usr/bin/env bash
# Neon branch management helpers
# Requires: NEON_API_KEY, NEON_PROJECT_ID

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

NEON_API_BASE="https://console.neon.tech/api/v2"

neon_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"

  local args=(
    -s -S
    -X "$method"
    -H "Authorization: Bearer ${NEON_API_KEY}"
    -H "Content-Type: application/json"
  )

  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  curl "${args[@]}" "${NEON_API_BASE}${endpoint}"
}

neon_create_branch() {
  local branch_name="$1"
  require_env NEON_API_KEY
  require_env NEON_PROJECT_ID

  log_info "Creating Neon branch: $branch_name"

  local response
  response=$(neon_api POST "/projects/${NEON_PROJECT_ID}/branches" \
    "{\"branch\":{\"name\":\"${branch_name}\"},\"endpoints\":[{\"type\":\"read_write\"}]}")

  local branch_id
  branch_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)['branch']['id'])" 2>/dev/null) \
    || die "Failed to create Neon branch. Response: $response"

  local conn_response
  conn_response=$(neon_api GET "/projects/${NEON_PROJECT_ID}/connection_uri?branch_id=${branch_id}&role_name=neondb_owner&database_name=neondb")

  local conn_uri
  conn_uri=$(echo "$conn_response" | python3 -c "import sys,json; print(json.load(sys.stdin)['uri'])" 2>/dev/null) \
    || die "Failed to get connection URI. Response: $conn_response"

  echo "$branch_id" > "${REPO_ROOT}/.neon-branch-id"
  log_success "Neon branch created: $branch_id"
  echo "$conn_uri"
}

neon_delete_branch() {
  local branch_id="$1"
  require_env NEON_API_KEY
  require_env NEON_PROJECT_ID

  log_info "Deleting Neon branch: $branch_id"
  neon_api DELETE "/projects/${NEON_PROJECT_ID}/branches/${branch_id}" > /dev/null
  rm -f "${REPO_ROOT}/.neon-branch-id"
  log_success "Neon branch deleted"
}
