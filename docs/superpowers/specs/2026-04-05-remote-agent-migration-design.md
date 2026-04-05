# Remote Agent Migration Design

Migrate the agent system from headless `claude -p` to cloud-based `claude --remote`, shifting from orchestrator-driven to agent-autonomous architecture.

## Context

The current system uses GitHub Actions as a heavy orchestrator: it sets up environments, runs `claude -p` synchronously, captures stdout, parses JSON output, creates PRs, updates Linear, handles retries, and cleans up resources. Each workflow runs for up to 45 minutes on a GitHub Actions runner.

`claude --remote` is fundamentally different — it's fire-and-forget. The session runs asynchronously in Anthropic's cloud, clones the repo via GitHub, and reads CLAUDE.md/AGENTS.md automatically. This means GitHub Actions can no longer orchestrate post-agent steps by waiting for output.

## Architecture

### Before (Orchestrator-Driven)

```
Linear webhook → GitHub Actions (orchestrator)
  ├── Setup Neon branch
  ├── Build prompt (inject CLAUDE.md, AGENTS.md, ticket)
  ├── Run claude -p (synchronous, 45 min)
  ├── Parse JSON output
  ├── Create PR
  ├── Update Linear
  ├── Create follow-up tickets
  ├── Run automated reviewer
  └── Cleanup Neon branch
```

### After (Agent-Autonomous)

```
Linear webhook → GitHub Actions (thin dispatcher)
  ├── Fetch ticket from Linear
  ├── Create Neon branch
  ├── Build lean prompt (ticket data + DATABASE_URL only)
  └── Fire claude --remote → exit

Agent (in Anthropic cloud):
  ├── Reads AGENTS.md from repo (auto)
  ├── Evaluates ticket → decompose or implement
  ├── Creates branch, implements, tests, commits, pushes
  ├── Creates PR via gh pr create
  ├── Creates follow-up tickets via Linear API (if any)
  └── OR requests clarification via Linear API and exits

PR opened → GitHub Actions (event-driven)
  ├── Updates Linear ticket to "In Review"
  ├── Posts "PR created" comment on Linear
  └── Runs automated reviewer (claude -p, read-only)

PR closed → GitHub Actions (event-driven)
  ├── Deletes associated Neon branch
  └── Optionally moves Linear ticket to "Done" (if merged)
```

## Dispatch Workflows

Three workflows remain. Each becomes a thin dispatcher: fetch context, fire `claude --remote`, exit.

### linear-agent.yml (Implementation)

- **Trigger**: `repository_dispatch: linear-ticket`
- **Steps**:
  1. Fetch full ticket from Linear GraphQL API
  2. Create Neon database branch and run migrations → get `DATABASE_URL`
  3. Fetch existing tickets list (for dedup)
  4. Build lean prompt via `build-agent-prompt.sh` (ticket data + DATABASE_URL + branch name)
  5. `claude --remote "$PROMPT"` → fire and exit
- **Removed**: Node/pnpm setup, Claude installation, output parsing, retry logic, PR creation, Linear updates, follow-up ticket creation, Neon cleanup, reviewer

### agent-revision.yml (Review Feedback)

- **Trigger**: `pull_request_review: changes_requested`
- **Steps**:
  1. Guards: only `linear/*` branches, not bot reviews, max 2 revisions
  2. Extract ticket identifier from PR
  3. Gather review body + inline comments
  4. Build lean prompt (ticket ID + review feedback)
  5. `claude --remote "$PROMPT"` → fire and exit
- **Removed**: Checkout, Node/pnpm setup, Claude installation, push step, PR comment, Linear update

### agent-fix.yml (@agent Comments)

- **Trigger**: `repository_dispatch: linear-agent-fix`
- **Steps**:
  1. Fetch ticket from Linear
  2. Determine branch name (find existing or compute new)
  3. Build lean prompt via `build-fix-prompt.sh` (ticket + instructions + branch name)
  4. `claude --remote "$PROMPT"` → fire and exit
- **Removed**: Checkout, Node/pnpm setup, Claude installation, PR context gathering, push step, PR creation, Linear update

## Event-Driven Workflows (New)

### agent-pr-opened.yml

- **Trigger**: `on: pull_request [opened]` — filtered to `linear/*` branches
- **Steps**:
  1. Extract ticket identifier from branch name (e.g., `linear/AGE-42-add-users` → `AGE-42`)
  2. Look up ticket ID via Linear GraphQL API
  3. Move ticket to "In Review" status
  4. Post comment on Linear: "PR created: <pr_url>"
  5. Build reviewer prompt via `build-reviewer-prompt.sh`
  6. Run automated reviewer with `claude -p` (read-only, structured output posted as PR review)

### agent-pr-closed.yml

- **Trigger**: `on: pull_request [closed]` — filtered to `linear/*` branches
- **Steps**:
  1. Extract Neon branch identifier from the PR body (the dispatch workflow embeds the Neon branch ID in the PR body template, e.g., in a hidden HTML comment `<!-- neon-branch: agent-12345 -->`)
  2. Delete the associated Neon branch via Neon API
  3. If PR was merged, move the Linear ticket to "Done" status

## AGENTS.md Restructure

AGENTS.md becomes the primary instruction source for all agent sessions. `claude --remote` reads it automatically from the repo.

### New Sections

