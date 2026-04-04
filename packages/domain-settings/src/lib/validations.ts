import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
});

export const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AppearanceInput = z.infer<typeof appearanceSchema>;
