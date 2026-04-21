import { z } from "zod";
import { FolderSchema, FormItemSchema, ImageSchema, UserSchema } from "./common.js";

export const ImageVariationSchema = z.object({
  id: z.string(),
  number: z.string().optional(),
  name: z.string().optional(),
  sourceFile: z.string().optional(),
  preview: z.string().optional(),
});

/** preview can be a string URL or an Image object { preview, origin } */
export const ImageDataSchema = z.object({
  fields: z.array(FormItemSchema),
  preview: z.union([z.string(), ImageSchema]).nullable().optional(),
  variations: z.array(ImageVariationSchema).nullable().optional(),
}).passthrough();

export const ImageHeaderSchema = z.object({
  id: z.string(),
  headerNumber: z.string(),
  headerName: z.string(),
  folder: FolderSchema,
  headerData: ImageDataSchema,
  files: z.array(z.string()).nullable().optional(),
  isDeleted: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type ImageHeader = z.infer<typeof ImageHeaderSchema>;
