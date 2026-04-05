import { eq } from "drizzle-orm";

import { getDb, taskComments } from "@biarritz/db";

import type { CreateCommentInput } from "../types/index";

export const commentService = {
  async listByTaskId(taskId: string) {
    const db = getDb();
    return db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));
  },

  async create(input: CreateCommentInput) {
    const db = getDb();
    const result = await db.insert(taskComments).values(input).returning();
    return result[0]!;
  },
};
