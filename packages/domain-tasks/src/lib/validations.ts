import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  status: taskStatusSchema.optional(),
  projectId: z.string().uuid("Invalid project ID"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const createCommentSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  authorId: z.string().uuid("Invalid author ID"),
  body: z.string().min(1, "Comment cannot be empty").max(5000),
});
