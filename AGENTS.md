# Agent Workflow Guide

This document describes how autonomous coding agents should work in this repository.

## Standard Workflow

### 1. Start
```bash
pnpm agent:setup
```
This creates your isolated Neon database branch, runs migrations, and starts the dev server. You now have a fully isolated environment — no conflicts with other agents or the main branch.

### 2. Develop
Work within your assigned domain package (`packages/domain-*`). Follow the structure in the domain's CLAUDE.md.

Run quick checks frequently:
```bash
pnpm agent:check
```

### 3. Verify
Before creating a PR, run the full pipeline:
```bash
pnpm agent:verify
```
All four steps must pass: typecheck, lint, test, build.

### 4. Clean Up
```bash
pnpm agent:teardown
```

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
3. Run `pnpm db:generate` to create a migration
4. Run `pnpm db:migrate` to apply it
5. Never edit generated migration SQL files

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

## CI Failure Retry

If your implementation fails `pnpm agent:verify`, the workflow will automatically retry once:

1. The error output from the failed verification is captured
2. A retry prompt is built with: original task + your diff + the error output
3. A second agent run attempts to fix the verification errors
4. If the retry also fails, the ticket is marked as failed in Linear

This means you should always output a proper status JSON — even on failure — so the workflow can detect and retry.

## Automated Review

After a PR is created, an automated reviewer agent analyzes your changes against:
- Scope compliance (stayed within assigned domain)
- Design system compliance (if UI changes)
- Code quality (imports, naming, validation)
- Test coverage
- Ticket completeness

The review is advisory and does not block merging. Address FAIL items before requesting human review.

## Review-to-Revision Loop

When a human reviewer submits "changes requested" on an agent PR:
1. A revision agent reads the review comments
2. It addresses each comment and pushes fixes to the same branch
3. Maximum 2 automatic revisions per PR
4. After 2 revisions, further changes require manual implementation

## Ticket Decomposition

Large tickets can be automatically broken into smaller sub-tickets:

1. Move a ticket to "Decompose" status in Linear
2. A decomposition agent analyzes the ticket and codebase structure
3. If decomposition is warranted, sub-tickets are created as children of the parent
4. Each sub-ticket is scoped to a single domain, ordered by dependencies
5. The parent moves to "Decomposed" status
6. Sub-tickets are set to "Todo", triggering implementation agents for each one

### When tickets get decomposed
- They touch multiple domain packages
- They have 3+ distinct requirements
- They require both schema changes and UI work across domains

### Sub-ticket completion
- Each sub-ticket is implemented independently by its own agent
- Linear's built-in auto-close handles parent completion when all children are done

## Database Changes

Agents have a Neon database branch in CI — a fully isolated copy-on-write fork of production. You can create, test, and deploy schema changes autonomously.

### Adding or modifying a table
1. Create/edit the schema file in `packages/db/src/schema/<table>.ts`
2. Export it from `packages/db/src/schema/index.ts`
3. Generate the migration: `cd packages/db && npx drizzle-kit generate`
4. Apply it to your Neon branch: `cd packages/db && npx drizzle-kit migrate`
5. Write services and tests that use the new schema
6. `pnpm agent:verify` will validate the migration applies cleanly

### Rules
- Never edit generated migration SQL files
- Always generate migrations after schema changes — don't skip this step
- Migrations are auto-applied to production when your PR merges to main
- `DATABASE_URL` is set in your environment — use `getDb()` from `@biarritz/db`

## Rules for Agents

- **Stay in your domain**: Only modify files in your assigned `packages/domain-*` and its route re-exports in `apps/web/app/(domains)/`
- **Database changes are allowed**: You MAY modify `packages/db/src/schema/` and generate migrations when your ticket requires schema changes
- **Do not modify UI or shared packages** (`packages/ui`, `packages/shared`) without explicit instruction
- **Run `pnpm agent:check`** after every significant change
- **Run `pnpm agent:verify`** before submitting work
- **Never commit `.env.local`** or `.neon-branch-id`
- **Use scoped test runs** during development: `pnpm --filter=@biarritz/domain-X test`
