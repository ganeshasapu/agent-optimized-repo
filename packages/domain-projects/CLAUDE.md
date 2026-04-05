# packages/domain-projects

Project management domain. Owns the `/projects` route namespace.

## Routes
- `/projects` — Project listing page
- `/projects/[id]` — Project detail page

## Database Tables
- `projects` (defined in `packages/db/src/schema/projects.ts`)

## Key Rules
- All project-related business logic lives in `src/services/project.service.ts`
- Server actions in `src/actions/` — validate with Zod schemas from `src/lib/validations.ts`
- Components in `src/components/` — these are domain-specific, not shared
- Types derived from DB schema using Drizzle's `InferSelectModel`
- Tests: unit tests mock DB, integration tests need DATABASE_URL
