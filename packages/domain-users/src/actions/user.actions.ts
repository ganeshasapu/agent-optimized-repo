"use server";

import { revalidatePath } from "next/cache";

import { userService } from "../services/user.service";
import { createUserSchema } from "../lib/validations";

export async function createUserAction(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    name: formData.get("name") as string | null,
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const user = await userService.create(parsed.data);
  revalidatePath("/users");
  return { success: true as const, data: user };
}
