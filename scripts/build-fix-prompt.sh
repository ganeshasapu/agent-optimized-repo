#!/usr/bin/env bash
# build-fix-prompt.sh — Build a prompt for the @agent fix workflow
# Usage: ./scripts/build-fix-prompt.sh <ticket_json_file> <instructions>
# Outputs the prompt to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TICKET_FILE="${1:-}"
INSTRUCTIONS="${2:-}"

if [[ -z "$TICKET_FILE" || ! -f "$TICKET_FILE" ]]; then
  echo "Usage: $0 <ticket_json_file> <instructions>" >&2
  exit 1
fi

# Extract ticket fields
ISSUE_ID=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['identifier'])")
TITLE=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['title'])")
DESCRIPTION=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}')).get('description','No description provided.'))")

# Get current branch state
BRANCH_NAME=""
PR_DIFF=""
CI_STATUS=""
REVIEW_COMMENTS=""

# Try to find the branch for this ticket
BRANCH_NAME=$(git branch -r --list "origin/linear/${ISSUE_ID}-*" 2>/dev/null | head -1 | xargs || echo "")
if [[ -n "$BRANCH_NAME" ]]; then
  # Strip origin/ prefix
  LOCAL_BRANCH="${BRANCH_NAME#origin/}"
  git checkout "$LOCAL_BRANCH" 2>/dev/null || git checkout -b "$LOCAL_BRANCH" "$BRANCH_NAME" 2>/dev/null || true
  PR_DIFF=$(git diff main..HEAD 2>/dev/null | head -c 20000 || echo "No diff available")
fi

# Try to get CI status and review comments from GH if PR exists
if [[ -n "$LOCAL_BRANCH" ]] && command -v gh &>/dev/null; then
  PR_NUMBER=$(gh pr list --head "$LOCAL_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
  if [[ -n "$PR_NUMBER" ]]; then
    CI_STATUS=$(gh pr checks "$PR_NUMBER" 2>/dev/null || echo "No CI status available")
    REVIEW_COMMENTS=$(gh api "repos/${GITHUB_REPOSITORY:-}/pulls/${PR_NUMBER}/reviews" --jq '.[].body' 2>/dev/null || echo "")
  fi
fi

# Read repo docs
CLAUDE_MD=$(cat "${REPO_ROOT}/CLAUDE.md")
AGENTS_MD=$(cat "${REPO_ROOT}/AGENTS.md")

cat <<PROMPT
You are fixing an issue on an existing branch in the Biarritz codebase.
A team member has asked you to make changes via a Linear comment.

## Original Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}
- Description: ${DESCRIPTION}

## Instructions from Team Member
${INSTRUCTIONS}

## Current Branch State
Branch: ${LOCAL_BRANCH:-not found}

### Current Diff (against main)
\`\`\`diff
${PR_DIFF:-No existing changes — this may be a fresh implementation request.}
\`\`\`

### CI Status
${CI_STATUS:-No CI status available}

### Review Comments
${REVIEW_COMMENTS:-No review comments}

## What To Do
1. You are already on the branch with existing changes applied.
2. Follow the instructions from the team member above.
3. If the branch doesn't exist yet, create one named \`linear/${ISSUE_ID}-<slug>\` and implement from scratch.
4. Run \`pnpm agent:verify\` before finishing — all checks must pass.
5. Commit your changes with a descriptive message.

### Quality Rules
- Use \`@biarritz/ui\` components — never raw HTML for common patterns
- Use \`cn()\` for className merging
- Use \`type\` imports for types
- Use extensionless relative imports
- Follow DESIGN.md for any visual changes
- Read DESIGN.md before writing any UI code

## Repo Context

### CLAUDE.md
${CLAUDE_MD}

### AGENTS.md
${AGENTS_MD}

## Output
When done, print EXACTLY this JSON block:
\`\`\`json
{
  "status": "success or failed",
  "summary": "what you did in 2-3 sentences",
  "branch": "the branch name"
}
\`\`\`
PROMPT
