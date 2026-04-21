import { z } from "zod";
import { UserSchema } from "../common.js";

export const RevisionItemSchema = z.object({
  id: z.string(),
  body: z.string().nullable().optional(),
  from: UserSchema.nullable().optional(),
  createdDate: z.string().nullable().optional(),
}).passthrough();
