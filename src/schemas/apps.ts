/**
 * App/Page schemas — re-exports from domain-specific submodules.
 *
 * Submodules:
 *   apps/grid.ts          — Grid, FormGrid
 *   apps/list.ts          — List, ImagesForm, ImagesGrid, TextList
 *   apps/attachments.ts   — Attachments
 *   apps/sku.ts           — SKU
 *   apps/bom.ts           — BOM, BomRow, BomColorwayPitch, BomUpdateItem
 *   apps/sample-request.ts — SampleRequestApp, DesignSample
 *   apps/measurements.ts  — Measurements, MultiMeasurements, Block Measurements
 *   apps/three-d.ts       — 3DStyle, Material3D
 *   apps/revisions.ts     — Revisions
 */

import { z } from "zod";
import { FormItemSchema, UserSchema } from "./common.js";

// Re-export all submodule schemas
export * from "./apps/grid.js";
export * from "./apps/list.js";
export * from "./apps/attachments.js";
export * from "./apps/sku.js";
export * from "./apps/bom.js";
export * from "./apps/sample-request.js";
export * from "./apps/measurements.js";
export * from "./apps/three-d.js";
export * from "./apps/revisions.js";

// Import for AppDataSchemas map
import { GridAppDataSchema, FormGridDataSchema } from "./apps/grid.js";
import { ListPageItemSchema, ImagesFormDataSchema, ImagesGridDataSchema, TextListDataSchema } from "./apps/list.js";
import { AttachmentsDataSchema } from "./apps/attachments.js";
import { SkuItemSchema } from "./apps/sku.js";
import { BomDataSchema } from "./apps/bom.js";
import { SampleRequestAppDataSchema, DesignSampleDataSchema } from "./apps/sample-request.js";
import { MultiMeasurementsDataSchema, MeasurementsDataSchema, BlockMeasurementsDataSchema } from "./apps/measurements.js";
import { Style3DDataSchema, Material3DDataSchema } from "./apps/three-d.js";
import { RevisionItemSchema } from "./apps/revisions.js";

// --- Artboard (fallback — raw schema passthrough) ---
export const ArtboardDataSchema = z.record(z.string(), z.unknown());

// --- Generic app page wrapper ---
export const AppResultSchema = z.object({
  id: z.string(),
  headerId: z.string(),
  name: z.string(),
  data: z.unknown(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type AppResult<TData = unknown> = Omit<z.infer<typeof AppResultSchema>, "data"> & { data: TData };

// --- App type → data schema map ---

/**
 * Maps app type strings (from AppPage.type) to Zod schemas for the `data` property.
 *
 * @example
 *   const page = await client.style.appGetTyped(headerId, appId, "Grid");
 *   page.data.gridData  // ← fully typed
 */
export const AppDataSchemas = {
  // Parser-backed types
  Form:                       z.array(FormItemSchema),
  Grid:                       GridAppDataSchema,
  FormGrid:                   FormGridDataSchema,
  List:                       z.array(ListPageItemSchema),
  ImagesForm:                 ImagesFormDataSchema,
  ImagesGrid:                 ImagesGridDataSchema,
  TextList:                   TextListDataSchema,
  Attachments:                AttachmentsDataSchema,
  BOM:                        BomDataSchema,
  BOMDetails:                 z.array(z.record(z.string(), z.unknown())),
  SKU:                        z.array(SkuItemSchema),
  SampleRequestApp:           SampleRequestAppDataSchema,
  SampleRequestMulti:         SampleRequestAppDataSchema,
  DesignSample:               DesignSampleDataSchema,
  Sets:                       BomDataSchema,
  SubAssembly:                BomDataSchema,

  // Measurement types
  Measurements:               MeasurementsDataSchema,
  MeasurementsGrid:           MeasurementsDataSchema,
  MultiMeasurements:          MultiMeasurementsDataSchema,
  MeasurementBlock:           BlockMeasurementsDataSchema,
  MultiSizeMeasurementBlock:  BlockMeasurementsDataSchema,

  // Fallback types
  Artboard:                   ArtboardDataSchema,
  Spreadsheet:                z.record(z.string(), z.unknown()),
  Revisions:                  z.array(RevisionItemSchema),
  "3DStyle":                  Style3DDataSchema,
  Material3D:                 Material3DDataSchema,
} as const satisfies Record<string, z.ZodType>;

/** App types that have typed data schemas */
export type TypedAppType = keyof typeof AppDataSchemas;

/** Infer the data type for a given app type string */
export type AppDataFor<T extends TypedAppType> = z.infer<(typeof AppDataSchemas)[T]>;

/** Typed app result — data is inferred from the app type */
export type TypedAppResult<T extends TypedAppType> = AppResult<AppDataFor<T>>;
