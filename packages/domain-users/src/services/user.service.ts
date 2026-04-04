import { eq } from "drizzle-orm";
import { getDb, users } from "@biarritz/db";

import type { CreateUserInput, UpdateUserInput } from "../types/index";

export const userService = {
  async list() {
    const db = getDb();
    return db.select().from(users);
  },

  async getById(id: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] ?? null;
  },

  async create(input: CreateUserInput) {
    const db = getDb();
    const result = await db.insert(users).values(input).returning();
    return result[0]!;
  },

  async update(id: string, input: UpdateUserInput) {
    const db = getDb();
    const result = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const db = getDb();
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result[0] ?? null;
  },
};
