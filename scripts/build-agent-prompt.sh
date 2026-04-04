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
# Read existing tickets if available
EXISTING_TICKETS=""
if [[ -f /tmp/existing-tickets.txt ]] && [[ -s /tmp/existing-tickets.txt ]]; then
  EXISTING_TICKETS=$(cat /tmp/existing-tickets.txt)
fi

# Check for image URLs
IMAGE_URLS=""
if [[ -f /tmp/image-urls.txt ]] && [[ -s /tmp/image-urls.txt ]]; then
  IMAGE_URLS=$(cat /tmp/image-urls.txt)
fi

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

## Attached Images
${IMAGE_URLS:+The ticket includes images. Download them with curl and then use the Read tool to view them:}
${IMAGE_URLS:-No images attached to this ticket.}

## Instructions

### Implementation
1. Create a branch named linear/${ISSUE_ID}-${SLUG}
2. Read DESIGN.md before writing any UI code — it is the visual source of truth
3. Implement the work described in the ticket
4. If the ticket is vague, use your best judgment — prefer small, focused changes
5. Run \`pnpm agent:verify\` before finishing — all checks must pass

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

### Visual quality — MANDATORY for any UI change
Read DESIGN.md thoroughly before writing any component. Follow it exactly. Key rules:
- All colors MUST come from design tokens (e.g. \`bg-primary\`, \`text-muted-foreground\`). Never use arbitrary hex/oklch values.
- All icons MUST use \`lucide-react\`. Never hand-write SVG.
- Font sizes: use the Linear-inspired scale from DESIGN.md (13px body, 14px titles). Never use text-xl or larger in app UI.
- Border radius: \`rounded-md\` max. Never use \`rounded-xl\` or larger.
- Follow the layout patterns in DESIGN.md exactly (page header, list pages, detail pages, forms).

### Self-review checklist (complete before finishing)
Before writing your output JSON, verify every item:
1. All Tailwind class names resolve — no invented classes (e.g. \`bg-violet-muted\` does not exist)
2. Every icon uses \`lucide-react\`, no inline \`<svg>\` elements
3. Colors come from design tokens only — no arbitrary \`bg-[#xxx]\` or custom CSS variables
4. Used \`@biarritz/ui\` components for all standard UI elements
5. Font sizes follow DESIGN.md scale — no \`text-xl\` or larger in app UI
6. Changes are scoped to what the ticket asked — no unrequested layout overhauls

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
If you discover bugs, missing tests, or improvement opportunities unrelated to this ticket, check the existing tickets list below first.

**If a similar ticket already exists:** Add a comment to that ticket using this command:
\`\`\`bash
bash scripts/linear-comment.sh AGE-XX "Discovered while working on ${ISSUE_ID}: <your finding here>"
\`\`\`
Do NOT include it in your follow_ups JSON array.

**If no similar ticket exists:** Include it in your follow_ups JSON array so a new ticket will be created.

## Existing Tickets
These tickets already exist in Linear — do NOT create duplicates:
${EXISTING_TICKETS:-No existing tickets found.}

## Repo Context

### DESIGN.md
DESIGN.md is at the repository root. Read it with the Read tool before any UI work.
It documents: the design system defined in \`packages/config-tailwind/preset.ts\`, utility classes
(page-header, nav-item, list-row, section-heading), typography scale, layout patterns, and
anti-patterns to avoid. Do NOT guess styles — the source of truth is in the code.

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
