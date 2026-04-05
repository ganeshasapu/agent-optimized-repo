"use server";

import { revalidatePath } from "next/cache";

import { createCommentSchema, createTaskSchema, updateTaskSchema } from "../lib/validations";
import { commentService } from "../services/comment.service";
import { taskService } from "../services/task.service";

export async function createTaskAction(formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    status: (formData.get("status") as string) || undefined,
    priority: (formData.get("priority") as string) || undefined,
    projectId: (formData.get("projectId") as string) || undefined,
    assigneeId: (formData.get("assigneeId") as string) || undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const task = await taskService.create(parsed.data);
  revalidatePath("/tasks");
  return { success: true as const, data: task };
}

export async function updateTaskAction(id: string, formData: FormData) {
  const raw = {
    title: (formData.get("title") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    status: (formData.get("status") as string) || undefined,
    priority: (formData.get("priority") as string) || undefined,
    projectId: (formData.get("projectId") as string) || undefined,
    assigneeId: (formData.get("assigneeId") as string) || undefined,
  };

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const task = await taskService.update(id, parsed.data);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return { success: true as const, data: task };
}

export async function createCommentAction(formData: FormData) {
  const raw = {
    taskId: formData.get("taskId") as string,
    authorId: formData.get("authorId") as string,
    body: formData.get("body") as string,
  };

  const parsed = createCommentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const comment = await commentService.create(parsed.data);
  revalidatePath(`/tasks/${raw.taskId}`);
  return { success: true as const, data: comment };
}
