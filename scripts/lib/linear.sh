#!/usr/bin/env bash
# Linear GraphQL API helpers
# Requires: LINEAR_API_KEY

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

LINEAR_API_URL="https://api.linear.app/graphql"

linear_gql() {
  local query="$1"
  require_env LINEAR_API_KEY

  # Write query to temp file, use python3 to build JSON payload
  local tmpfile
  tmpfile=$(mktemp)
  echo "$query" > "$tmpfile"

  local payload
  payload=$(python3 -c "
import json
with open('$tmpfile') as f:
    query = f.read()
print(json.dumps({'query': query}))
")
  rm -f "$tmpfile"

  local response
  response=$(curl -s -S -X POST "$LINEAR_API_URL" \
    -H "Authorization: ${LINEAR_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1)

  if [[ -z "$response" ]]; then
    log_error "Linear API returned empty response"
    return 1
  fi

  # Check for errors
  local has_errors
  has_errors=$(echo "$response" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'errors' in d:
        print(d['errors'])
except:
    print('')
" 2>/dev/null)

  if [[ -n "$has_errors" ]]; then
    log_error "Linear API error: $has_errors"
    return 1
  fi

  echo "$response"
}

linear_get_issue() {
  local issue_id="$1"
  log_info "Fetching Linear issue: $issue_id"

  local response
  response=$(linear_gql "query { issue(id: \"${issue_id}\") { id identifier title description priority state { name } labels { nodes { name } } comments { nodes { body user { name } } } } }") || return 1
  echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']['issue']
print(json.dumps(data, indent=2))
"
}

linear_update_issue_status() {
  local issue_id="$1"
  local state_id="$2"
  log_info "Updating issue $issue_id status to state $state_id"

  linear_gql "mutation { issueUpdate(id: \"${issue_id}\", input: { stateId: \"${state_id}\" }) { success } }" > /dev/null
  log_success "Issue status updated"
}

linear_add_comment() {
  local issue_id="$1"
  local body="$2"
  log_info "Adding comment to issue $issue_id"

  # Escape body for GraphQL string
  local escaped_body
  escaped_body=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$body")

  linear_gql "mutation { commentCreate(input: { issueId: \"${issue_id}\", body: \"${escaped_body}\" }) { success } }" > /dev/null
  log_success "Comment added"
}

linear_create_issue() {
  local team_id="$1"
  local title="$2"
  local description="$3"
  local label_ids="$4"

  log_info "Creating Linear issue: $title"

  local escaped_title
  escaped_title=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$title")
  local escaped_desc
  escaped_desc=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$description")

  local label_part=""
  if [[ -n "$label_ids" ]]; then
    label_part=$(python3 -c "
import sys
ids = sys.argv[1].split(',')
print(', labelIds: [' + ', '.join(['\"' + i.strip() + '\"' for i in ids]) + ']')
" "$label_ids")
  fi

  local response
  response=$(linear_gql "mutation { issueCreate(input: { teamId: \"${team_id}\", title: \"${escaped_title}\", description: \"${escaped_desc}\", priority: 4${label_part} }) { success issue { id identifier url } } }") || return 1
  echo "$response" | python3 -c "
import sys, json
issue = json.load(sys.stdin)['data']['issueCreate']['issue']
print(json.dumps(issue))
"
}

linear_create_sub_issue() {
  local team_id="$1"
  local parent_id="$2"
  local title="$3"
  local description="$4"

  log_info "Creating sub-issue: $title (parent: $parent_id)"

  local escaped_title
  escaped_title=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$title")
  local escaped_desc
  escaped_desc=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$description")

  local response
  response=$(linear_gql "mutation { issueCreate(input: { teamId: \"${team_id}\", parentId: \"${parent_id}\", title: \"${escaped_title}\", description: \"${escaped_desc}\", priority: 3 }) { success issue { id identifier url } } }") || return 1
  echo "$response" | python3 -c "
import sys, json
issue = json.load(sys.stdin)['data']['issueCreate']['issue']
print(json.dumps(issue))
"
}

linear_get_states() {
  local team_id="$1"
  log_info "Fetching workflow states for team $team_id"

  local response
  response=$(linear_gql "query { team(id: \"${team_id}\") { states { nodes { id name type } } } }") || return 1
  echo "$response" | python3 -c "
import sys, json
states = json.load(sys.stdin)['data']['team']['states']['nodes']
for s in states:
    print(f\"{s['id']}  {s['name']}  ({s['type']})\")
"
}
