# Remote Agent Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the agent system from headless `claude -p` to cloud-based `claude --remote`, making agents autonomous and GitHub Actions a thin dispatcher.

**Architecture:** Dispatch workflows (linear-agent, agent-revision, agent-fix) become thin: fetch context, fire `claude --remote`, exit. AGENTS.md becomes the primary instruction source read automatically by the cloud session. New event-driven workflows handle Linear updates (on PR open) and Neon cleanup (on PR close). The decompose workflow is removed entirely.

**Tech Stack:** GitHub Actions, `claude --remote`, Linear GraphQL API, Neon API, `gh` CLI, bash

---

### Task 1: Restructure AGENTS.md

**Files:**
- Modify: `AGENTS.md`

This is the foundational change — AGENTS.md becomes the primary instruction source for all cloud agent sessions. `claude --remote` reads it automatically from the repo.

- [ ] **Step 1: Rewrite AGENTS.md with new self-sufficient agent instructions**

Replace the entire contents of `AGENTS.md` with:

```markdown
# Agent Workflow Guide

This document is the primary instruction source for autonomous coding agents working in this repository.
Agents running via `claude --remote` read this file automatically.

## Before You Start

### Evaluate the ticket

Before implementing, decide:

1. **Is the ticket clear enough?** If the ticket is genuinely ambiguous — contradictory requirements, missing critical design decisions, or references unavailable resources — request clarification (see "Requesting Clarification" below). If it's just light on detail, use your best judgment and proceed.

2. **Would this produce a PR that's logical and easy to review?** If not, decompose the ticket into sub-tickets that each make sense as their own PR (see "Decomposing Tickets" below).

If neither applies, proceed with implementation.

## Standard Workflow

### 1. Set up your environment

```bash
export DATABASE_URL="<from your prompt>"
pnpm install --frozen-lockfile
```

If your ticket requires database changes, the `DATABASE_URL` in your prompt points to an isolated Neon branch — safe to test against.

### 2. Create your branch

```bash
git checkout -b linear/<TICKET-ID>-<slug>
```

Use the branch name provided in your prompt.

### 3. Learn the codebase

- Read `CLAUDE.md` at the repo root for overall conventions
- Each package has its own `CLAUDE.md` with package-specific rules — read the ones relevant to your work
- Use `packages/domain-users/` as the reference example for domain structure, tests, and route wiring
- Read `DESIGN.md` before writing any UI code — it is the visual source of truth

### 4. Implement

Work within your assigned domain package (`packages/domain-*`). Follow the structure in the domain's CLAUDE.md.

#### Database changes

If your ticket requires schema changes:
1. Create/edit schema files in `packages/db/src/schema/`
2. Export new tables from `packages/db/src/schema/index.ts`
3. Generate migration: `cd packages/db && npx drizzle-kit generate`
4. Apply migration: `cd packages/db && DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate`
5. Migrations are auto-applied to production when your PR merges

#### Testing requirements

- Unit tests are required for all new services — mock the DB with `vi.mock("@biarritz/db", ...)`
- Integration tests use `describe.skipIf(!process.env.DATABASE_URL)` guard
- Test files go in `__tests__/unit/` and `__tests__/integration/` matching the source file name
- Look at `packages/domain-users/__tests__/` for examples
- Run tests with `pnpm --filter=@biarritz/<package-name> test` during development

#### Quality rules

- Use `@biarritz/ui` components (Button, Input, Card, etc.) — never build raw HTML for common UI patterns
- Use `cn()` from `@biarritz/ui` for className merging
- Validate all user input with Zod schemas in `src/lib/validations.ts`
- Use `type` imports for types: `import type { Foo } from "./bar"`
- Use extensionless relative imports: `"./utils"` not `"./utils.js"`

#### Visual quality — MANDATORY for any UI change

Read `DESIGN.md` thoroughly before writing any component. Follow it exactly. Key rules:
- All colors MUST come from design tokens (e.g. `bg-primary`, `text-muted-foreground`). Never use arbitrary hex/oklch values.
- All icons MUST use `lucide-react`. Never hand-write SVG.
- Font sizes: use the Linear-inspired scale from DESIGN.md (13px body, 14px titles). Never use text-xl or larger in app UI.
- Border radius: `rounded-md` max. Never use `rounded-xl` or larger.
- Follow the layout patterns in DESIGN.md exactly (page header, list pages, detail pages, forms).

### 5. Verify

Run quick checks frequently during development:
```bash
pnpm agent:check
```

Before finishing, run the full pipeline:
```bash
pnpm agent:verify
```
All four steps must pass: typecheck, lint, test, build.

### 6. Self-review checklist

Before committing, verify:
1. All Tailwind class names resolve — no invented classes
2. Every icon uses `lucide-react`, no inline `<svg>` elements
3. Colors come from design tokens only — no arbitrary `bg-[#xxx]`
4. Used `@biarritz/ui` components for all standard UI elements
5. Font sizes follow DESIGN.md scale — no `text-xl` or larger in app UI
6. Changes are scoped to what the ticket asked — no unrequested layout overhauls

### 7. Commit and push

```bash
git add -A
git commit -m "feat(<TICKET-ID>): <short description of changes>"
git push origin linear/<TICKET-ID>-<slug>
```

### 8. Create a pull request

Create a PR using `gh`:

```bash
gh pr create \
  --base main \
  --head "linear/<TICKET-ID>-<slug>" \
  --title "<TICKET-ID>: <ticket title>" \
  --body "$(cat <<'EOF'
## Linear Ticket
[<TICKET-ID>](https://linear.app/issue/<TICKET-ID>)

<!-- neon-branch: <NEON_BRANCH_ID> -->

## Summary
<2-4 sentences describing what was done and why>

## Changes
<bullet list of key changes>

## Testing
- Unit tests: `pnpm --filter=@biarritz/<package> test`
- Manual testing: <steps to verify>

---
*Automated by Linear Agent workflow*
EOF
)"
```

Replace `<TICKET-ID>`, `<NEON_BRANCH_ID>`, and other placeholders with actual values from your prompt.

### 9. Follow-up tickets

If you discover unrelated bugs, missing tests, or improvements during implementation:
1. Check the existing tickets list in your prompt to avoid duplicates
2. If a similar ticket already exists, add a comment:
   ```bash
   source scripts/lib/linear.sh
   linear_add_comment "<EXISTING_ISSUE_ID>" "Discovered while working on <TICKET-ID>: <your finding>"
   ```
3. If no similar ticket exists, create a new one:
   ```bash
   source scripts/lib/linear.sh
   linear_create_issue "$LINEAR_TEAM_ID" "<title>" "<description>" ""
   ```

## Requesting Clarification

Request clarification ONLY when:
- The ticket is ambiguous about a critical design decision
- There are contradictory requirements
- The ticket references external resources that are not attached or described
- A technical approach has multiple valid interpretations with significantly different outcomes

Do NOT request clarification when the ticket is simply light on detail — use your best judgment.

To request clarification:

```bash
source scripts/lib/linear.sh

# Post your questions as a comment
linear_add_comment "<ISSUE_ID>" "**Clarification needed before implementation can proceed.**

<summary of what is unclear>

1. <question 1>
2. <question 2>

Reply with \`@agent\` followed by your answers to resume implementation. — Agent"

# Move ticket to Needs Clarification status
linear_update_issue_status "<ISSUE_ID>" "$LINEAR_STATUS_NEEDS_CLARIFICATION"
```

Then exit without creating a branch or making changes.

## Decomposing Tickets

If the ticket would not produce a PR that's logical and easy to review, break it into sub-tickets. Each sub-ticket should make sense as its own PR — reviewable, self-contained, and logically coherent.

To decompose:

```bash
source scripts/lib/linear.sh

# Create sub-tickets (order by dependencies: DB changes first, then services, then UI)
linear_create_sub_issue "$LINEAR_TEAM_ID" "<PARENT_ISSUE_ID>" "Sub-ticket title" "Parent: <TICKET-ID>
Order: 1/N

<description of what this sub-ticket covers>"

# Repeat for each sub-ticket...

# Set each sub-ticket to Todo to trigger new agents
linear_update_issue_status "<SUB_ISSUE_ID>" "$LINEAR_STATUS_TODO"

# Update parent to Decomposed
linear_update_issue_status "<PARENT_ISSUE_ID>" "$LINEAR_STATUS_DECOMPOSED"

# Post a comment on the parent
linear_add_comment "<PARENT_ISSUE_ID>" "Decomposed into N sub-tickets. Each sub-ticket will be implemented independently."
```

Then exit without creating a branch or implementing.

## Domain Rules

- **Stay in your domain**: Only modify files in your assigned `packages/domain-*` and its route re-exports in `apps/web/app/(domains)/`
- **Database changes are allowed**: You MAY modify `packages/db/src/schema/` and generate migrations when your ticket requires schema changes
- **Do not modify UI or shared packages** (`packages/ui`, `packages/shared`) without explicit instruction
- **Never commit `.env.local`** or `.neon-branch-id`

## Creating a New Domain Package

1. Create `packages/domain-<name>/` following the structure in `packages/domain-users/`
2. Required files:
   - `package.json` (use domain-users as template, update name)
   - `tsconfig.json` (identical to domain-users)
   - `vitest.config.ts` (identical to domain-users)
   - `eslint.config.js` (identical to domain-users)
   - `src/index.ts` (public API barrel)
   - `CLAUDE.md` (domain-specific instructions)
3. Wire routes into `apps/web`:
   - Add dependency to `apps/web/package.json`
   - Add to `transpilePackages` in `apps/web/next.config.ts`
   - Create route re-exports in `apps/web/app/(domains)/`
4. Run `pnpm install` to link the new package

## Adding a Database Table

1. Create schema file in `packages/db/src/schema/<table>.ts`
2. Export it from `packages/db/src/schema/index.ts`
3. Run `cd packages/db && npx drizzle-kit generate` to create a migration
4. Run `cd packages/db && DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate` to apply it
5. Never edit generated migration SQL files

## Migration Conflict Resolution

Migration conflicts between parallel agents are resolved automatically by CI. You do NOT need to worry about migration index collisions. Just follow the standard workflow above.

When your PR is opened, the `migration-reconcile` workflow:
1. Detects if your migration index conflicts with what's already on `main`
2. If so, deletes your migration files, resets to main's state, and regenerates from your schema changes
3. Commits the fix to your PR branch automatically

The schema `.ts` files are the source of truth — migrations are derived from them.

## Addressing Review Feedback

When you are invoked to address review feedback on an existing PR:
1. You are already on the PR branch with all existing changes
2. Read each review comment carefully and address it
3. For inline comments, go to the specific file and line and make the requested change
4. Do NOT revert unrelated changes or start over — only address the review feedback
5. If a comment is unclear, use your best judgment and note your interpretation
6. Run `pnpm agent:verify` before finishing
7. Commit and push:
   ```bash
   git add -A
   git commit -m "fix(<TICKET-ID>): address review feedback"
   git push origin <branch>
   ```

## Automated Review

After your PR is created, an automated reviewer agent analyzes your changes against:
- Scope compliance (stayed within assigned domain)
- Design system compliance (if UI changes)
- Code quality (imports, naming, validation)
- Test coverage
- Ticket completeness

The review is advisory and does not block merging. Address FAIL items before requesting human review.
```

- [ ] **Step 2: Commit AGENTS.md**

```bash
git add AGENTS.md
git commit -m "refactor: restructure AGENTS.md as primary instruction source for claude --remote"
```

---

### Task 2: Simplify build-agent-prompt.sh

**Files:**
- Modify: `scripts/build-agent-prompt.sh`

The prompt shrinks from ~225 lines to ~60. No more injecting CLAUDE.md/AGENTS.md — the agent reads them from the repo.

- [ ] **Step 1: Rewrite build-agent-prompt.sh**

Replace the entire contents of `scripts/build-agent-prompt.sh` with:

```bash
#!/usr/bin/env bash
# build-agent-prompt.sh — Build a lean prompt for claude --remote
# Usage: ./scripts/build-agent-prompt.sh <ticket_json_file>
# Outputs the prompt to stdout
#
# Required env vars:
#   DATABASE_URL — Neon branch connection string
#   NEON_BRANCH_ID — Neon branch ID (for PR body cleanup tag)

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

## Environment
- DATABASE_URL: ${DATABASE_URL}
- Neon branch ID: ${NEON_BRANCH_ID} (include in PR body as \`<!-- neon-branch: ${NEON_BRANCH_ID} -->\`)
- Branch name: linear/${ISSUE_ID}-${SLUG}

## Existing Tickets
These tickets already exist — do NOT create duplicates:
${EXISTING_TICKETS:-No existing tickets found.}

Read AGENTS.md for full workflow instructions.
PROMPT
```

- [ ] **Step 2: Commit**

```bash
git add scripts/build-agent-prompt.sh
git commit -m "refactor: simplify build-agent-prompt.sh for claude --remote"
```

---

### Task 3: Simplify build-fix-prompt.sh

**Files:**
- Modify: `scripts/build-fix-prompt.sh`

- [ ] **Step 1: Rewrite build-fix-prompt.sh**

Replace the entire contents of `scripts/build-fix-prompt.sh` with:

```bash
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
```

- [ ] **Step 2: Commit**

```bash
git add scripts/build-fix-prompt.sh
git commit -m "refactor: simplify build-fix-prompt.sh for claude --remote"
```

---

### Task 4: Rewrite linear-agent.yml as thin dispatcher

**Files:**
- Modify: `.github/workflows/linear-agent.yml`

- [ ] **Step 1: Rewrite linear-agent.yml**

Replace the entire contents of `.github/workflows/linear-agent.yml` with:

```yaml
name: Linear Agent

on:
  repository_dispatch:
    types: [linear-ticket]

env:
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
  LINEAR_TEAM_ID: ${{ vars.LINEAR_TEAM_ID }}
  NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
  NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}

jobs:
  dispatch:
    name: Dispatch Agent
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          sparse-checkout: scripts

      - name: Fetch full ticket from Linear
        id: ticket
        run: |
          ISSUE_ID="${{ github.event.client_payload.issue_id }}"
          echo "issue_id=$ISSUE_ID" >> "$GITHUB_OUTPUT"

          PAYLOAD=$(python3 -c "import json; print(json.dumps({'query': 'query { issue(id: \"'\"$ISSUE_ID\"'\") { id identifier title description priority state { name } labels { nodes { name } } comments { nodes { body user { name } } } attachments { nodes { url title metadata } } } }'}))")

          RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
            -H "Authorization: ${LINEAR_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")

          TICKET_JSON=$(echo "$RESPONSE" | python3 -c "
          import sys, json
          data = json.load(sys.stdin)['data']['issue']
          print(json.dumps(data, indent=2))
          ")
          echo "$TICKET_JSON" > /tmp/ticket.json

          IDENTIFIER=$(echo "$TICKET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['identifier'])")
          echo "identifier=$IDENTIFIER" >> "$GITHUB_OUTPUT"

          # Extract image URLs from attachments and description
          python3 -c "
          import json, re
          data = json.load(open('/tmp/ticket.json'))
          urls = []
          for a in data.get('attachments', {}).get('nodes', []):
              url = a.get('url', '')
              if any(url.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']):
                  urls.append(url)
          desc = data.get('description', '') or ''
          for match in re.findall(r'!\[.*?\]\((https?://[^\)]+)\)', desc):
              urls.append(match)
          for match in re.findall(r'(https://uploads\.linear\.app/[^\s\)]+)', desc):
              if match not in urls:
                  urls.append(match)
          print('\n'.join(urls))
          " > /tmp/image-urls.txt 2>/dev/null || true

      - name: Fetch existing tickets from Linear
        run: |
          PAYLOAD=$(python3 -c "import json; print(json.dumps({'query': 'query { team(id: \"'\"$LINEAR_TEAM_ID\"'\") { issues(first: 100, filter: { state: { type: { nin: [\"completed\", \"canceled\"] } } }) { nodes { identifier title state { name } } } } }'}))")
          RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
            -H "Authorization: ${LINEAR_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")
          echo "$RESPONSE" | python3 -c "
          import sys, json
          data = json.load(sys.stdin)['data']['team']['issues']['nodes']
          for issue in data:
              print(f\"{issue['identifier']}: {issue['title']} [{issue['state']['name']}]\")
          " > /tmp/existing-tickets.txt 2>/dev/null || echo "" > /tmp/existing-tickets.txt

      - name: Create Neon database branch
        id: neon
        run: |
          source scripts/lib/common.sh
          source scripts/lib/neon.sh
          BRANCH_ID="agent-${{ github.run_id }}"
          DATABASE_URL=$(neon_create_branch "$BRANCH_ID")
          echo "database_url=$DATABASE_URL" >> "$GITHUB_OUTPUT"
          echo "branch_id=$(cat .neon-branch-id)" >> "$GITHUB_OUTPUT"

      - name: Build agent prompt
        run: |
          DATABASE_URL="${{ steps.neon.outputs.database_url }}" \
          NEON_BRANCH_ID="${{ steps.neon.outputs.branch_id }}" \
          bash scripts/build-agent-prompt.sh /tmp/ticket.json > /tmp/agent-prompt.txt
          echo "Prompt size: $(wc -c < /tmp/agent-prompt.txt) bytes"

      - name: Dispatch remote agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code@latest
          PROMPT=$(cat /tmp/agent-prompt.txt)
          claude --remote "$PROMPT"
          echo "Remote agent session dispatched"
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/linear-agent.yml'))"`
Expected: No output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/linear-agent.yml
git commit -m "refactor: rewrite linear-agent.yml as thin dispatcher for claude --remote"
```

---

### Task 5: Rewrite agent-revision.yml as thin dispatcher

**Files:**
- Modify: `.github/workflows/agent-revision.yml`

- [ ] **Step 1: Rewrite agent-revision.yml**

Replace the entire contents of `.github/workflows/agent-revision.yml` with:

```yaml
name: Agent Revision

on:
  pull_request_review:
    types: [submitted]

concurrency:
  group: agent-revision-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  dispatch:
    name: Dispatch Revision Agent
    if: github.event.review.state == 'changes_requested'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      pull-requests: read

    steps:
      - name: Check if this is an agent PR
        id: guard
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_NUMBER="${{ github.event.pull_request.number }}"
          BRANCH="${{ github.event.pull_request.head.ref }}"
          REVIEWER="${{ github.event.review.user.login }}"

          # Guard 1: Only process PRs on linear/* branches
          if [[ "$BRANCH" != linear/* ]]; then
            echo "Not an agent branch ($BRANCH), skipping"
            echo "should_run=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          # Guard 2: Don't process reviews from bots
          if [[ "$REVIEWER" == *"[bot]"* ]]; then
            echo "Review is from a bot ($REVIEWER), skipping"
            echo "should_run=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          # Guard 3: Verify PR body contains agent marker
          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body')
          if ! echo "$PR_BODY" | grep -q "Automated by Linear Agent workflow"; then
            echo "PR not created by agent, skipping"
            echo "should_run=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          # Guard 4: Check revision count via PR labels (max 2 revisions)
          REVISION_COUNT=$(gh pr view "$PR_NUMBER" --json labels --jq '[.labels[].name | select(startswith("agent-revision"))] | length')
          if [[ "$REVISION_COUNT" -ge 2 ]]; then
            echo "Max revisions (2) reached, skipping"
            echo "should_run=false" >> "$GITHUB_OUTPUT"
            gh pr comment "$PR_NUMBER" --body "Agent has already performed 2 revisions on this PR. Further changes require manual implementation."
            exit 0
          fi

          echo "should_run=true" >> "$GITHUB_OUTPUT"
          echo "pr_number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
          echo "branch=$BRANCH" >> "$GITHUB_OUTPUT"

      - name: Extract ticket identifier from branch
        if: steps.guard.outputs.should_run == 'true'
        id: ticket
        run: |
          BRANCH="${{ steps.guard.outputs.branch }}"
          # Extract identifier from branch name: linear/AGE-42-some-slug -> AGE-42
          IDENTIFIER=$(echo "$BRANCH" | sed 's|^linear/||' | grep -oP '^[A-Z]+-\d+')
          echo "identifier=$IDENTIFIER" >> "$GITHUB_OUTPUT"

      - name: Gather review comments
        if: steps.guard.outputs.should_run == 'true'
        id: reviews
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_NUMBER="${{ steps.guard.outputs.pr_number }}"
          REVIEW_ID="${{ github.event.review.id }}"

          REVIEW_BODY="${{ github.event.review.body }}"
          echo "$REVIEW_BODY" > /tmp/review-body.txt

          gh api \
            "repos/${{ github.repository }}/pulls/${PR_NUMBER}/reviews/${REVIEW_ID}/comments" \
            --jq '.[] | "File: \(.path):\(.line // .original_line // "N/A")\nComment: \(.body)\n---"' \
            > /tmp/review-comments.txt 2>/dev/null || echo "" > /tmp/review-comments.txt

      - name: Build revision prompt
        if: steps.guard.outputs.should_run == 'true'
        run: |
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"
          BRANCH="${{ steps.guard.outputs.branch }}"
          REVIEW_BODY=$(cat /tmp/review-body.txt)
          REVIEW_COMMENTS=$(cat /tmp/review-comments.txt)

          cat > /tmp/revision-prompt.txt <<PROMPT_EOF
          You are addressing review feedback on a pull request.

          ## Ticket
          - ID: ${IDENTIFIER}

          ## Branch
          ${BRANCH}

          ## Review Feedback

          ### Reviewer's Summary
          ${REVIEW_BODY}

          ### Inline Comments
          ${REVIEW_COMMENTS}

          Read AGENTS.md (section: "Addressing Review Feedback") for full instructions.
          PROMPT_EOF

          echo "Revision prompt: $(wc -c < /tmp/revision-prompt.txt) bytes"

      - name: Dispatch remote agent
        if: steps.guard.outputs.should_run == 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code@latest
          PROMPT=$(cat /tmp/revision-prompt.txt)
          claude --remote "$PROMPT"
          echo "Remote revision agent dispatched"
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/agent-revision.yml'))"`
Expected: No output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/agent-revision.yml
git commit -m "refactor: rewrite agent-revision.yml as thin dispatcher for claude --remote"
```

---

### Task 6: Rewrite agent-fix.yml as thin dispatcher

**Files:**
- Modify: `.github/workflows/agent-fix.yml`

- [ ] **Step 1: Rewrite agent-fix.yml**

Replace the entire contents of `.github/workflows/agent-fix.yml` with:

```yaml
name: Agent Fix

on:
  repository_dispatch:
    types: [linear-agent-fix]

env:
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}

concurrency:
  group: agent-fix-${{ github.event.client_payload.issue_id }}
  cancel-in-progress: true

jobs:
  dispatch:
    name: Dispatch Fix Agent
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          sparse-checkout: scripts

      - name: Fetch ticket from Linear
        id: ticket
        run: |
          ISSUE_ID="${{ github.event.client_payload.issue_id }}"
          INSTRUCTIONS="${{ github.event.client_payload.instructions }}"
          echo "issue_id=$ISSUE_ID" >> "$GITHUB_OUTPUT"

          PAYLOAD=$(python3 -c "import json; print(json.dumps({'query': 'query { issue(id: \"'\"$ISSUE_ID\"'\") { id identifier title description } }'}))")

          RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
            -H "Authorization: ${LINEAR_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD")

          TICKET_JSON=$(echo "$RESPONSE" | python3 -c "
          import sys, json
          data = json.load(sys.stdin)['data']['issue']
          print(json.dumps(data, indent=2))
          ")
          echo "$TICKET_JSON" > /tmp/ticket.json

      - name: Build fix prompt
        run: |
          INSTRUCTIONS="${{ github.event.client_payload.instructions }}"
          bash scripts/build-fix-prompt.sh /tmp/ticket.json "$INSTRUCTIONS" > /tmp/fix-prompt.txt
          echo "Fix prompt: $(wc -c < /tmp/fix-prompt.txt) bytes"

      - name: Dispatch remote agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code@latest
          PROMPT=$(cat /tmp/fix-prompt.txt)
          claude --remote "$PROMPT"
          echo "Remote fix agent dispatched"
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/agent-fix.yml'))"`
Expected: No output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/agent-fix.yml
git commit -m "refactor: rewrite agent-fix.yml as thin dispatcher for claude --remote"
```

---

### Task 7: Create agent-pr-opened.yml

**Files:**
- Create: `.github/workflows/agent-pr-opened.yml`

This event-driven workflow fires when a PR is opened on a `linear/*` branch. It updates Linear and runs the automated reviewer.

- [ ] **Step 1: Create agent-pr-opened.yml**

```yaml
name: Agent PR Opened

on:
  pull_request:
    types: [opened]
    branches: [main]

env:
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
  LINEAR_STATUS_IN_REVIEW: ${{ vars.LINEAR_STATUS_IN_REVIEW }}

jobs:
  update-linear:
    name: Update Linear & Review
    if: startsWith(github.event.pull_request.head.ref, 'linear/')
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0

      - name: Extract ticket identifier
        id: ticket
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          # Extract identifier: linear/AGE-42-some-slug -> AGE-42
          IDENTIFIER=$(echo "$BRANCH" | sed 's|^linear/||' | grep -oP '^[A-Z]+-\d+')
          echo "identifier=$IDENTIFIER" >> "$GITHUB_OUTPUT"
          echo "Ticket: $IDENTIFIER"

      - name: Look up ticket in Linear
        id: linear
        run: |
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"

          RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
            -H "Authorization: ${LINEAR_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "$(python3 -c "import json; print(json.dumps({'query': 'query { issues(filter: { identifier: { eq: \"${IDENTIFIER}\" } }) { nodes { id identifier title description } } }'}))")")

          ISSUE_ID=$(echo "$RESPONSE" | python3 -c "
          import sys, json
          nodes = json.load(sys.stdin)['data']['issues']['nodes']
          print(nodes[0]['id'] if nodes else '')
          " 2>/dev/null)

          echo "issue_id=$ISSUE_ID" >> "$GITHUB_OUTPUT"

          if [[ -z "$ISSUE_ID" ]]; then
            echo "Could not find Linear ticket for $IDENTIFIER"
          fi

          echo "$RESPONSE" | python3 -c "
          import sys, json
          nodes = json.load(sys.stdin)['data']['issues']['nodes']
          if nodes:
              print(json.dumps(nodes[0], indent=2))
          else:
              print('{}')
          " > /tmp/ticket.json 2>/dev/null || true

      - name: Update Linear ticket status
        if: steps.linear.outputs.issue_id != ''
        run: |
          source scripts/lib/linear.sh
          ISSUE_ID="${{ steps.linear.outputs.issue_id }}"
          PR_URL="${{ github.event.pull_request.html_url }}"

          if [[ -n "$LINEAR_STATUS_IN_REVIEW" ]]; then
            linear_update_issue_status "$ISSUE_ID" "$LINEAR_STATUS_IN_REVIEW" || true
          fi
          linear_add_comment "$ISSUE_ID" "PR created: ${PR_URL}" || true

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run automated reviewer
        if: steps.linear.outputs.issue_id != ''
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set +o pipefail
          BRANCH="${{ github.event.pull_request.head.ref }}"
          PR_URL="${{ github.event.pull_request.html_url }}"
          IDENTIFIER="${{ steps.ticket.outputs.identifier }}"

          # Build reviewer prompt
          bash scripts/build-reviewer-prompt.sh /tmp/ticket.json "$PR_URL" "$BRANCH" > /tmp/reviewer-prompt.txt
          echo "Reviewer prompt size: $(wc -c < /tmp/reviewer-prompt.txt) bytes" >&2

          # Install and run reviewer agent with read-only tools
          npm install -g @anthropic-ai/claude-code@latest
          REVIEW_PROMPT=$(cat /tmp/reviewer-prompt.txt)
          claude -p "$REVIEW_PROMPT" \
            --allowedTools "Read,Glob,Grep" \
            --output-format text \
            > /tmp/review-output.txt 2>&1 || true

          echo "Review output: $(wc -c < /tmp/review-output.txt) bytes" >&2

          # Parse verdict
          VERDICT=$(grep -oP 'REVIEW_VERDICT:\s*\K\S+' /tmp/review-output.txt 2>/dev/null || echo "COMMENT")

          # Extract review body
          python3 -c "
          import re
          text = open('/tmp/review-output.txt').read()
          match = re.search(r'REVIEW_BODY:\s*\n(.*?)(?:LINE_COMMENTS:|$)', text, re.DOTALL)
          body = match.group(1).strip() if match else 'Review agent did not produce structured output.'
          identifier = '${IDENTIFIER}'
          with open('/tmp/review-body.txt', 'w') as f:
              f.write('> **Automated Agent Review** — This review is advisory and does not block merging.\n\n')
              f.write(body)
              f.write(f'\n\n---\n*Reviewed by Claude Agent for {identifier}*\n')
          "

          # Map verdict to gh pr review flag
          case "$VERDICT" in
            APPROVE)         REVIEW_FLAG="--approve" ;;
            REQUEST_CHANGES) REVIEW_FLAG="--comment" ;;
            *)               REVIEW_FLAG="--comment" ;;
          esac

          # Post review
          gh pr review "$PR_URL" $REVIEW_FLAG --body-file /tmp/review-body.txt || true
          echo "Review posted with verdict: $VERDICT" >&2
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/agent-pr-opened.yml'))"`
Expected: No output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/agent-pr-opened.yml
git commit -m "feat: add agent-pr-opened.yml for Linear updates and automated review"
```

---

### Task 8: Create agent-pr-closed.yml

**Files:**
- Create: `.github/workflows/agent-pr-closed.yml`

This workflow fires when a PR on a `linear/*` branch is closed (merged or not). It cleans up the Neon branch.

- [ ] **Step 1: Create agent-pr-closed.yml**

```yaml
name: Agent PR Closed

on:
  pull_request:
    types: [closed]
    branches: [main]

env:
  NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
  NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
  LINEAR_STATUS_DONE: ${{ vars.LINEAR_STATUS_DONE }}

jobs:
  cleanup:
    name: Cleanup Neon & Update Linear
    if: startsWith(github.event.pull_request.head.ref, 'linear/')
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
      pull-requests: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          sparse-checkout: scripts

      - name: Extract Neon branch ID from PR body
        id: neon
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_NUMBER="${{ github.event.pull_request.number }}"
          # Get PR body safely via gh CLI (avoids shell interpolation issues)
          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body')
          # Extract neon branch ID from HTML comment: <!-- neon-branch: agent-12345 -->
          NEON_BRANCH_ID=$(echo "$PR_BODY" | grep -oP '<!-- neon-branch: \K[^ ]+(?= -->)' || echo "")
          echo "branch_id=$NEON_BRANCH_ID" >> "$GITHUB_OUTPUT"

          if [[ -z "$NEON_BRANCH_ID" ]]; then
            echo "No Neon branch ID found in PR body"
          else
            echo "Found Neon branch: $NEON_BRANCH_ID"
          fi

      - name: Delete Neon branch
        if: steps.neon.outputs.branch_id != ''
        run: |
          source scripts/lib/common.sh
          source scripts/lib/neon.sh
          neon_delete_branch "${{ steps.neon.outputs.branch_id }}" || true

      - name: Update Linear ticket to Done
        if: github.event.pull_request.merged == true
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          IDENTIFIER=$(echo "$BRANCH" | sed 's|^linear/||' | grep -oP '^[A-Z]+-\d+')

          if [[ -z "$IDENTIFIER" || -z "$LINEAR_STATUS_DONE" ]]; then
            echo "Skipping Linear update (identifier=$IDENTIFIER, status_done=$LINEAR_STATUS_DONE)"
            exit 0
          fi

          # Look up issue ID
          RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
            -H "Authorization: ${LINEAR_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "$(python3 -c "import json; print(json.dumps({'query': 'query { issues(filter: { identifier: { eq: \"${IDENTIFIER}\" } }) { nodes { id } } }'}))")")

          ISSUE_ID=$(echo "$RESPONSE" | python3 -c "
          import sys, json
          nodes = json.load(sys.stdin)['data']['issues']['nodes']
          print(nodes[0]['id'] if nodes else '')
          " 2>/dev/null)

          if [[ -n "$ISSUE_ID" ]]; then
            source scripts/lib/linear.sh
            linear_update_issue_status "$ISSUE_ID" "$LINEAR_STATUS_DONE" || true
            echo "Moved $IDENTIFIER to Done"
          fi
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/agent-pr-closed.yml'))"`
Expected: No output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/agent-pr-closed.yml
git commit -m "feat: add agent-pr-closed.yml for Neon cleanup and Linear Done status"
```

---

### Task 9: Delete decompose files and update webhook

**Files:**
- Delete: `.github/workflows/linear-decompose.yml`
- Delete: `scripts/build-decompose-prompt.sh`
- Modify: `apps/web/app/api/webhooks/linear/route.ts`

- [ ] **Step 1: Delete the decompose workflow and prompt script**

```bash
rm .github/workflows/linear-decompose.yml
rm scripts/build-decompose-prompt.sh
```

- [ ] **Step 2: Remove Decompose handling from webhook route**

In `apps/web/app/api/webhooks/linear/route.ts`, remove the `LINEAR_DECOMPOSE_STATUS` constant and the decompose branch from `handleIssueEvent`.

Remove the `LINEAR_DECOMPOSE_STATUS` line:
```typescript
const LINEAR_DECOMPOSE_STATUS = process.env.LINEAR_DECOMPOSE_STATUS ?? "Decompose";
```

Replace the `handleIssueEvent` function with:

```typescript
function handleIssueEvent(payload: LinearIssuePayload): { eventType: string; clientPayload: Record<string, unknown> } | { ignored: true; reason: string } {
  const currentStatus = payload.data.state?.name;

  if (currentStatus !== LINEAR_TRIGGER_STATUS) {
    return { ignored: true, reason: `status is "${currentStatus}", not "${LINEAR_TRIGGER_STATUS}"` };
  }

  if (payload.action !== "create" && !payload.updatedFrom?.stateId) {
    return { ignored: true, reason: "status was not changed in this update" };
  }

  return {
    eventType: "linear-ticket",
    clientPayload: {
      issue_id: payload.data.id,
      title: payload.data.title,
      description: payload.data.description ?? "",
      priority: payload.data.priority,
      labels: (payload.data.labels ?? []).map((l) => l.name),
    },
  };
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter=@biarritz/web typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove decompose workflow, agent handles decomposition directly"
```

---

### Task 10: Update CLAUDE.md references

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md Linear Integration section**

In `CLAUDE.md`, update the Linear Integration section to reflect the new architecture. Replace the existing Linear Integration bullet points (starting with `- Linear tickets trigger agents`) with:

```markdown
- Linear tickets trigger agents via webhook → GitHub Actions → `claude --remote`
- Webhook endpoint: `apps/web/app/api/webhooks/linear/route.ts`
- Dispatch workflows: `.github/workflows/linear-agent.yml`, `.github/workflows/agent-fix.yml`
- Event-driven workflows: `.github/workflows/agent-pr-opened.yml`, `.github/workflows/agent-pr-closed.yml`
- Agent revision: `.github/workflows/agent-revision.yml` — auto-addresses "changes requested" review feedback (max 2 revisions)
- Prompt builders: `scripts/build-agent-prompt.sh`, `scripts/build-fix-prompt.sh`, `scripts/build-reviewer-prompt.sh`
- Linear API helpers: `scripts/lib/linear.sh`
- Agents run autonomously via `claude --remote` — they read AGENTS.md from the repo for all workflow instructions
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md Linear Integration section for remote agent architecture"
```
