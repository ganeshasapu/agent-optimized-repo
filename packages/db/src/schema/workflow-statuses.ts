import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const workflowStatusTypeEnum = pgEnum("workflow_status_type", [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
]);

export const workflowStatuses = pgTable("workflow_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull(),
  type: workflowStatusTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
