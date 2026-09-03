import { z } from "zod";
import { FormItemSchema, SchemaFieldSchema, UserSchema, type UpdateItem } from "./common.js";

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
 * the app's `BOMVariationsMetadataFields`. Every payload observed on a live tenant
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

// ── write requests ───────────────────────────────────
// Request shapes are plain types, like `ColorwayInput` — the SDK does not
// validate inputs. They mirror swagger's BomVariation*Request one-to-one.

/** One colour pitch on a row. `removeColor` clears the pitch for that colourway. */
export interface BomVariationColorUpdate {
  colorwayId: string;
  materialColorwayId?: string | null;
  hex?: string | null;
  number?: string | null;
  name?: string | null;
  removeColor?: boolean;
}

/**
 * One row in an Update/Create. Omit `rowId` to add a row; set `deleteRow` to
 * remove one. The server rejects `deleteRow` for a `rowId` it does not know
 * (400) and ignores writes to read-only grid fields (`UserLabel`,
 * `FormulaField`).
 */
export interface BomVariationRowUpdate {
  rowId?: string | null;
  materialId?: string | null;
  deleteRow?: boolean;
  rowFields?: UpdateItem[];
  colorUpdate?: BomVariationColorUpdate[];
}

/**
 * Body of `bomVariationCreate`. Requires `enableBomVariations` on the app and
 * fails once `MaxBomVariations` is reached.
 */
export interface BomVariationCreateRequest {
  variationName?: string | null;
  isDefault?: boolean | null;
  syncColorways?: boolean | null;
  selectedVariationColorways?: string[] | null;
  /** Variation-level metadata fields, by field id. */
  metadataFields?: UpdateItem[] | null;
  rows?: BomVariationRowUpdate[] | null;
}

/**
 * Body of `bomVariationUpdate`. Incremental: only what is present changes.
 * Setting `isDefault: false` on the default variation is a 400 — make another
 * one the default instead. `selectedVariationColorwaysUpdate` patches the
 * colourway list; `selectedVariationColorways` replaces it.
 */
export interface BomVariationUpdateRequest extends BomVariationCreateRequest {
  selectedVariationColorwaysUpdate?: { add?: string[] | null; remove?: string[] | null } | null;
}
