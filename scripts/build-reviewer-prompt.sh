#!/usr/bin/env bash
# build-reviewer-prompt.sh — Build a prompt for the automated reviewer agent
# Usage: ./scripts/build-reviewer-prompt.sh <ticket_json_file> <pr_url> <branch>
# Outputs the prompt to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TICKET_FILE="${1:-}"
PR_URL="${2:-}"
BRANCH="${3:-}"

if [[ -z "$TICKET_FILE" || ! -f "$TICKET_FILE" || -z "$PR_URL" || -z "$BRANCH" ]]; then
  echo "Usage: $0 <ticket_json_file> <pr_url> <branch>" >&2
  exit 1
fi

# Extract ticket fields
ISSUE_ID=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['identifier'])")
TITLE=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['title'])")
DESCRIPTION=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}')).get('description','No description provided.'))")

# Get diff and changed files
DIFF=$(git diff "main...${BRANCH}" 2>/dev/null | head -c 30000)
CHANGED_FILES=$(git diff --name-only "main...${BRANCH}" 2>/dev/null || echo "")

# Identify domains touched
DOMAINS_TOUCHED=$(echo "$CHANGED_FILES" | grep -oP 'packages/domain-[^/]+' | sort -u || echo "none")

# Check if any UI files changed (tsx files)
HAS_UI_CHANGES=$(echo "$CHANGED_FILES" | grep -c '\.tsx$' || echo "0")

# Read repo docs
DESIGN_MD=$(cat "${REPO_ROOT}/DESIGN.md")
CLAUDE_MD=$(cat "${REPO_ROOT}/CLAUDE.md")
AGENTS_MD=$(cat "${REPO_ROOT}/AGENTS.md")

cat <<PROMPT
You are a code reviewer for the Biarritz codebase.
An automated agent has implemented a Linear ticket and created a PR.
Your job is to review the changes and provide structured feedback.

## Original Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}
- Description: ${DESCRIPTION}

## PR
- URL: ${PR_URL}
- Branch: ${BRANCH}
- Files changed:
${CHANGED_FILES}

- Domain(s) touched: ${DOMAINS_TOUCHED}
- Has UI changes: ${HAS_UI_CHANGES} tsx file(s) changed

## Diff
\`\`\`diff
${DIFF}
\`\`\`

## Review Criteria

Review the changes against each of these criteria. For each section,
give a verdict (PASS, WARN, or FAIL) and specific feedback.

### 1. Scope Compliance
- Are ALL changes within the expected domain package(s)?
- Were any shared packages (packages/db, packages/ui, packages/shared) modified without explicit ticket instruction?
- Are there changes to files outside the domain and its route re-exports in apps/web/app/(domains)/?
- Allowed: domain package files, route re-exports, test files for the domain

### 2. Design System Compliance
(Only if .tsx files changed — output SKIPPED if no UI changes)
- Do all colors use semantic design tokens (bg-primary, text-muted-foreground, etc.)?
- Are there any arbitrary Tailwind values (bg-[#xxx], text-[14px])?
- Are all icons from lucide-react (no inline SVG)?
- Do font sizes follow the DESIGN.md scale (13px body, 14px titles)?
- Are \`@biarritz/ui\` components used for standard UI patterns (Button, Input, Card, etc.)?
- Is \`cn()\` used for className merging?
- Is border radius \`rounded-md\` max (no rounded-xl)?

### 3. Code Quality
- Are imports ordered correctly (external, internal packages, relative)?
- Are \`type\` imports used for type-only imports?
- Are files named in kebab-case?
- Is Zod used for input validation where applicable?
- Are there any TODO/FIXME/HACK comments indicating incomplete work?
- Are extensionless relative imports used?

### 4. Test Coverage
- Are there unit tests for new services?
- Do unit tests mock the DB with \`vi.mock("@biarritz/db", ...)\`?
- Are there integration tests with the \`describe.skipIf(!process.env.DATABASE_URL)\` guard?
- Do test file names match source files?
- Are test fixtures in \`__tests__/fixtures/\`?

### 5. Ticket Completeness
- Does the implementation address all requirements in the ticket description?
- Are there obvious gaps between what was requested and what was delivered?
- Is there anything in the ticket that was clearly missed?

## Output Format

You must output EXACTLY this format. Do not deviate.

REVIEW_VERDICT: APPROVE or REQUEST_CHANGES or COMMENT

REVIEW_BODY:
## Agent Review

### Scope Compliance: PASS or WARN or FAIL
<specific details>

### Design System: PASS or WARN or FAIL or SKIPPED
<specific details>

### Code Quality: PASS or WARN or FAIL
<specific details>

### Test Coverage: PASS or WARN or FAIL
<specific details>

### Ticket Completeness: PASS or WARN or FAIL
<specific details>

### Summary
<1-2 sentence overall assessment>

LINE_COMMENTS:
<file_path>:<line_number>:<comment text>
<file_path>:<line_number>:<comment text>

## Rules
- If any criterion is FAIL, verdict MUST be REQUEST_CHANGES
- If all criteria are PASS or SKIPPED, verdict is APPROVE
- If any are WARN but none FAIL, verdict is COMMENT
- Be specific — cite file names and line numbers
- This review is ADVISORY — it does not block merging
- Do NOT suggest complete rewrites or scope changes — focus on the criteria above
- Keep the review concise — max 3 bullet points per section
- If LINE_COMMENTS is empty, output "LINE_COMMENTS:" with nothing after it

## Repo Context

### DESIGN.md
${DESIGN_MD}

### CLAUDE.md
${CLAUDE_MD}

### AGENTS.md
${AGENTS_MD}
PROMPT
