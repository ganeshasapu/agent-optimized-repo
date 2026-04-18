# Biarritz — Agent Development Guide

## Quick Reference

- **Stack**: Next.js 15 (App Router), Drizzle ORM, Neon PostgreSQL, Tailwind CSS v4, shadcn/ui, TypeScript
- **Monorepo**: Turborepo with pnpm workspaces
- **Node**: 22+ (see .nvmrc)

## Commands

### Agent Workflow
- `pnpm agent:setup` — Create isolated dev environment (Neon branch + dev server)
- `pnpm agent:verify` — Full pipeline: typecheck -> lint -> test -> build
- `pnpm agent:check` — Quick check: typecheck + lint only
- `pnpm agent:teardown` — Clean up Neon branch + stop dev server

### Development
- `pnpm dev` — Start all dev servers
- `pnpm build` — Build all packages
- `pnpm typecheck` — TypeScript checking across all packages
- `pnpm lint` — ESLint across all packages
- `pnpm test` — Run all Vitest tests
- `pnpm test:momentic` — Run full Momentic e2e suite (requires dev server on :3000 + `MOMENTIC_API_KEY`)
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Run migrations

### Scoped Commands
- `pnpm --filter=@biarritz/domain-users test` — Run tests for one domain
- `pnpm --filter=@biarritz/web dev` — Dev server for web only

### Linear Integration
- Linear tickets trigger agents via webhook → GitHub Actions → `claude --remote`
- Webhook endpoint: `apps/web/app/api/webhooks/linear/route.ts`
- Dispatch workflows: `.github/workflows/linear-agent.yml`, `.github/workflows/agent-fix.yml`
- Event-driven workflows: `.github/workflows/agent-pr-opened.yml`, `.github/workflows/agent-pr-closed.yml`
- Agent revision: `.github/workflows/agent-revision.yml` — auto-addresses "changes requested" review feedback on agent PRs (max 2 revisions)
- Prompt builders: `scripts/build-agent-prompt.sh`, `scripts/build-fix-prompt.sh`, `scripts/build-reviewer-prompt.sh`
- Linear API helpers: `scripts/lib/linear.sh`
- Agents run autonomously via `claude --remote` — they read AGENTS.md from the repo for all workflow instructions

## Architecture

### Package Dependency Graph
```
apps/web
  ├── @biarritz/ui
  ├── @biarritz/db
  ├── @biarritz/shared
  └── @biarritz/domain-*
        ├── @biarritz/ui
        ├── @biarritz/db
        └── @biarritz/shared
```

### Domain Packages

Each domain (`packages/domain-*`) is a self-contained feature boundary:
- `src/routes/` — Page components (re-exported by apps/web)
- `src/components/` — Domain-specific React components
- `src/services/` — Business logic (database queries, data processing)
- `src/actions/` — Next.js Server Actions
- `src/types/` — TypeScript types for this domain
- `src/lib/` — Validation schemas (Zod), domain utilities
- `__tests__/unit/` — Unit tests (mocked DB)
- `__tests__/integration/` — Integration tests (real Neon branch DB)
- `__tests__/fixtures/` — Test data

### Adding a New Route from a Domain

1. Create the page component in `packages/domain-X/src/routes/`
2. Re-export from `apps/web/app/(domains)/` with a one-line file:
   ```tsx
   export { default } from "@biarritz/domain-X/routes/page";
   ```
3. Add `@biarritz/domain-X` to `apps/web/package.json` dependencies
4. Add `@biarritz/domain-X` to `transpilePackages` in `apps/web/next.config.ts`

## Conventions

### TypeScript
- Strict mode everywhere (`noUncheckedIndexedAccess: true`)
- Use `type` imports: `import type { Foo } from "./bar.js"`
- Use extensionless imports for relative files (`"./utils"` not `"./utils.js"`)

### Naming
- Files: kebab-case (`user-service.ts`, `user-card.tsx`)
- Types/Interfaces: PascalCase (`UserProfile`, `CreateUserInput`)
- Functions/variables: camelCase (`getUserById`, `isActive`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`)
- Database tables: snake_case (`user_profiles`)

### Imports
- External packages first, then internal packages, then relative imports
- Always separate groups with blank lines
- Use package imports (`@biarritz/db`) not relative paths across packages

### Testing
- Unit tests mock the database via `vi.mock("@biarritz/db", ...)`
- Integration tests use `describe.skipIf(!process.env.DATABASE_URL)` guard
- Test files match source: `user.service.ts` -> `user.service.test.ts`

### E2E (Momentic)
- Tests live at `e2e/momentic/*.test.yaml` and run in Chromium against a dev server
- A Momentic MCP server is wired via `.mcp.json` — agents author tests via `momentic_test_create` / `momentic_test_edit` tools
- `pnpm agent:verify` runs the touched `.test.yaml` files only; PR CI runs the full suite (`--parallel 5`, step-cache on)
- Requires `MOMENTIC_API_KEY` in env (local `.env.local`; GitHub secret in CI)
- See `AGENTS.md` → "E2E testing with Momentic" for the full authoring workflow

### Database
- All schema changes go in `packages/db/src/schema/`
- After schema changes: `cd packages/db && npx drizzle-kit generate` then `cd packages/db && npx drizzle-kit migrate`
- Do NOT use `pnpm db:generate` / `pnpm db:migrate` — they don't pass `DATABASE_URL` in CI
- Never modify existing migration files
- Use `getDb()` from `@biarritz/db` — never construct clients directly

### Components
- Use `@biarritz/ui` for base components (Button, Input, Card, etc.)
- Domain components live in `packages/domain-X/src/components/`
- Always use the `cn()` utility from `@biarritz/ui` for className merging
