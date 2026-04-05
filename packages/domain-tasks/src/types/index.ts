import type { InferSelectModel } from "drizzle-orm";

import type { taskComments, tasks } from "@biarritz/db";

export type Task = InferSelectModel<typeof tasks>;
export type TaskComment = InferSelectModel<typeof taskComments>;

export type TaskStatus = "todo" | "in_progress" | "done";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  projectId: string;
  assigneeId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
}

export interface CreateCommentInput {
  taskId: string;
  authorId: string;
  body: string;
}

export interface TaskWithRelations extends Task {
  projectName: string;
  assigneeName: string | null;
}

export interface TaskCommentWithAuthor extends TaskComment {
  authorName: string | null;
  authorEmail: string;
}
