import { z } from "zod";

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  integration: z.string().nullable().optional(),
  tagDate: z.string().optional(),
  tagUsers: z.array(z.string()).optional(),
});
export type Tag = z.infer<typeof TagSchema>;
