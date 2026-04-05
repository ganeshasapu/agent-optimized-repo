"use server";

import { revalidatePath } from "next/cache";

import { taskService } from "../services/task.service";
import { createTaskSchema } from "../lib/validations";

export async function createTaskAction(formData: FormData) {
  const raw = {
    projectId: formData.get("projectId") as string,
    title: formData.get("title") as string,
    status: "todo",
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const task = await taskService.createTask(parsed.data);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true as const, data: task };
}
