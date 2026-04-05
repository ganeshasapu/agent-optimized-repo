import type { InferSelectModel } from "drizzle-orm";
import type { projects } from "@biarritz/db/schema";

export type Project = InferSelectModel<typeof projects>;

export interface CreateProjectInput {
  name: string;
  identifier: string;
  description?: string;
  ownerId: string;
}
