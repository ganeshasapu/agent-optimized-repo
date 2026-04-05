import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  ownerId: z.string().uuid("Invalid owner ID"),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Title is required").max(255),
  status: z.string().optional().default("todo"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
});
