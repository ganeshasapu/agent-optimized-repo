"use server";

import { revalidatePath } from "next/cache";

import { commentService } from "../services/comment.service";
import { taskService } from "../services/task.service";
import { createCommentSchema, updateTaskSchema } from "../lib/validations";

export async function updateTaskStatusAction(formData: FormData): Promise<void> {
  const taskId = formData.get("taskId") as string;
  if (!taskId) return;

  const raw = {
    status: formData.get("status") as string,
  };

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) return;

  await taskService.update(taskId, parsed.data);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
}

export async function addCommentAction(formData: FormData): Promise<void> {
  const raw = {
    taskId: formData.get("taskId") as string,
    authorId: formData.get("authorId") as string,
    body: formData.get("body") as string,
  };

  const parsed = createCommentSchema.safeParse(raw);
  if (!parsed.success) return;

  await commentService.create(parsed.data);
  revalidatePath(`/tasks/${raw.taskId}`);
}
