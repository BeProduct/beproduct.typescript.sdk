import { z } from "zod";
import { FormItemSchema, UserSchema } from "./common.js";

export const DataTableResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type DataTableResult = z.infer<typeof DataTableResultSchema>;

export const DataTableRowResultSchema = z.object({
  id: z.string(),
  fields: z.array(FormItemSchema).optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type DataTableRowResult = z.infer<typeof DataTableRowResultSchema>;
