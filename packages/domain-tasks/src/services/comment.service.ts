import { eq } from "drizzle-orm";

import { getDb, taskComments, users } from "@biarritz/db";

import type { CreateCommentInput, TaskCommentWithAuthor } from "../types/index";

export const commentService = {
  async create(input: CreateCommentInput): Promise<TaskCommentWithAuthor> {
    const db = getDb();
    const [comment] = await db.insert(taskComments).values(input).returning();
    const rows = await db
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        authorId: taskComments.authorId,
        body: taskComments.body,
        createdAt: taskComments.createdAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.authorId, users.id))
      .where(eq(taskComments.id, comment!.id));
    return rows[0]!;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(taskComments).where(eq(taskComments.id, id));
  },
};
