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

linear_create_spec() {
  local title="" problem="" approach="" scope_in="" scope_out=""
  local done_criteria="" files="" risks="" source_ticket=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title)         title="$2";         shift 2 ;;
      --problem)       problem="$2";       shift 2 ;;
      --approach)      approach="$2";      shift 2 ;;
      --scope-in)      scope_in="$2";      shift 2 ;;
      --scope-out)     scope_out="$2";     shift 2 ;;
      --done)          done_criteria="$2"; shift 2 ;;
      --files)         files="$2";         shift 2 ;;
      --risks)         risks="$2";         shift 2 ;;
      --source-ticket) source_ticket="$2"; shift 2 ;;
      *) log_error "linear_create_spec: unknown flag: $1"; return 1 ;;
    esac
  done

  local missing=()
  [[ -z "$title" ]]         && missing+=("--title")
  [[ -z "$problem" ]]       && missing+=("--problem")
  [[ -z "$approach" ]]      && missing+=("--approach")
  [[ -z "$scope_in" ]]      && missing+=("--scope-in")
  [[ -z "$scope_out" ]]     && missing+=("--scope-out")
  [[ -z "$done_criteria" ]] && missing+=("--done")
  [[ -z "$files" ]]         && missing+=("--files")
  [[ -z "$risks" ]]         && missing+=("--risks")
  [[ -z "$source_ticket" ]] && missing+=("--source-ticket")

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "linear_create_spec: missing required flags: ${missing[*]}"
    return 1
  fi

  require_env LINEAR_TEAM_ID
  require_env LINEAR_STATUS_BACKLOG

  log_info "Creating spec ticket: $title"

  local description
  description=$(cat <<EOF
## Problem
${problem}

## Proposed approach
${approach}

## Scope
**In scope:**
${scope_in}

**Out of scope:**
${scope_out}

## Done criteria
${done_criteria}

## Files / areas touched
${files}

## Risks
${risks}

---
*Spec authored by agent while working on [${source_ticket}](https://linear.app/issue/${source_ticket}). Move to Todo to trigger implementation; edit description freely before doing so.*
EOF
)

  local escaped_title
  escaped_title=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$title")
  local escaped_desc
  escaped_desc=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$description")

  local response
  response=$(linear_gql "mutation { issueCreate(input: { teamId: \"${LINEAR_TEAM_ID}\", stateId: \"${LINEAR_STATUS_BACKLOG}\", title: \"${escaped_title}\", description: \"${escaped_desc}\", priority: 3 }) { success issue { id identifier url } } }") || return 1
  echo "$response" | python3 -c "
import sys, json
issue = json.load(sys.stdin)['data']['issueCreate']['issue']
print(json.dumps(issue))
print(f\"Created spec: {issue['identifier']} — {issue['url']}\", file=sys.stderr)
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
