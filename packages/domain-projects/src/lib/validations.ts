import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  identifier: z.string().min(1, "Identifier is required").max(10).toUpperCase(),
  description: z.string().max(1000).optional(),
  ownerId: z.string().uuid("Invalid owner ID"),
});
