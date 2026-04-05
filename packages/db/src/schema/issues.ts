import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { users } from "./users";

export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
