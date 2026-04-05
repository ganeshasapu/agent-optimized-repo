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
