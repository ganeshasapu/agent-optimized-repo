#!/usr/bin/env bash
# build-revision-prompt.sh — Build a lean prompt for the agent-revision workflow
# Usage: ./scripts/build-revision-prompt.sh <identifier> <branch> <pr_number> <review_body_file> <review_comments_file>
# Outputs the prompt to stdout

set -euo pipefail

IDENTIFIER="${1:-}"
BRANCH="${2:-}"
PR_NUMBER="${3:-}"
REVIEW_BODY_FILE="${4:-}"
REVIEW_COMMENTS_FILE="${5:-}"

if [[ -z "$IDENTIFIER" || -z "$BRANCH" || -z "$PR_NUMBER" || -z "$REVIEW_BODY_FILE" || -z "$REVIEW_COMMENTS_FILE" ]]; then
  echo "Usage: $0 <identifier> <branch> <pr_number> <review_body_file> <review_comments_file>" >&2
  exit 1
fi

REVIEW_BODY=$(cat "$REVIEW_BODY_FILE" 2>/dev/null || echo "")
REVIEW_COMMENTS=$(cat "$REVIEW_COMMENTS_FILE" 2>/dev/null || echo "")

cat <<PROMPT
You are addressing review feedback on a pull request.

## First action (do this before anything else)

Post your session URL to the PR so the reviewer can open the live conversation:

    gh pr comment ${PR_NUMBER} --body "🤖 Live session (revision): https://claude.ai/code/\$CLAUDE_CODE_REMOTE_SESSION_ID

Open this link to watch the agent address the feedback or clarify anything."

## Ticket
- ID: ${IDENTIFIER}

## Pull Request
- Number: ${PR_NUMBER}

## Branch
${BRANCH}

## Review Feedback

### Reviewer's Summary
${REVIEW_BODY}

### Inline Comments
${REVIEW_COMMENTS}

Read AGENTS.md (section: "Addressing Review Feedback") for full instructions.
PROMPT
