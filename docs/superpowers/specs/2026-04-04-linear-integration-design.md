# Linear Integration Design

## Context

The Biarritz repo is an agent-optimized Turborepo monorepo. The goal is to use Linear as the primary interface for managing development work: create a ticket in Linear, an agent picks it up, implements it, creates a PR, updates the ticket, and proposes follow-up tickets for anything it discovered along the way.

## Architecture

```
Linear (ticket created/moved to "Todo")
  → webhook POST to Vercel
    → /api/webhooks/linear/route.ts
      → validates signature
      → filters for trigger status
      → fires repository_dispatch to GitHub
        → .github/workflows/linear-agent.yml
          → fetches full ticket from Linear GraphQL API
          → builds agent prompt from ticket + repo context
          → runs: claude -p "$PROMPT" --allowedTools "..."
          → agent: creates branch, implements, runs pnpm agent:verify
          → creates PR linked to Linear ticket
          → updates Linear ticket status → "In Review"
          → creates follow-up Linear tickets from agent discoveries
```

The Vercel endpoint is a stateless proxy (~30 lines). All intelligence lives in the GH Actions workflow and the Claude agent.

## Webhook Endpoint

**Location**: `apps/web/app/api/webhooks/linear/route.ts`

**Responsibilities**:
- Receive POST from Linear
- Validate webhook signature using `LINEAR_WEBHOOK_SECRET`
- Filter for `Issue` events where status changes to trigger status (env var `LINEAR_TRIGGER_STATUS`, default `"Todo"`)
- Extract: issue ID, title, description, labels, priority
- Call GitHub API to create a `repository_dispatch` event with type `linear-ticket` and the extracted payload
- Return 200 immediately

**Does NOT**: write to DB, call Linear API, enrich data. Validate and forward only.

**Environment variables**:
- `LINEAR_WEBHOOK_SECRET` — signature verification
- `GITHUB_TOKEN` — PAT with `repo` scope for dispatches
- `GITHUB_REPO` — `owner/repo` string

## GitHub Actions Workflow

**Location**: `.github/workflows/linear-agent.yml`

**Trigger**: `repository_dispatch` with type `linear-ticket`

**Steps**:

1. **Checkout repo**
2. **Setup Node + pnpm** (reuses `.nvmrc`, same as CI workflow)
3. **Install deps** (`pnpm install --frozen-lockfile`)
4. **Fetch full ticket** — calls Linear GraphQL API with the issue ID from the dispatch payload. Gets: title, description, comments, labels, priority, relations.
5. **Build agent prompt** — `scripts/build-agent-prompt.sh` templates ticket data into a structured prompt, appending CLAUDE.md and AGENTS.md.
6. **Run Claude agent** — `claude -p "$PROMPT" --allowedTools "Read,Edit,Write,Bash,Glob,Grep" --output-format json`. The agent:
   - Creates branch `linear/<issue-id>-<slug>`
   - Implements the work
   - Runs `pnpm agent:verify`
   - Outputs structured JSON with status, summary, branch, and follow-ups
7. **Create PR** — `gh pr create` with title referencing the Linear ticket
8. **Update Linear** — moves ticket to "In Review", adds comment with PR link
9. **Create follow-ups** — parses agent JSON output, creates up to 5 follow-up tickets

**Timeout**: 30 minutes. On timeout, updates the Linear ticket with a "timed out" comment.

**Secrets**:
- `LINEAR_API_KEY`
- `ANTHROPIC_API_KEY`

## Agent Prompt Template

```
You are working on a codebase at {repo_path}.
You have been assigned a Linear ticket to implement.

## Ticket
- ID: {issue_id}
- Title: {title}
- Description: {description}
- Labels: {labels}
- Priority: {priority}
- Comments: {comments}

## Instructions
1. Read CLAUDE.md and AGENTS.md to understand the repo conventions
2. Create a branch named linear/{issue_id}-{slug}
3. Implement the work described in the ticket
4. If the ticket is vague, use your best judgment — prefer small, focused changes
5. Run `pnpm agent:verify` before finishing — all checks must pass
6. If you discover bugs, missing tests, or improvement opportunities unrelated
   to this ticket, note them as follow-ups

## Output
When done, print a JSON block with this shape:
{
  "status": "success" | "failed",
  "summary": "what you did in 2-3 sentences",
  "branch": "the branch name you created",
  "follow_ups": [
    { "title": "...", "description": "...", "labels": ["bug"|"improvement"|"tech-debt"] }
  ]
}
```

The agent uses brief intent — it figures out implementation details from vague descriptions rather than blocking.

## Linear API Integration

**Location**: `scripts/lib/linear.sh`

Bash + curl wrappers over Linear's GraphQL API, consistent with existing `neon.sh` pattern.

**Functions**:
- `linear_get_issue <issue_id>` — fetch full issue details
- `linear_update_issue_status <issue_id> <state_id>` — move ticket status
- `linear_add_comment <issue_id> <body>` — post comment on ticket
- `linear_create_issue <title> <description> <labels[]>` — create new ticket
- `linear_get_states` — list workflow states (for initial setup/configuration)

**Auth**: Bearer token via `LINEAR_API_KEY` env var.

**Status mapping**: Linear workflow state IDs are team-specific. Configured via env vars:
- `LINEAR_TEAM_ID` — which team to create tickets in
- `LINEAR_TRIGGER_STATUS` — status name that triggers agent work (default: "Todo")
- `LINEAR_STATUS_IN_REVIEW` — state ID to move tickets to after PR creation
- `LINEAR_STATUS_DONE` — state ID for completed tickets

## Follow-Up Ticket Creation

**Trigger**: Agent includes `follow_ups` array in its JSON output.

**Each follow-up**:
- Created as a new Linear issue in the same team
- Description references the parent ticket ("Discovered while working on LIN-123")
- Labels mapped from agent output: `bug`, `improvement`, `tech-debt`
- Priority set to low by default (user triages)

**Guard rails**:
- Maximum 5 follow-up tickets per agent run
- Agent instructed to only propose concrete, actionable issues

## Files

**New**:
- `apps/web/app/api/webhooks/linear/route.ts` — webhook proxy
- `.github/workflows/linear-agent.yml` — agent workflow
- `scripts/lib/linear.sh` — Linear API helpers
- `scripts/build-agent-prompt.sh` — prompt templating

**Modified**:
- `.env.example` — add Linear + GitHub env vars
- `CLAUDE.md` — document Linear integration
- `AGENTS.md` — add Linear-driven workflow section

**Not creating**:
- No new domain package (this is infrastructure)
- No new DB tables (Linear is source of truth, system is stateless)
- No new npm dependencies (uses built-in fetch and curl)
