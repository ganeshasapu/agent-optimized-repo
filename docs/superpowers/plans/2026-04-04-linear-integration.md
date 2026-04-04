# Linear Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Linear to the repo so tickets trigger autonomous Claude Code agents via GitHub Actions, and agents can update tickets and create follow-ups.

**Architecture:** Vercel webhook endpoint receives Linear events, validates and forwards them as GitHub `repository_dispatch` events. A GitHub Actions workflow fetches the full ticket, builds a prompt, runs `claude -p`, creates a PR, updates the Linear ticket, and creates follow-up tickets.

**Tech Stack:** Next.js API routes (webhook), bash + curl (Linear GraphQL API helpers), GitHub Actions (orchestration), Claude Code CLI (agent execution).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/lib/linear.sh` | Create | Linear GraphQL API helpers (get issue, update status, add comment, create issue) |
| `scripts/build-agent-prompt.sh` | Create | Template ticket data + repo context into a Claude prompt |
| `apps/web/app/api/webhooks/linear/route.ts` | Create | Stateless webhook proxy: validate → filter → dispatch to GitHub |
| `.github/workflows/linear-agent.yml` | Create | Full agent orchestration: fetch ticket → run claude → PR → update Linear |
| `.env.example` | Modify | Add Linear and GitHub env vars |
| `CLAUDE.md` | Modify | Document Linear integration |
| `AGENTS.md` | Modify | Add Linear-driven workflow section |

---

### Task 1: Linear API Helpers

**Files:**
- Create: `scripts/lib/linear.sh`

- [ ] **Step 1: Create `scripts/lib/linear.sh`**

```bash
#!/usr/bin/env bash
# Linear GraphQL API helpers
# Requires: LINEAR_API_KEY

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

LINEAR_API_URL="https://api.linear.app/graphql"

