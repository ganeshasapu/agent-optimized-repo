import { eq } from "drizzle-orm";

import { getDb, projects } from "@biarritz/db";

import type { CreateProjectInput, UpdateProjectInput } from "../types/index";

export const projectService = {
  async list() {
    const db = getDb();
    return db.select().from(projects);
  },

  async getById(id: string) {
    const db = getDb();
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return result[0] ?? null;
  },

  async create(input: CreateProjectInput) {
    const db = getDb();
    const result = await db.insert(projects).values(input).returning();
    return result[0]!;
  },

  async update(id: string, input: UpdateProjectInput) {
    const db = getDb();
    const result = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const db = getDb();
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return result[0] ?? null;
  },
};
