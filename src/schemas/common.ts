import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Folder = z.infer<typeof FolderSchema>;

export const FolderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});
export type FolderItem = z.infer<typeof FolderItemSchema>;

export const ImageSchema = z.object({
  preview: z.string(),
  origin: z.string(),
});
export type Image = z.infer<typeof ImageSchema>;

export const FormItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.unknown(),
  type: z.string(),
  required: z.boolean(),
});
export type FormItem = z.infer<typeof FormItemSchema>;

export const SchemaFieldSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  fieldType: z.string(),
  required: z.boolean().optional(),
  active: z.boolean().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type SchemaField = z.infer<typeof SchemaFieldSchema>;

export const MessageResponseSchema = z.object({
  error: z.boolean(),
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const AppPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  marketId: z.string().optional(),
  isSampleApp: z.boolean().optional(),
});
export type AppPage = z.infer<typeof AppPageSchema>;

export function PageResultSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    result: z.array(itemSchema),
    total: z.number(),
  });
}

export const UpdateItemSchema = z.object({
  id: z.string(),
  value: z.unknown(),
});
export type UpdateItem = z.infer<typeof UpdateItemSchema>;

export const GridUpdateItemSchema = z.object({
  rowId: z.string().nullable().optional(),
  rowFields: z.array(UpdateItemSchema).optional(),
  deleteRow: z.boolean().optional(),
});
export type GridUpdateItem = z.infer<typeof GridUpdateItemSchema>;

export const ListUpdateItemSchema = z.object({
  itemId: z.string().nullable().optional(),
  itemFields: z.array(UpdateItemSchema).optional(),
  deleteItem: z.boolean().optional(),
});
export type ListUpdateItem = z.infer<typeof ListUpdateItemSchema>;

/** Fields dict helper: converts { fieldId: value } to [{ id, value }] */
export function fieldsToUpdateItems(
  fields: Record<string, unknown>,
): UpdateItem[] {
  return Object.entries(fields).map(([id, value]) => ({ id, value }));
}

/** A colorway as accepted by create/update: `fields` may be a dict or already-unwound array. */
export interface ColorwayInput {
  /** `null`/omitted → create a new colorway; otherwise the colorway id to update. */
  id?: string | null;
  /** Colorway field values, either as `{ fieldId: value }` or `[{ id, value }]`. */
  fields?: Record<string, unknown> | UpdateItem[];
  [key: string]: unknown;
}

/**
 * Normalize colorways for the create/update body. The API expects each
 * colorway's `fields` as an array of `{ id, value }`, with colour fields
 * (`color_number`, `color_name`, `primary`, …) living *inside* that array.
 * Callers may pass `fields` as a convenient dict (matching the Python SDK);
 * this unwinds it. Colorways without a dict `fields` pass through untouched.
 */
export function normalizeColorways(
  colorways: readonly ColorwayInput[] | undefined,
): unknown[] | undefined {
  if (!colorways) return undefined;
  return colorways.map((cw) => {
    const fields = cw.fields;
    if (fields && !Array.isArray(fields) && typeof fields === "object") {
      return { ...cw, fields: fieldsToUpdateItems(fields as Record<string, unknown>) };
    }
    return cw;
  });
}
