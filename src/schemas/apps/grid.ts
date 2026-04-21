import { z } from "zod";
import { FormItemSchema } from "../common.js";

export const GridItemSchema = z.object({
  rowId: z.string().nullable().optional(),
  fields: z.array(FormItemSchema),
});
export type GridItem = z.infer<typeof GridItemSchema>;

export const GridAppDataSchema = z.object({
  appName: z.string(),
  gridData: z.array(GridItemSchema),
});

export const FormGridDataSchema = z.object({
  form: z.array(FormItemSchema),
  grid: z.array(GridItemSchema),
});
