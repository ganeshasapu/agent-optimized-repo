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

## First action (do this before anything else)

Post your session URL to the Linear ticket and to the open PR (if one exists) so the requester can open the live conversation. Run:

    bash scripts/linear-comment.sh "${ISSUE_ID}" "🤖 Live session (fix): https://claude.ai/code/\$CLAUDE_CODE_REMOTE_SESSION_ID

Open this link to watch the agent work or answer clarifying questions."

    # If a PR for this branch is open, comment there too:
    PR_NUMBER=\$(gh pr list --head "linear/${ISSUE_ID}-${SLUG}" --json number --jq '.[0].number' 2>/dev/null || true)
    if [[ -n "\$PR_NUMBER" ]]; then
      gh pr comment "\$PR_NUMBER" --body "🤖 Live session (fix): https://claude.ai/code/\$CLAUDE_CODE_REMOTE_SESSION_ID"
    fi

## Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}

## Instructions from Team Member
${INSTRUCTIONS}

## Branch
linear/${ISSUE_ID}-${SLUG}

Read AGENTS.md for full workflow instructions.
PROMPT
