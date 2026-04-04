"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "../services/project.service";
import { createProjectSchema, updateProjectSchema } from "../lib/validations";

export async function createProjectAction(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string | null) ?? undefined,
    status: (formData.get("status") as string | null) ?? undefined,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const project = await projectService.create(parsed.data);
  revalidatePath("/projects");
  return { success: true as const, data: project };
}

export async function updateProjectAction(id: string, formData: FormData) {
  const raw = {
    name: (formData.get("name") as string | null) ?? undefined,
    description: (formData.get("description") as string | null) ?? undefined,
    status: (formData.get("status") as string | null) ?? undefined,
  };

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const project = await projectService.update(id, parsed.data);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true as const, data: project };
}

export async function deleteProjectAction(id: string) {
  const project = await projectService.delete(id);
  revalidatePath("/projects");
  return { success: true as const, data: project };
}
