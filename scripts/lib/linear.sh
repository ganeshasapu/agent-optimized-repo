#!/usr/bin/env bash
# Linear GraphQL API helpers
# Requires: LINEAR_API_KEY

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

LINEAR_API_URL="https://api.linear.app/graphql"

linear_gql() {
  local query="$1"
  require_env LINEAR_API_KEY

  # Build JSON payload via python3 to avoid shell escaping issues
  local payload
  payload=$(python3 -c "import json; print(json.dumps({'query': '''$query'''}))")

  local response
  response=$(curl -s -S -X POST "$LINEAR_API_URL" \
    -H "Authorization: ${LINEAR_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local errors
  errors=$(echo "$response" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    errs = d.get('errors', None)
    if errs:
        print(errs)
    else:
        print('')
except:
    print('PARSE_ERROR')
" 2>/dev/null)

  if [[ -n "$errors" && "$errors" != "" ]]; then
    log_error "Linear API error: $errors"
    return 1
  fi

  echo "$response"
}

linear_get_issue() {
  local issue_id="$1"
  log_info "Fetching Linear issue: $issue_id"

  local query='
    query {
      issue(id: "'"${issue_id}"'") {
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
  '

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

  local query='
    mutation {
      issueUpdate(id: "'"${issue_id}"'", input: { stateId: "'"${state_id}"'" }) {
        success
      }
    }
  '

  linear_gql "$query" > /dev/null
  log_success "Issue status updated"
}

linear_add_comment() {
  local issue_id="$1"
  local body="$2"
  log_info "Adding comment to issue $issue_id"

  local escaped_body
  escaped_body=$(python3 -c "import json; print(json.dumps('$body')[1:-1])")

  local query='
    mutation {
      commentCreate(input: { issueId: "'"${issue_id}"'", body: "'"${escaped_body}"'" }) {
        success
      }
    }
  '

  linear_gql "$query" > /dev/null
  log_success "Comment added"
}

linear_create_issue() {
  local team_id="$1"
  local title="$2"
  local description="$3"
  local label_ids="$4"  # comma-separated label IDs, or empty

  log_info "Creating Linear issue: $title"

  # Use python3 for the entire mutation to avoid escaping nightmares
  local response
  response=$(python3 -c "
import json, subprocess, os

team_id = '$team_id'
title = '''$title'''
description = '''$description'''
label_ids = '$label_ids'

mutation_input = {
    'teamId': team_id,
    'title': title.strip(),
    'description': description.strip(),
    'priority': 4
}
if label_ids:
    mutation_input['labelIds'] = [lid.strip() for lid in label_ids.split(',')]

# Build GraphQL mutation
title_escaped = json.dumps(title.strip())[1:-1]
desc_escaped = json.dumps(description.strip())[1:-1]
label_part = ''
if label_ids:
    ids = ', '.join(['\"' + lid.strip() + '\"' for lid in label_ids.split(',')])
    label_part = f', labelIds: [{ids}]'

query = f'''
mutation {{
  issueCreate(input: {{ teamId: \"{team_id}\", title: \"{title_escaped}\", description: \"{desc_escaped}\", priority: 4{label_part} }}) {{
    success
    issue {{ id identifier url }}
  }}
}}
'''

payload = json.dumps({'query': query})
result = subprocess.run(
    ['curl', '-s', '-S', '-X', 'POST', os.environ.get('LINEAR_API_URL', 'https://api.linear.app/graphql'),
     '-H', f'Authorization: {os.environ[\"LINEAR_API_KEY\"]}',
     '-H', 'Content-Type: application/json',
     '-d', payload],
    capture_output=True, text=True
)
data = json.loads(result.stdout)
if 'errors' in data:
    print(json.dumps({'error': data['errors']}))
else:
    print(json.dumps(data['data']['issueCreate']['issue']))
") || return 1

  echo "$response"
}

linear_get_states() {
  local team_id="$1"
  log_info "Fetching workflow states for team $team_id"

  local query='
    query {
      team(id: "'"${team_id}"'") {
        states { nodes { id name type } }
      }
    }
  '

  local response
  response=$(linear_gql "$query") || return 1
  echo "$response" | python3 -c "
import sys, json
states = json.load(sys.stdin)['data']['team']['states']['nodes']
for s in states:
    print(f\"{s['id']}  {s['name']}  ({s['type']})\")
"
}
