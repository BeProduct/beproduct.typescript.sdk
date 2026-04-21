import { z } from "zod";
import { UserSchema } from "../common.js";

export const AttachmentFileDataSchema = z.object({
  fileName: z.string(),
  fileType: z.string().optional(),
  fileSize: z.string().optional(),
  url: z.string().optional(),
  createdBy: UserSchema.nullable().optional(),
  createdAt: z.string().nullable().optional(),
  modifiedBy: UserSchema.nullable().optional(),
  modifiedAt: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
});
export type AttachmentFileData = z.infer<typeof AttachmentFileDataSchema>;

export const AttachmentsDataSchema = z.object({
  files: z.array(AttachmentFileDataSchema),
});
