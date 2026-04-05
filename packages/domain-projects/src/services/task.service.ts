import { eq } from "drizzle-orm";
import { getDb, tasks } from "@biarritz/db";

import type { CreateTaskInput } from "../types/index";

export const taskService = {
  async getTasksByProjectId(projectId: string) {
    const db = getDb();
    return db.select().from(tasks).where(eq(tasks.projectId, projectId));
  },

  async createTask(input: CreateTaskInput) {
    const db = getDb();
    const result = await db.insert(tasks).values(input).returning();
    return result[0]!;
  },
};
