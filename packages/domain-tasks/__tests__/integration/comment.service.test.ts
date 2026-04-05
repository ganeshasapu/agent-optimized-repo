import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("commentService integration", () => {
  it("listByTaskId() returns comments for a task", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const { commentService } = await import("../../src/services/comment.service");

    // Need a user for authorId — fetch the first available
    const { getDb, users } = await import("@biarritz/db");
    const db = getDb();
    const [user] = await db.select().from(users).limit(1);

    if (!user) {
      // Skip if no users exist in the branch
      return;
    }

    const task = await taskService.create({ title: "Comment integration test" });
    const comment = await commentService.create({
      taskId: task.id,
      authorId: user.id,
      body: "Integration comment",
    });

    const comments = await commentService.listByTaskId(task.id);
    expect(comments.some((c) => c.id === comment.id)).toBe(true);

    // cleanup — delete comment first due to FK constraint
    const { taskComments } = await import("@biarritz/db");
    const { eq } = await import("drizzle-orm");
    await db.delete(taskComments).where(eq(taskComments.id, comment.id));
    await taskService.delete(task.id);
  });
});
