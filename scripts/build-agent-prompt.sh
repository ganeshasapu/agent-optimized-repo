#!/usr/bin/env bash
# build-agent-prompt.sh — Build a Claude agent prompt from a Linear ticket
# Usage: ./scripts/build-agent-prompt.sh <ticket_json_file>
# Outputs the prompt to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

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

# Read repo context
CLAUDE_MD=$(cat "${REPO_ROOT}/CLAUDE.md")
AGENTS_MD=$(cat "${REPO_ROOT}/AGENTS.md")

cat <<PROMPT
You are working on the Biarritz codebase.
You have been assigned a Linear ticket to implement.

## Ticket
- ID: ${ISSUE_ID}
- Title: ${TITLE}
- Description: ${DESCRIPTION}
- Labels: ${LABELS}
- Priority: ${PRIORITY}
- Comments:
${COMMENTS}

## Instructions

### Implementation
1. Create a branch named linear/${ISSUE_ID}-${SLUG}
2. Implement the work described in the ticket
3. If the ticket is vague, use your best judgment — prefer small, focused changes
4. Run \`pnpm agent:verify\` before finishing — all checks must pass

### How to learn the codebase
- Read CLAUDE.md and AGENTS.md at the repo root for overall conventions
- Each package has its own CLAUDE.md with package-specific rules — read the ones relevant to your work
- Use \`packages/domain-users/\` as the reference example for how domains are structured, how tests are written, and how routes are wired up
- When creating a new domain, follow the exact patterns in domain-users (package.json, tsconfig.json, vitest.config.ts, eslint.config.js, directory structure)

### Testing requirements
- Unit tests are required for all new services — mock the DB with \`vi.mock("@biarritz/db", ...)\`
- Integration tests use \`describe.skipIf(!process.env.DATABASE_URL)\` guard
- Test files go in \`__tests__/unit/\` and \`__tests__/integration/\` matching the source file name
- Look at \`packages/domain-users/__tests__/\` for examples of how to structure tests and fixtures
- Run tests with \`pnpm --filter=@biarritz/<package-name> test\` during development

### Quality
- Use \`@biarritz/ui\` components (Button, Input, Card, etc.) — never build raw HTML for common UI patterns
- Use \`cn()\` from \`@biarritz/ui\` for className merging
- Validate all user input with Zod schemas in \`src/lib/validations.ts\`
- Use \`type\` imports for types: \`import type { Foo } from "./bar"\`
- Use extensionless relative imports: \`"./utils"\` not \`"./utils.js"\`

### PR Description
When you are done, write a file called \`/tmp/pr-description.md\` with this format:

## Summary
<2-4 sentences describing what was done and why>

## Changes
<bullet list of key changes — files created, modified, patterns followed>

## Testing
<describe what tests were added and how to verify the changes>
- Unit tests: \`pnpm --filter=@biarritz/<package> test\`
- Manual testing: <steps to manually verify, e.g. "visit /endpoint and check...">

## Follow-ups
<any issues discovered, improvements suggested, or things intentionally left out. If none, say "None">

### Follow-up tickets
If you discover bugs, missing tests, or improvement opportunities unrelated to this ticket, note them as follow-ups in your output JSON.

## Repo Context

### CLAUDE.md
${CLAUDE_MD}

### AGENTS.md
${AGENTS_MD}

## Output
When you are completely done, print EXACTLY this JSON block (and nothing else after it):
\`\`\`json
{
  "status": "success or failed",
  "summary": "what you did in 2-3 sentences",
  "branch": "the branch name you created",
  "follow_ups": [
    { "title": "short title", "description": "actionable description", "labels": ["bug or improvement or tech-debt"] }
  ]
}
\`\`\`
PROMPT
