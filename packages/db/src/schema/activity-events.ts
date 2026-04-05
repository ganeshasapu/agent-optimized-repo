import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { issues } from "./issues";
import { users } from "./users";

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  field: text("field"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
