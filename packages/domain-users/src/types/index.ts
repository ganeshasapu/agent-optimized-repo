import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@biarritz/db/schema";

export type User = InferSelectModel<typeof users>;

export interface CreateUserInput {
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}