linear_gql() {
  local query="$1"
  require_env LINEAR_API_KEY

  local response
  response=$(curl -s -S -X POST "$LINEAR_API_URL" \
    -H "Authorization: ${LINEAR_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$query" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

  local errors
  errors=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errors',''))" 2>/dev/null)
  if [[ -n "$errors" && "$errors" != "None" && "$errors" != "" ]]; then
    log_error "Linear API error: $errors"
    return 1
  fi

  echo "$response"
}

linear_get_issue() {
  local issue_id="$1"
  log_info "Fetching Linear issue: $issue_id"

  local query="
    query {
      issue(id: \"${issue_id}\") {
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
  "

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

  local query="
    mutation {
      issueUpdate(id: \"${issue_id}\", input: { stateId: \"${state_id}\" }) {
        success
      }
    }
  "

  linear_gql "$query" > /dev/null
  log_success "Issue status updated"
}

linear_add_comment() {
  local issue_id="$1"
  local body="$2"
  log_info "Adding comment to issue $issue_id"

  local escaped_body
  escaped_body=$(echo "$body" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')

  local query="
    mutation {
      commentCreate(input: { issueId: \"${issue_id}\", body: \"${escaped_body}\" }) {
        success
      }
    }
  "

  linear_gql "$query" > /dev/null
  log_success "Comment added"
}

linear_create_issue() {
  local team_id="$1"
  local title="$2"
  local description="$3"
  local label_ids="$4"  # comma-separated label IDs, or empty

  log_info "Creating Linear issue: $title"

  local escaped_title
  escaped_title=$(echo "$title" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')
  local escaped_desc
  escaped_desc=$(echo "$description" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')

  local label_input=""
  if [[ -n "$label_ids" ]]; then
    label_input=", labelIds: [$(echo "$label_ids" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/' )]"
  fi

  local query="
    mutation {
      issueCreate(input: { teamId: \"${team_id}\", title: \"${escaped_title}\", description: \"${escaped_desc}\", priority: 4${label_input} }) {
        success
        issue { id identifier url }
      }
    }
  "

  local response
  response=$(linear_gql "$query") || return 1
  echo "$response" | python3 -c "
import sys, json
issue = json.load(sys.stdin)['data']['issueCreate']['issue']
print(json.dumps(issue))
"
}

linear_get_states() {
  local team_id="$1"
  log_info "Fetching workflow states for team $team_id"

  local query="
    query {
      team(id: \"${team_id}\") {
        states { nodes { id name type } }
      }
    }
  "

  local response
  response=$(linear_gql "$query") || return 1
  echo "$response" | python3 -c "
import sys, json
states = json.load(sys.stdin)['data']['team']['states']['nodes']
for s in states:
    print(f\"{s['id']}  {s['name']}  ({s['type']})\")
"
}
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/lib/linear.sh`

- [ ] **Step 3: Verify the script sources correctly**

Run: `bash -n scripts/lib/linear.sh`
Expected: No output (no syntax errors)

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/linear.sh
git commit -m "feat: add Linear GraphQL API helpers

Bash + curl wrappers for Linear API: get issue, update status,
add comment, create issue, list workflow states. Follows the
same pattern as scripts/lib/neon.sh."
```

---

### Task 2: Agent Prompt Builder

**Files:**
- Create: `scripts/build-agent-prompt.sh`

- [ ] **Step 1: Create `scripts/build-agent-prompt.sh`**

```bash
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
1. Read CLAUDE.md and AGENTS.md to understand the repo conventions
2. Create a branch named linear/${ISSUE_ID}-${SLUG}
3. Implement the work described in the ticket
4. If the ticket is vague, use your best judgment — prefer small, focused changes
5. Run \`pnpm agent:verify\` before finishing — all checks must pass
6. If you discover bugs, missing tests, or improvement opportunities unrelated to this ticket, note them as follow-ups

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
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/build-agent-prompt.sh`

- [ ] **Step 3: Verify syntax**

Run: `bash -n scripts/build-agent-prompt.sh`
Expected: No output (no syntax errors)

- [ ] **Step 4: Commit**

```bash
git add scripts/build-agent-prompt.sh
git commit -m "feat: add agent prompt builder for Linear tickets

Templates Linear ticket data (title, description, labels, comments)
plus CLAUDE.md and AGENTS.md into a structured prompt for claude -p."
```

---

### Task 3: Webhook Endpoint

**Files:**
- Create: `apps/web/app/api/webhooks/linear/route.ts`

- [ ] **Step 1: Create the webhook route**

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const LINEAR_TRIGGER_STATUS = process.env.LINEAR_TRIGGER_STATUS ?? "Todo";

function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac("sha256", LINEAR_WEBHOOK_SECRET);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return digest === signature;
}

interface LinearWebhookPayload {
  action: string;
  type: string;
  data: {
    id: string;
    title: string;
    description?: string;
    priority: number;
    state?: { name: string };
    labels?: Array<{ name: string }>;
  };
  updatedFrom?: {
    stateId?: string;
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("linear-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: LinearWebhookPayload = JSON.parse(body);

  // Only handle Issue events
  if (payload.type !== "Issue") {
    return NextResponse.json({ ignored: true, reason: "not an Issue event" });
  }

  // Only trigger when status changes to the trigger status
  const currentStatus = payload.data.state?.name;
  if (currentStatus !== LINEAR_TRIGGER_STATUS) {
    return NextResponse.json({ ignored: true, reason: `status is "${currentStatus}", not "${LINEAR_TRIGGER_STATUS}"` });
  }

  // Only trigger on updates that changed the state (not creates with the status already set, unless it's a create)
  if (payload.action !== "create" && !payload.updatedFrom?.stateId) {
    return NextResponse.json({ ignored: true, reason: "status was not changed in this update" });
  }

  // Fire repository_dispatch to GitHub
  const [owner, repo] = GITHUB_REPO.split("/");
  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "linear-ticket",
        client_payload: {
          issue_id: payload.data.id,
          title: payload.data.title,
          description: payload.data.description ?? "",
          priority: payload.data.priority,
          labels: (payload.data.labels ?? []).map((l) => l.name),
        },
      }),
    },
  );

  if (!dispatchResponse.ok) {
    const errorText = await dispatchResponse.text();
    console.error("GitHub dispatch failed:", errorText);
    return NextResponse.json(
      { error: "Failed to dispatch to GitHub" },
      { status: 502 },
    );
  }

  return NextResponse.json({ dispatched: true, issue_id: payload.data.id });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck 2>&1 | tail -10`
Expected: All tasks successful

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint 2>&1 | tail -10`
Expected: All tasks successful

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/webhooks/linear/route.ts
git commit -m "feat: add Linear webhook endpoint

Stateless proxy that validates Linear webhook signatures, filters
for issues moved to trigger status, and fires repository_dispatch
to GitHub Actions."
```

---

### Task 4: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/linear-agent.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: Linear Agent

on:
  repository_dispatch:
    types: [linear-ticket]

env:
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
  LINEAR_TEAM_ID: ${{ vars.LINEAR_TEAM_ID }}
  LINEAR_STATUS_IN_REVIEW: ${{ vars.LINEAR_STATUS_IN_REVIEW }}

jobs:
  agent:
    name: Execute Linear Ticket
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Fetch full ticket from Linear
        id: ticket
        run: |
          source scripts/lib/linear.sh
          ISSUE_ID="${{ github.event.client_payload.issue_id }}"
          TICKET_JSON=$(linear_get_issue "$ISSUE_ID")
          echo "$TICKET_JSON" > /tmp/ticket.json
          IDENTIFIER=$(echo "$TICKET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['identifier'])")
          echo "identifier=$IDENTIFIER" >> "$GITHUB_OUTPUT"
          echo "issue_id=$ISSUE_ID" >> "$GITHUB_OUTPUT"

      - name: Build agent prompt
        id: prompt
        run: |
          PROMPT=$(bash scripts/build-agent-prompt.sh /tmp/ticket.json)
          # Save to file to avoid shell escaping issues
          echo "$PROMPT" > /tmp/agent-prompt.txt

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code@latest

      - name: Run Claude agent
        id: agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          PROMPT=$(cat /tmp/agent-prompt.txt)
          # Run the agent and capture output
          AGENT_OUTPUT=$(claude -p "$PROMPT" \
            --allowedTools "Read,Edit,Write,Bash,Glob,Grep" \
            --output-format text \
            2>&1) || true

          echo "$AGENT_OUTPUT" > /tmp/agent-output.txt

          # Extract the JSON result block from agent output
          python3 -c "
          import sys, json, re
          text = open('/tmp/agent-output.txt').read()
          # Find JSON block in markdown code fence or raw JSON
          match = re.search(r'\`\`\`json\s*(\{.*?\})\s*\`\`\`', text, re.DOTALL)
          if not match:
              match = re.search(r'(\{[^{}]*\"status\"[^{}]*\})', text, re.DOTALL)
          if match:
              result = json.loads(match.group(1))
              json.dump(result, open('/tmp/agent-result.json', 'w'), indent=2)
              print('Agent result extracted')
          else:
              fallback = {'status': 'failed', 'summary': 'Could not parse agent output', 'branch': '', 'follow_ups': []}
              json.dump(fallback, open('/tmp/agent-result.json', 'w'), indent=2)
              print('WARNING: Could not extract agent result, using fallback')
          "

      - name: Push branch and create PR
        id: pr
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          BRANCH=$(python3 -c "import json; print(json.load(open('/tmp/agent-result.json')).get('branch',''))")
          STATUS=$(python3 -c "import json; print(json.load(open('/tmp/agent-result.json')).get('status','failed'))")
          SUMMARY=$(python3 -c "import json; print(json.load(open('/tmp/agent-result.json')).get('summary','No summary'))")
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"

          if [[ -z "$BRANCH" || "$STATUS" == "failed" ]]; then
            echo "Agent failed or no branch created. Skipping PR."
            echo "pr_url=" >> "$GITHUB_OUTPUT"
            echo "status=failed" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          git push origin "$BRANCH"

          PR_URL=$(gh pr create \
            --base main \
            --head "$BRANCH" \
            --title "${IDENTIFIER}: $(python3 -c "import json; print(json.load(open('/tmp/ticket.json'))['title'])")" \
            --body "$(cat <<EOF
          ## Linear Ticket
          [${IDENTIFIER}](https://linear.app/issue/${IDENTIFIER})

          ## Summary
          ${SUMMARY}

          ---
          *Automated by Linear Agent workflow*
          EOF
          )")

          echo "pr_url=$PR_URL" >> "$GITHUB_OUTPUT"
          echo "status=$STATUS" >> "$GITHUB_OUTPUT"

      - name: Update Linear ticket
        if: always()
        run: |
          source scripts/lib/linear.sh
          ISSUE_ID="${{ steps.ticket.outputs.issue_id }}"
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"
          PR_URL="${{ steps.pr.outputs.pr_url }}"
          STATUS="${{ steps.pr.outputs.status }}"

          if [[ -n "$PR_URL" && "$STATUS" == "success" ]]; then
            # Move to In Review
            if [[ -n "$LINEAR_STATUS_IN_REVIEW" ]]; then
              linear_update_issue_status "$ISSUE_ID" "$LINEAR_STATUS_IN_REVIEW"
            fi
            linear_add_comment "$ISSUE_ID" "PR created: ${PR_URL}"
          elif [[ "${{ job.status }}" == "cancelled" ]]; then
            linear_add_comment "$ISSUE_ID" "Agent timed out after 30 minutes. The ticket may need to be broken into smaller pieces."
          else
            SUMMARY=$(python3 -c "import json; print(json.load(open('/tmp/agent-result.json')).get('summary','Agent did not produce output'))" 2>/dev/null || echo "Agent failed")
            linear_add_comment "$ISSUE_ID" "Agent failed to complete this ticket.\n\nDetails: ${SUMMARY}"
          fi

      - name: Create follow-up tickets
        if: steps.pr.outputs.status == 'success'
        run: |
          source scripts/lib/linear.sh
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"

          python3 -c "
          import json, subprocess, os

          result = json.load(open('/tmp/agent-result.json'))
          follow_ups = result.get('follow_ups', [])[:5]  # Cap at 5
          team_id = os.environ.get('LINEAR_TEAM_ID', '')

          if not team_id:
              print('LINEAR_TEAM_ID not set, skipping follow-up creation')
              exit(0)

          for fu in follow_ups:
              title = fu.get('title', '')
              desc = fu.get('description', '')
              desc = f'Discovered while working on ${IDENTIFIER}.\n\n{desc}'
              print(f'Creating follow-up: {title}')
              subprocess.run([
                  'bash', '-c',
                  f'source scripts/lib/linear.sh && linear_create_issue \"{team_id}\" \"{title}\" \"{desc}\" \"\"'
              ], check=False)
          "
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/linear-agent.yml'))" && echo "Valid YAML"`
Expected: `Valid YAML`

Note: Install pyyaml first if needed: `pip3 install pyyaml`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/linear-agent.yml
git commit -m "feat: add Linear agent GitHub Actions workflow

Triggered by repository_dispatch from the webhook endpoint.
Fetches full ticket from Linear, builds prompt, runs claude -p,
creates PR, updates Linear status, and creates follow-up tickets."
```

---

### Task 5: Update Environment Config

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add Linear and GitHub env vars to `.env.example`**

Append after the existing content:

```
# Linear Integration
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINEAR_WEBHOOK_SECRET=
LINEAR_TEAM_ID=
LINEAR_TRIGGER_STATUS=Todo
LINEAR_STATUS_IN_REVIEW=
LINEAR_STATUS_DONE=

# GitHub (for webhook → dispatch)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=owner/repo
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add Linear and GitHub env vars to .env.example"
```

---

### Task 6: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add Linear section to `CLAUDE.md`**

Append after the `## Commands` section (after the `### Scoped Commands` subsection):

```markdown
### Linear Integration
- Linear tickets trigger agents via webhook → GitHub Actions → `claude -p`
- Webhook endpoint: `apps/web/app/api/webhooks/linear/route.ts`
- Agent workflow: `.github/workflows/linear-agent.yml`
- Linear API helpers: `scripts/lib/linear.sh`
- Prompt builder: `scripts/build-agent-prompt.sh`
- To list your team's workflow state IDs: `source scripts/lib/linear.sh && linear_get_states "$LINEAR_TEAM_ID"`
```

- [ ] **Step 2: Add Linear workflow section to `AGENTS.md`**

Append before the `## Rules for Agents` section:

```markdown
## Linear-Driven Workflow

When triggered by a Linear ticket (via GitHub Actions), agents follow this flow:

1. The prompt contains the ticket ID, title, description, labels, and comments
2. Create a branch named `linear/<ticket-id>-<slug>` (e.g., `linear/BIA-42-add-project-model`)
3. Implement the work described in the ticket
4. If the ticket is vague, use your best judgment — prefer small, focused changes
5. Run `pnpm agent:verify` — all checks must pass
6. If you discover unrelated bugs, missing tests, or improvements, include them as `follow_ups` in your output JSON
7. The workflow will automatically create a PR, update the Linear ticket, and file follow-up tickets

### Output Format

When running as a Linear-triggered agent, your final output MUST include this JSON block:

```json
{
  "status": "success",
  "summary": "Added project model with CRUD service and routes",
  "branch": "linear/BIA-42-add-project-model",
  "follow_ups": [
    { "title": "Add index on projects.team_id", "description": "Query performance will degrade without an index on the team_id foreign key", "labels": ["tech-debt"] }
  ]
}
```
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: add Linear integration to CLAUDE.md and AGENTS.md"
```

---

### Task 7: Verify Everything

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck 2>&1 | tail -10`
Expected: All 5 tasks successful

- [ ] **Step 2: Run full lint**

Run: `pnpm lint 2>&1 | tail -10`
Expected: All 5 tasks successful

- [ ] **Step 3: Run full build**

Run: `pnpm build 2>&1 | tail -10`
Expected: Build successful

- [ ] **Step 4: Verify shell scripts have no syntax errors**

Run: `bash -n scripts/lib/linear.sh && bash -n scripts/build-agent-prompt.sh && echo "All scripts valid"`
Expected: `All scripts valid`

- [ ] **Step 5: Verify YAML is valid**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/linear-agent.yml'))" && echo "Valid"`
Expected: `Valid`

---

## Setup Instructions (for the user, post-implementation)

After all tasks are complete, the user needs to:

1. **Get Linear API key**: Settings → API → Personal API keys → Create key
2. **Create Linear webhook**: Settings → API → Webhooks → New webhook
   - URL: `https://<your-vercel-domain>/api/webhooks/linear`
   - Events: Issues
   - Copy the signing secret → `LINEAR_WEBHOOK_SECRET`
3. **Get Linear team ID**: Run `source scripts/lib/linear.sh && linear_get_states "<team_id>"` or find it in Linear URL
4. **Get workflow state IDs**: Run the `linear_get_states` command above, copy the IDs for "In Review" and "Done" statuses
5. **Create GitHub PAT**: GitHub Settings → Developer settings → PATs → Create with `repo` scope
6. **Set GitHub repo secrets**: `LINEAR_API_KEY`, `ANTHROPIC_API_KEY`
7. **Set GitHub repo variables**: `LINEAR_TEAM_ID`, `LINEAR_STATUS_IN_REVIEW`, `LINEAR_STATUS_DONE`
8. **Set Vercel env vars**: `LINEAR_WEBHOOK_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO`, `LINEAR_TRIGGER_STATUS`
