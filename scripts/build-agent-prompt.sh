#!/usr/bin/env bash
# build-agent-prompt.sh — Build a lean prompt for claude --remote
# Usage: ./scripts/build-agent-prompt.sh <ticket_json_file>
# Outputs the prompt to stdout

set -euo pipefail

TICKET_FILE="${1:-}"
if [[ -z "$TICKET_FILE" || ! -f "$TICKET_FILE" ]]; then
  echo "Usage: $0 <ticket_json_file>" >&2
  exit 1
fi

# Extract ticket fields
ISSUE_ID=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['identifier'])")
TITLE=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['title'])")
DESCRIPTION=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}')).get('description','No description provided.'))")
PRIORITY=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}')).get('priority','None'))")
LABELS=$(python3 -c "
import sys,json
data = json.load(open('${TICKET_FILE}'))
labels = data.get('labels',{}).get('nodes',[])
print(', '.join(l['name'] for l in labels) if labels else 'None')
")
COMMENTS=$(python3 -c "
import sys,json
data = json.load(open('${TICKET_FILE}'))
comments = data.get('comments',{}).get('nodes',[])
for c in comments:
    user = c.get('user',{}).get('name','Unknown')
    print(f'- {user}: {c[\"body\"]}')
if not comments:
    print('None')
")

# Build slug from title
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | head -c 40)

# Check for image URLs
IMAGE_URLS=""
if [[ -f /tmp/image-urls.txt ]] && [[ -s /tmp/image-urls.txt ]]; then
  IMAGE_URLS=$(cat /tmp/image-urls.txt)
fi

# Read existing tickets if available
EXISTING_TICKETS=""
if [[ -f /tmp/existing-tickets.txt ]] && [[ -s /tmp/existing-tickets.txt ]]; then
  EXISTING_TICKETS=$(cat /tmp/existing-tickets.txt)
fi

cat <<PROMPT
You have been assigned a Linear ticket to implement.

## Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}
- Description: ${DESCRIPTION}
- Labels: ${LABELS}
- Priority: ${PRIORITY}
- Comments:
${COMMENTS}

## Attached Images
${IMAGE_URLS:+Download these with curl and use the Read tool to view them:}
${IMAGE_URLS:-No images attached.}

## Branch
linear/${ISSUE_ID}-${SLUG}

## Existing Tickets
These tickets already exist — do NOT create duplicates:
${EXISTING_TICKETS:-No existing tickets found.}

Read AGENTS.md for full workflow instructions.
PROMPT
