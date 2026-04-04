import { eq } from "drizzle-orm";
import { getDb, projects } from "@biarritz/db";

import type { CreateProjectInput } from "../types/index";

export const projectService = {
  async getProjects() {
    const db = getDb();
    return db.select().from(projects);
  },

  async getProjectById(id: string) {
    const db = getDb();
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0] ?? null;
  },

  async createProject(input: CreateProjectInput) {
    const db = getDb();
    const result = await db.insert(projects).values(input).returning();
    return result[0]!;
  },

  async deleteProject(id: string) {
    const db = getDb();
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result[0] ?? null;
  },
};
