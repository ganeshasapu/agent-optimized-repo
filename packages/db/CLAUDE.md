# packages/db

Database layer: Drizzle ORM + Neon PostgreSQL.

## Key Rules
- Schema files go in `src/schema/` — one file per table
- Always re-export new tables from `src/schema/index.ts`
- Use `getDb()` factory — supports Neon branch isolation via optional URL param
- Never modify generated migration SQL files
- Use Drizzle's type inference: `InferSelectModel<typeof tableName>`

## Schema Change Workflow
```bash
# 1. Create/edit schema in src/schema/<table>.ts
# 2. Export from src/schema/index.ts
# 3. Generate migration
cd packages/db && npx drizzle-kit generate
# 4. Apply migration to your Neon branch
cd packages/db && npx drizzle-kit migrate
```

Do NOT use `pnpm db:generate` / `pnpm db:migrate` — those Turborepo commands don't pass `DATABASE_URL` correctly in CI.

## Schema Patterns

### Basic table
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const things = pgTable("things", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Foreign key reference
```typescript
import { users } from "./users";

export const projects = pgTable("projects", {
  // ...
  ownerId: uuid("owner_id").notNull().references(() => users.id),
});
```

## Service Pattern
```typescript
import { getDb, things } from "@biarritz/db";
import { eq } from "drizzle-orm";

const db = getDb();
const all = await db.select().from(things);
const one = await db.select().from(things).where(eq(things.id, id));
```
