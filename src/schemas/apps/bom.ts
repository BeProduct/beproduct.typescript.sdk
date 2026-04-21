import { z } from "zod";
import { ImageSchema } from "../common.js";

export const BomColorwayPitchSchema = z.object({
  image: z.union([z.string(), ImageSchema]).nullable().optional(),
  hex: z.string().optional(),
  number: z.string().optional(),
  name: z.string().optional(),
  colorID: z.string().optional(),
  materialColorwayId: z.string().optional(),
  colorwayId: z.string().optional(),
  color_reference: z.string().nullable().optional(),
}).passthrough();
export type BomColorwayPitch = z.infer<typeof BomColorwayPitchSchema>;

export const BomRowSchema = z.object({
  rowId: z.string(),
  materialId: z.string().optional(),
  header_number: z.string().optional(),
  header_name: z.string().optional(),
  group: z.string().nullable().optional(),
  track: z.boolean().nullable().optional(),
  Vendor: z.string().nullable().optional(),
  Size: z.string().nullable().optional(),
  qty: z.union([z.number(), z.string()]).nullable().optional(),
  uom: z.string().nullable().optional(),
  Currency: z.string().nullable().optional(),
  price: z.union([z.number(), z.string()]).nullable().optional(),
  total: z.union([z.number(), z.string()]).nullable().optional(),
  MainImageURL: z.string().nullable().optional(),
  FolderTypeName: z.string().optional(),
  share: z.boolean().nullable().optional(),
  isAdHOC: z.boolean().optional(),
}).passthrough();
export type BomRow = z.infer<typeof BomRowSchema>;

export const BomCostingGroupSchema = z.object({
  name: z.string(),
  value: z.number().nullable(),
  fieldId: z.string().nullable().optional(),
});

export const BomCostingSchema = z.object({
  scenarioId: z.string().nullable().optional(),
  scenarioName: z.string().nullable().optional(),
  isNominated: z.boolean(),
  groups: z.array(BomCostingGroupSchema),
});

export const BomDataSchema = z.object({
  data: z.array(BomRowSchema).nullable().optional(),
  applicationName: z.string().optional(),
  costing: z.array(BomCostingSchema).nullable().optional(),
});

export const BomColorUpdateSchema = z.object({
  colorId: z.string(),
  colorNumber: z.string(),
  colorName: z.string(),
  hex: z.string(),
  colorwayId: z.string(),
});
export type BomColorUpdate = z.infer<typeof BomColorUpdateSchema>;

export const BomUpdateItemSchema = z.object({
  materialUpdate: z.object({
    rowId: z.string().nullable().optional(),
    rowFields: z.array(z.object({ id: z.string(), value: z.unknown() })).optional(),
    deleteRow: z.boolean().optional(),
  }),
  colorUpdate: z.array(BomColorUpdateSchema).optional(),
  materialIdToInsert: z.string().nullable().optional(),
});
export type BomUpdateItem = z.infer<typeof BomUpdateItemSchema>;
