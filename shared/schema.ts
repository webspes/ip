import { z } from "zod";

export const generateNamesRequestSchema = z.object({
  topic: z.string().min(1, "Instructions/Topic is required"),
  count: z.number().min(1).max(100).default(5),
});

export type GenerateNamesRequest = z.infer<typeof generateNamesRequestSchema>;
