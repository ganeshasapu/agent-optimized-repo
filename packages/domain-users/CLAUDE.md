# packages/domain-users

User management domain. Owns the `/users` route namespace.

## Routes
- `/users` — User listing page
- `/users/[id]` — User detail page

## Database Tables
- `users` (defined in `packages/db/src/schema/users.ts`)

## Key Rules
- All user-related business logic lives in `src/services/user.service.ts`
- Server actions in `src/actions/` — validate with Zod schemas from `src/lib/validations.ts`
- Components in `src/components/` — these are domain-specific, not shared
- Types derived from DB schema using Drizzle's `InferSelectModel`
- Tests: unit tests mock DB, integration tests need DATABASE_URL
