import { z } from "zod";
import { UserSchema } from "./common.js";

export const MasterDataResultSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  fieldType: z.string(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
  active: z.boolean().optional(),
  syncAllFolders: z.boolean().optional(),
  masterFolders: z.array(z.string()).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type MasterDataResult = z.infer<typeof MasterDataResultSchema>;

export const FolderFieldResultSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  fieldType: z.string(),
  active: z.boolean().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type FolderFieldResult = z.infer<typeof FolderFieldResultSchema>;
