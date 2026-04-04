# packages/db

Database layer: Drizzle ORM + Neon PostgreSQL.

## Key Rules
- Schema files go in `src/schema/` — one file per table
- Always re-export new tables from `src/schema/index.ts`
- Use `getDb()` factory — supports Neon branch isolation via optional URL param
- After schema changes: `pnpm db:generate` then `pnpm db:migrate`
- Never modify generated migration SQL files
- Use Drizzle's type inference: `InferSelectModel<typeof tableName>`
