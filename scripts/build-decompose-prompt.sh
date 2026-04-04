#!/usr/bin/env bash
# build-decompose-prompt.sh — Build a prompt for the ticket decomposition agent
# Usage: ./scripts/build-decompose-prompt.sh <ticket_json_file> <codebase_context_json>
# Outputs the prompt to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TICKET_FILE="${1:-}"
CONTEXT_FILE="${2:-}"

if [[ -z "$TICKET_FILE" || ! -f "$TICKET_FILE" ]]; then
  echo "Usage: $0 <ticket_json_file> <codebase_context_json>" >&2
  exit 1
fi

# Extract ticket fields
ISSUE_ID=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['identifier'])")
TITLE=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}'))['title'])")
DESCRIPTION=$(python3 -c "import sys,json; print(json.load(open('${TICKET_FILE}')).get('description','No description provided.'))")
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

# Read codebase context
CODEBASE_CONTEXT=""
if [[ -n "$CONTEXT_FILE" && -f "$CONTEXT_FILE" ]]; then
  CODEBASE_CONTEXT=$(cat "$CONTEXT_FILE")
fi

# Read repo docs
CLAUDE_MD=$(cat "${REPO_ROOT}/CLAUDE.md")
AGENTS_MD=$(cat "${REPO_ROOT}/AGENTS.md")

cat <<PROMPT
You are a ticket decomposition agent for the Biarritz codebase.
Your job is to analyze a Linear ticket and determine if it should be
broken into smaller, independently implementable sub-tickets.

## Ticket to Analyze
- ID: ${ISSUE_ID}
- Title: ${TITLE}
- Description:
${DESCRIPTION}
- Labels: ${LABELS}
- Comments:
${COMMENTS}

## Codebase Structure
${CODEBASE_CONTEXT}

## Decomposition Rules

### When to decompose
A ticket SHOULD be decomposed if ANY of these are true:
1. It touches multiple domain packages (e.g., "Add projects and link them to users"
   touches domain-projects AND domain-users)
2. It has 3+ distinct acceptance criteria or requirements
3. It requires both schema changes AND UI implementation in different domains
4. It requires creating a new domain package AND implementing features in it
5. The description is longer than ~500 words with multiple distinct sections
6. It explicitly mentions multiple pages/routes/endpoints

### When NOT to decompose
A ticket should NOT be decomposed if:
1. It is a single-domain change (e.g., "Add delete button to user detail page")
2. It is a bug fix with clear scope
3. It is a simple CRUD operation within one domain
4. The total estimated work is under 200 lines of code
5. Decomposing would create sub-tickets that cannot work independently

### Sub-ticket scoping rules
Each sub-ticket MUST:
1. Be completable independently (or with clearly stated dependencies)
2. Be scoped to a SINGLE domain package OR a single cross-cutting concern
3. Have a clear, testable definition of done
4. Be small enough for an agent to complete in under 25 minutes

### Ordering
- Schema/DB changes come first (order: 1)
- Service/business logic next (order: 2)
- UI/route changes last (order: 3)
- If sub-ticket B depends on sub-ticket A, B.order > A.order

### Domain assignment
- Assign each sub-ticket to exactly one domain (\`packages/domain-*\`)
- If a sub-ticket creates a new domain, note domain: "domain-<name> (new)"
- If a sub-ticket modifies shared packages (only when truly necessary),
  note domain: "shared" and flag it clearly

## Output

First, analyze the ticket. Then output EXACTLY one of these JSON blocks:

### If the ticket should NOT be decomposed:
\`\`\`json
{
  "decision": "skip",
  "reason": "Brief explanation of why decomposition is not needed"
}
\`\`\`

### If the ticket SHOULD be decomposed:
\`\`\`json
{
  "decision": "decompose",
  "reasoning": "Brief explanation of why decomposition is needed",
  "sub_tickets": [
    {
      "title": "Short descriptive title starting with a verb",
      "description": "Detailed description with acceptance criteria as a markdown checklist",
      "domain": "domain-projects",
      "order": 1,
      "depends_on": []
    },
    {
      "title": "Another sub-ticket starting with a verb",
      "description": "Description with acceptance criteria as a markdown checklist",
      "domain": "domain-projects",
      "order": 2,
      "depends_on": ["Short descriptive title starting with a verb"]
    }
  ]
}
\`\`\`

## Constraints
- Maximum 8 sub-tickets (if you need more, the original ticket is too large
  and should be redesigned)
- Each sub-ticket title must start with a verb (Add, Create, Implement, Fix, etc.)
- Each sub-ticket description must include acceptance criteria as a markdown checklist
- Do NOT include infrastructure/setup tasks (these are handled automatically)
- Do NOT create sub-tickets for "write tests" — tests are part of each sub-ticket

## Repo Context

### CLAUDE.md
${CLAUDE_MD}

### AGENTS.md
${AGENTS_MD}
PROMPT
