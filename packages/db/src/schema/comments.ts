import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { issues } from "./issues";
import { users } from "./users";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: text("body").notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  issueId: uuid("issue_id").references(() => issues.id),
  parentId: uuid("parent_id").references((): AnyPgColumn => comments.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
