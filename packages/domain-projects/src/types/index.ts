import type { InferSelectModel } from "drizzle-orm";
import type { projects, tasks } from "@biarritz/db/schema";

export type Project = InferSelectModel<typeof projects>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
}

export type Task = InferSelectModel<typeof tasks>;

export interface CreateTaskInput {
  projectId: string;
  title: string;
  status?: string;
  assigneeId?: string;
}