**Self-sufficiency instructions:**
- Create branch `linear/<TICKET-ID>-<slug>`
- Implement, commit, push to origin
- Create PR via `gh pr create` with standard template:
  - Linear ticket link: `[<ID>](https://linear.app/issue/<ID>)`
  - Neon branch ID as HTML comment: `<!-- neon-branch: <id> -->` (for cleanup on PR close)
  - Summary, changes, testing sections
  - Marker: `*Automated by Linear Agent workflow*`

**Decomposition (replaces linear-decompose.yml):**
- Before implementing, evaluate: would this ticket produce a PR that's logical and easy to review?
- If not, break it into sub-tickets that each make sense as their own PR
- Create sub-tickets via `curl` to Linear GraphQL API using helpers in `scripts/lib/linear.sh`
- Set sub-tickets to "Todo" status to trigger new agents
- Update parent ticket to "Decomposed" status
- Exit without creating a branch or implementing

**Needs clarification:**
- If the ticket is genuinely ambiguous (contradictory requirements, missing critical design decisions, references unavailable resources)
- Post a comment on Linear with specific questions via `curl` to Linear GraphQL API
- Move ticket to "Needs Clarification" status
- Exit without creating a branch or implementing

**Follow-up tickets:**
- If the agent discovers unrelated bugs, missing tests, or improvements during implementation
- Check the existing tickets list (provided in the prompt) to avoid duplicates
- Create new tickets via Linear API for genuinely new issues

### Removed Sections

- Output JSON format (`status`, `summary`, `branch`, `follow_ups` block) — no one parses it
- Retry/0-commits contract — no external orchestrator checking
- `/tmp/pr-description.md` convention — agent creates PR directly
- References to "the workflow will automatically create a PR" — agent does it

### Unchanged Sections

- Standard workflow (setup, develop, verify)
- Database change procedures
- Testing requirements (unit + integration)
- Domain rules
- Commit conventions
- Creating a new domain package
- Adding a database table

## Prompt Templates

### build-agent-prompt.sh (Simplified)

Inputs: `<ticket_json_file>`

Template (~30 lines):
```
You have been assigned a Linear ticket to implement.

## Ticket
- ID: <identifier>
- Title: <title>
- Description: <description>
- Labels: <labels>
- Priority: <priority>
- Comments: <comments>

## Attached Images
<image URLs if any>

## Environment
- DATABASE_URL: <neon branch url>
- Neon branch ID: <neon branch id> (include in PR body as `<!-- neon-branch: <id> -->`)
- Branch name: linear/<ID>-<slug>

## Existing Tickets
<list of open tickets for dedup>

Read AGENTS.md for full workflow instructions.
```

No CLAUDE.md injection, no AGENTS.md injection, no quality checklist, no output format instructions, no retry instructions.

### build-fix-prompt.sh (Simplified)

Inputs: `<ticket_json_file> <instructions>`

Template:
```
A team member has asked you to make changes on an existing ticket.

## Ticket
- ID: <identifier>
- Title: <title>

## Instructions from Team Member
<the @agent comment text>

## Branch
linear/<ID>-<slug>

Read AGENTS.md for full workflow instructions.
```

### build-reviewer-prompt.sh (Unchanged)

Stays as-is — still used by `agent-pr-opened.yml` with `claude -p`.

### build-decompose-prompt.sh (Deleted)

No longer needed.

## Cloud Environment Configuration

Configured via claude.ai/code settings:

**Environment variables:**
- `LINEAR_API_KEY` — for decomposition, clarification, follow-up ticket creation
- `LINEAR_TEAM_ID` — for creating tickets in the right team
- `LINEAR_STATUS_NEEDS_CLARIFICATION` — status ID for clarification flow
- `LINEAR_STATUS_DECOMPOSED` — status ID for decomposed tickets
- `LINEAR_STATUS_TODO` — status ID for triggering sub-agents

**Not needed in cloud:**
- `NEON_API_KEY` / `NEON_PROJECT_ID` — Neon branch created by GitHub Actions, DATABASE_URL passed in prompt
- `ANTHROPIC_API_KEY` — sessions run on Anthropic infrastructure
- `GITHUB_TOKEN` — available automatically via GitHub repo connection

**Setup script:** `pnpm install --frozen-lockfile`

**CLI tools needed:**
- `gh` — for PR creation (should be available by default)
- `pnpm` + Node 22 — for building/testing

## Files Summary

### Deleted
- `.github/workflows/linear-decompose.yml`
- `scripts/build-decompose-prompt.sh`

### Added
- `.github/workflows/agent-pr-opened.yml`
- `.github/workflows/agent-pr-closed.yml`

### Modified (Simplified)
- `.github/workflows/linear-agent.yml` — thin dispatcher
- `.github/workflows/agent-revision.yml` — thin dispatcher
- `.github/workflows/agent-fix.yml` — thin dispatcher
- `scripts/build-agent-prompt.sh` — lean prompt (~30 lines)
- `scripts/build-fix-prompt.sh` — lean prompt
- `AGENTS.md` — restructured as primary instruction source

### Unchanged
- `.github/workflows/migration-reconcile.yml` (if exists)
- `scripts/build-reviewer-prompt.sh`
- `scripts/lib/linear.sh`
- `scripts/lib/neon.sh`
- `scripts/lib/common.sh`
- `scripts/agent-verify.sh`
- `scripts/agent-setup.sh`
- `scripts/agent-teardown.sh`
- `CLAUDE.md`
