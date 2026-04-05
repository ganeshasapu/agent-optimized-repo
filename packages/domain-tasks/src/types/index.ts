import type { InferSelectModel } from "drizzle-orm";

import type { taskComments, tasks } from "@biarritz/db";

export type Task = InferSelectModel<typeof tasks>;
export type TaskComment = InferSelectModel<typeof taskComments>;

export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
}

export interface CreateCommentInput {
  taskId: string;
  authorId: string;
  body: string;
}
