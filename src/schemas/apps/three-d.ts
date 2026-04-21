import { z } from "zod";
import { UserSchema } from "../common.js";

// --- 3D Style ---

export const Style3DVersionSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  version: z.number().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().nullable().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().nullable().optional(),
  colorways: z.array(z.record(z.string(), z.unknown())).optional(),
  workingFiles: z.array(z.object({
    id: z.string(),
    origin: z.string().nullable().optional(),
    fileName: z.string().nullable().optional(),
  })).optional(),
  materials: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export const Style3DDataSchema = z.object({
  versions: z.array(Style3DVersionSchema).optional(),
}).passthrough();

// --- Material 3D ---

export const Material3DAssetSchema = z.object({
  id: z.string(),
  fileName: z.string().nullable().optional(),
  fileLength: z.number().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  originExtension: z.string().nullable().optional(),
  isGroupMaterial: z.boolean().optional(),
  browzwearType: z.string().nullable().optional(),
}).passthrough();

export const Material3DAssetsSchema = z.object({
  colorwayId: z.string().nullable().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().nullable().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().nullable().optional(),
  assets3D: z.array(Material3DAssetSchema).optional(),
  packages: z.record(z.string(), z.unknown()).nullable().optional(),
  textures: z.object({
    front: z.array(z.record(z.string(), z.unknown())).optional(),
    back: z.array(z.record(z.string(), z.unknown())).optional(),
  }).nullable().optional(),
  previews: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export const Material3DDataSchema = z.object({
  assets: z.array(Material3DAssetsSchema).optional(),
}).passthrough();
