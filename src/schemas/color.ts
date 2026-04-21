import { z } from "zod";
import { FolderSchema, FormItemSchema, UserSchema } from "./common.js";

export const ColorPitchSchema = z.object({
  _id: z.string().optional(),
  color_id: z.string().nullable().optional(),
  color_source_id: z.string().nullable().optional(),
  hex: z.string().optional(),
  rgb_r: z.number().optional(), rgb_g: z.number().optional(), rgb_b: z.number().optional(),
  cmyk_c: z.number().optional(), cmyk_m: z.number().optional(), cmyk_y: z.number().optional(), cmyk_k: z.number().optional(),
  hsl_h: z.number().optional(), hsl_s: z.number().optional(), hsl_l: z.number().optional(),
  hsb_h: z.number().optional(), hsb_s: z.number().optional(), hsb_b: z.number().optional(),
  lab_l: z.number().optional(), lab_a: z.number().optional(), lab_b: z.number().optional(),
  xyz_x: z.number().optional(), xyz_y: z.number().optional(), xyz_z: z.number().optional(),
  family: z.string().nullable().optional(),
  suggested_name: z.string().nullable().optional(),
  suggested_hex: z.string().nullable().optional(),
  color_library: z.string().nullable().optional(),
  company_id: z.string().nullable().optional(),
  palette_name: z.string().nullable().optional(),
  sort: z.number().nullable().optional(),
  color_number: z.string().nullable().optional(),
  color_name: z.string().nullable().optional(),
  fields: z.array(FormItemSchema).optional(),
}).passthrough();
export type ColorPitch = z.infer<typeof ColorPitchSchema>;

/** Color palette data: { ASEurl?: string, colors: ColorPitch[] } */
export const ColorPaletteCustomSchema = z.object({
  ASEurl: z.string().nullable().optional(),
  colors: z.array(ColorPitchSchema),
});
export type ColorPaletteCustom = z.infer<typeof ColorPaletteCustomSchema>;

export const ColorDataSchema = z.object({
  fields: z.array(FormItemSchema),
  colors: ColorPaletteCustomSchema.optional(),
}).passthrough();

export const ColorHeaderSchema = z.object({
  id: z.string(),
  colorPaletteNumber: z.string(),
  colorPaletteName: z.string(),
  folder: FolderSchema,
  headerData: ColorDataSchema,
  isDeleted: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type ColorHeader = z.infer<typeof ColorHeaderSchema>;
