import type { InferSelectModel } from "drizzle-orm";

import type { projects } from "@biarritz/db";

export type Project = InferSelectModel<typeof projects>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: "active" | "archived";
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: "active" | "archived";
}
