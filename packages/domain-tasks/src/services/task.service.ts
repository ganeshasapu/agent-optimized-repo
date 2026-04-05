import { eq } from "drizzle-orm";

import { getDb, projects, taskComments, tasks, users } from "@biarritz/db";

import type { CreateTaskInput, TaskCommentWithAuthor, TaskWithRelations, UpdateTaskInput } from "../types/index";

export const taskService = {
  async list(): Promise<TaskWithRelations[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        projectId: tasks.projectId,
        assigneeId: tasks.assigneeId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        assigneeName: users.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id));
    return rows;
  },

  async getById(id: string): Promise<TaskWithRelations | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        projectId: tasks.projectId,
        assigneeId: tasks.assigneeId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        assigneeName: users.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.id, id));
    return rows[0] ?? null;
  },

  async getComments(taskId: string): Promise<TaskCommentWithAuthor[]> {
    const db = getDb();
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
      .where(eq(taskComments.taskId, taskId));
    return rows;
  },

  async create(input: CreateTaskInput): Promise<TaskWithRelations> {
    const db = getDb();
    const [task] = await db.insert(tasks).values(input).returning();
    const result = await taskService.getById(task!.id);
    return result!;
  },

  async update(id: string, input: UpdateTaskInput): Promise<TaskWithRelations | null> {
    const db = getDb();
    await db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, id));
    return taskService.getById(id);
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(tasks).where(eq(tasks.id, id));
  },
};
