import { z } from "zod";
import { FormItemSchema } from "../common.js";

export const SkuItemSchema = z.object({
  id: z.string(),
  colorImage: z.string().nullable().optional(),
  skuNumber: z.string().nullable().optional(),
  colorNumber: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  packaging: z.string().nullable().optional(),
  hideSku: z.boolean().optional(),
  comments: z.string().nullable().optional(),
  fields: z.array(FormItemSchema).optional(),
});
export type SkuItem = z.infer<typeof SkuItemSchema>;
