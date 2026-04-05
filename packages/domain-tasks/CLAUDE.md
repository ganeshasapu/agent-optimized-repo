# packages/domain-tasks

Task management domain. Owns the `/tasks` route namespace.

## Routes
- `/tasks` — Task listing page (filterable by status and priority)
- `/tasks/[id]` — Task detail page with comments

## Database Tables
- `tasks` (defined in `packages/db/src/schema/tasks.ts`)
- `task_comments` (defined in `packages/db/src/schema/tasks.ts`)

## Key Rules
- Task business logic lives in `src/services/task.service.ts`
- Comment business logic lives in `src/services/comment.service.ts`
- Server actions in `src/actions/` — validate with Zod schemas from `src/lib/validations.ts`
- Types derived from DB schema using Drizzle's `InferSelectModel`
- Tests: unit tests mock DB, integration tests need DATABASE_URL
