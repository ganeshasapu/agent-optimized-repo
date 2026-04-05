import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { users } from "./users";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
