"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "../services/project.service";
import { createProjectSchema } from "../lib/validations";

export async function createProjectAction(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    identifier: formData.get("identifier") as string,
    description: (formData.get("description") as string) || undefined,
    ownerId: formData.get("ownerId") as string,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const project = await projectService.createProject(parsed.data);
  revalidatePath("/projects");
  return { success: true as const, data: project };
}

export async function deleteProjectAction(id: string) {
  const project = await projectService.deleteProject(id);
  revalidatePath("/projects");
  return { success: true as const, data: project };
}
