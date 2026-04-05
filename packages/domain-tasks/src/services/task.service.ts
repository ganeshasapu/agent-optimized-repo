import { and, eq } from "drizzle-orm";

import { getDb, tasks } from "@biarritz/db";

import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "../types/index";

export const taskService = {
  async list(filters?: TaskFilters) {
    const db = getDb();
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    return conditions.length > 0
      ? db.select().from(tasks).where(and(...conditions))
      : db.select().from(tasks);
  },

  async getById(id: string) {
    const db = getDb();
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0] ?? null;
  },

  async create(input: CreateTaskInput) {
    const db = getDb();
    const result = await db.insert(tasks).values(input).returning();
    return result[0]!;
  },

  async update(id: string, input: UpdateTaskInput) {
    const db = getDb();
    const result = await db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const db = getDb();
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result[0] ?? null;
  },
};
