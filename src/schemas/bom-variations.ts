import { z } from "zod";
import { FormItemSchema, SchemaFieldSchema, UserSchema } from "./common.js";

/** One colourway pitch on a BOM variation row. */
export const BomVariationColorSchema = z.object({
  colorwayId: z.string(),
  hex: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  image: z.unknown().nullable().optional(),
  materialColorwayId: z.string().nullable().optional(),
  colorReference: z.string().nullable().optional(),
  colorSourceId: z.string().nullable().optional(),
});
export type BomVariationColor = z.infer<typeof BomVariationColorSchema>;

/**
 * One BOM variation row. Tenant-configured values arrive in `fields` as a list
 * of {id, value} items — NOT as top-level keys like the classic BOM app.
 */
export const BomVariationRowSchema = z.object({
  rowId: z.string(),
  materialId: z.string().nullable().optional(),
  isAdHoc: z.boolean().default(false),
  materialNumber: z.string().nullable().optional(),
  materialName: z.string().nullable().optional(),
  folderType: z.string().nullable().optional(),
  folderTypeName: z.string().nullable().optional(),
  version: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  sort: z.number().default(0),
  parentRowId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  subAssemblyRowId: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  fields: z.array(FormItemSchema).default([]),
  colors: z.array(BomVariationColorSchema).default([]),
}).passthrough();
export type BomVariationRow = z.infer<typeof BomVariationRowSchema>;

/**
 * Variation-level metadata. `fields` carries tenant metadata fields declared by
 * the app's `BOMVariationsMetadataFields`. Every payload observed in bebrands
 * returned `[]`; the populated shape is assumed to match row `fields`.
 */
export const BomVariationMetadataSchema = z.object({
  id: z.string(),
  variationName: z.string().default(""),
  isDefault: z.boolean().default(false),
  order: z.number().default(0),
  syncColorways: z.boolean().default(false),
  selectedVariationColorways: z.array(z.string()).default([]),
  sizeClasses: z.array(z.unknown()).default([]),
  partners: z.array(z.unknown()).default([]),
  fields: z.array(FormItemSchema).default([]),
}).passthrough();
export type BomVariationMetadata = z.infer<typeof BomVariationMetadataSchema>;

/** A single variation with its rows. */
export const BomVariationSchema = z.object({
  id: z.string(),
  metadata: BomVariationMetadataSchema,
  createdBy: UserSchema.nullable().optional(),
  createdAt: z.string().nullable().optional(),
  modifiedBy: UserSchema.nullable().optional(),
  modifiedAt: z.string().nullable().optional(),
  rows: z.array(BomVariationRowSchema).default([]),
}).passthrough();
export type BomVariation = z.infer<typeof BomVariationSchema>;

/**
 * `GET Style/PageSchema?pageId=` for a BOMVariations app — two field sets.
 * `metadata` is empty when `enableBomVariations` is false.
 */
export const BomVariationsPageSchemaSchema = z.object({
  enableBomVariations: z.boolean().default(false),
  metadata: z.array(SchemaFieldSchema).default([]),
  grid: z.array(SchemaFieldSchema).default([]),
});
export type BomVariationsPageSchema = z.infer<typeof BomVariationsPageSchemaSchema>;
