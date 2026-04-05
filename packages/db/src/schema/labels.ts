import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const labels = pgTable("labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
