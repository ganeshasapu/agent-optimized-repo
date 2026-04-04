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

## Rules for Agents

- **Stay in your domain**: Only modify files in your assigned `packages/domain-*` and its route re-exports in `apps/web/app/(domains)/`
- **Do not modify shared packages** (`packages/db`, `packages/ui`, `packages/shared`) without explicit instruction
- **Run `pnpm agent:check`** after every significant change
- **Run `pnpm agent:verify`** before submitting work
- **Never commit `.env.local`** or `.neon-branch-id`
- **Use scoped test runs** during development: `pnpm --filter=@biarritz/domain-X test`
