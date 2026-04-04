#!/usr/bin/env bash
# Linear GraphQL API helpers
# Requires: LINEAR_API_KEY

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

LINEAR_API_URL="https://api.linear.app/graphql"

linear_gql() {
  local query="$1"
  require_env LINEAR_API_KEY

  local response
  response=$(curl -s -S -X POST "$LINEAR_API_URL" \
    -H "Authorization: ${LINEAR_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$query" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

  local errors
  errors=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errors',''))" 2>/dev/null)
  if [[ -n "$errors" && "$errors" != "None" && "$errors" != "" ]]; then
    log_error "Linear API error: $errors"
    return 1
  fi

  echo "$response"
}

linear_get_issue() {
  local issue_id="$1"
  log_info "Fetching Linear issue: $issue_id"

  local query="
    query {
      issue(id: \"${issue_id}\") {
        id
        identifier
        title
        description
        priority
        state { name }
        labels { nodes { name } }
        comments { nodes { body user { name } } }
      }
    }
  "

  local response
  response=$(linear_gql "$query") || return 1
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

  local query="
    mutation {
      issueUpdate(id: \"${issue_id}\", input: { stateId: \"${state_id}\" }) {
        success
      }
    }
  "

  linear_gql "$query" > /dev/null
  log_success "Issue status updated"
}

linear_add_comment() {
  local issue_id="$1"
  local body="$2"
  log_info "Adding comment to issue $issue_id"

  local escaped_body
  escaped_body=$(echo "$body" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')

  local query="
    mutation {
      commentCreate(input: { issueId: \"${issue_id}\", body: \"${escaped_body}\" }) {
        success
      }
    }
  "

  linear_gql "$query" > /dev/null
  log_success "Comment added"
}

linear_create_issue() {
  local team_id="$1"
  local title="$2"
  local description="$3"
  local label_ids="$4"  # comma-separated label IDs, or empty

  log_info "Creating Linear issue: $title"

  local escaped_title
  escaped_title=$(echo "$title" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')
  local escaped_desc
  escaped_desc=$(echo "$description" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')

  local label_input=""
  if [[ -n "$label_ids" ]]; then
    label_input=", labelIds: [$(echo "$label_ids" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/' )]"
  fi

  local query="
    mutation {
      issueCreate(input: { teamId: \"${team_id}\", title: \"${escaped_title}\", description: \"${escaped_desc}\", priority: 4${label_input} }) {
        success
        issue { id identifier url }
      }
    }
  "

  local response
  response=$(linear_gql "$query") || return 1
  echo "$response" | python3 -c "
import sys, json
issue = json.load(sys.stdin)['data']['issueCreate']['issue']
print(json.dumps(issue))
"
}

linear_get_states() {
  local team_id="$1"
  log_info "Fetching workflow states for team $team_id"

  local query="
    query {
      team(id: \"${team_id}\") {
        states { nodes { id name type } }
      }
    }
  "

  local response
  response=$(linear_gql "$query") || return 1
  echo "$response" | python3 -c "
import sys, json
states = json.load(sys.stdin)['data']['team']['states']['nodes']
for s in states:
    print(f\"{s['id']}  {s['name']}  ({s['type']})\")
"
}
