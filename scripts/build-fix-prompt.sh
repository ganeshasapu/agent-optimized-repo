#!/usr/bin/env bash
# build-fix-prompt.sh — Build a lean prompt for the @agent fix workflow
# Usage: ./scripts/build-fix-prompt.sh <ticket_json_file> <instructions>
# Outputs the prompt to stdout

set -euo pipefail

TICKET_FILE="${1:-}"
INSTRUCTIONS="${2:-}"

if [[ -z "$TICKET_FILE" || ! -f "$TICKET_FILE" ]]; then
  echo "Usage: $0 <ticket_json_file> <instructions>" >&2
  exit 1
fi

# Extract ticket fields
ISSUE_ID=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['identifier'])")
TITLE=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['title'])")

# Build slug from title
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | head -c 40)

cat <<PROMPT
A team member has asked you to make changes on an existing ticket.

## Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}

## Instructions from Team Member
${INSTRUCTIONS}

## Branch
linear/${ISSUE_ID}-${SLUG}

Read AGENTS.md for full workflow instructions.
PROMPT
