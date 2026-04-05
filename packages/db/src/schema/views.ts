import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { users } from "./users";

export const views = pgTable("views", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  filters: jsonb("filters").notNull().default({}),
  sort: jsonb("sort").notNull().default({}),
  groupBy: text("group_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
