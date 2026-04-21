import { z } from "zod";
import { FolderSchema, FormItemSchema, ImageSchema, UserSchema } from "./common.js";

export const BlockSizeClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
  sizeRange: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  sizes: z.array(z.object({
    name: z.string(),
    isSampleSize: z.boolean().optional(),
    hideSize: z.boolean().optional(),
    comments: z.string().nullable().optional(),
  }).passthrough()).optional(),
}).passthrough();

export const BlockDataSchema = z.object({
  fields: z.array(FormItemSchema),
  frontImage: ImageSchema.optional(),
  sizeClasses: z.array(BlockSizeClassSchema).optional(),
});

export const BlockHeaderSchema = z.object({
  id: z.string(),
  headerNumber: z.string(),
  headerName: z.string(),
  folder: FolderSchema,
  headerData: BlockDataSchema,
  isDeleted: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type BlockHeader = z.infer<typeof BlockHeaderSchema>;
