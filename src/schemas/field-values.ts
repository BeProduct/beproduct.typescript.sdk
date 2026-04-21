/**
 * Field Value Type Map
 *
 * Maps each BeProduct field type to its Zod schema for the `value` property in FormItem.
 * Derived from the C# source: FieldType enum → ClassType<T> → BaseValue<T>.GetRawValue()
 * and FieldValuePublicConverterResolver.
 *
 * Usage:
 *   const item: FormItem = ...;
 *   const parsed = FieldValueSchemas[item.type]?.safeParse(item.value);
 */
import { z } from "zod";

// ── Primitive value shapes ──────────────────────────

/** ColorDropDown value — full color science object from DefaultColor */
export const ColorDropDownValueSchema = z.object({
  _id: z.string().optional(),
  Id: z.string().optional(), // sometimes Id instead of _id
  color_id: z.string().nullable().optional(),
  color_source_id: z.string().nullable().optional(),
  hex: z.string(),
  rgb_r: z.number(), rgb_g: z.number(), rgb_b: z.number(),
  cmyk_c: z.number(), cmyk_m: z.number(), cmyk_y: z.number(), cmyk_k: z.number(),
  hsl_h: z.number(), hsl_s: z.number(), hsl_l: z.number(),
  hsb_h: z.number(), hsb_s: z.number(), hsb_b: z.number(),
  lab_l: z.number(), lab_a: z.number(), lab_b: z.number(),
  xyz_x: z.number(), xyz_y: z.number(), xyz_z: z.number(),
  family: z.string().optional(),
  suggested_name: z.string().optional(),
  suggested_hex: z.string().optional(),
  color_library: z.string().optional(),
  company_id: z.string().optional(),
  palette_name: z.string().optional(),
  sort: z.number().optional(),
  color_reference: z.string().nullable().optional(),
}).passthrough();
export type ColorDropDownValue = z.infer<typeof ColorDropDownValueSchema>;

/** PartnerDropDown value */
export const PartnerDropDownValueSchema = z.object({
  value: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
});
export type PartnerDropDownValue = z.infer<typeof PartnerDropDownValueSchema>;

/** CompositeControl value — array of { code, value } items (material composition, etc.) */
export const CompositeControlValueSchema = z.array(z.object({
  code: z.string(),
  value: z.number(),
}));
export type CompositeControlValue = z.infer<typeof CompositeControlValueSchema>;

/** UsersTags value — array of { value, code } selections */
export const UsersTagsValueSchema = z.array(z.object({
  value: z.string(),
  code: z.string().nullable().optional(),
}));
export type UsersTagsValue = z.infer<typeof UsersTagsValueSchema>;

/** ColorwayField value — from ColorwayFieldValuePublicConverter */
export const ColorwayFieldValueSchema = z.object({
  Id: z.string(),
  color_number: z.string().nullable().optional(),
  color_name: z.string().nullable().optional(),
  Primary_Color: z.string().nullable().optional(),
  Image: z.object({
    preview: z.string(),
    origin: z.string(),
  }).nullable().optional(),
});
export type ColorwayFieldValue = z.infer<typeof ColorwayFieldValueSchema>;

// ── Field Type → Value Schema Map ───────────────────

/**
 * Maps field type strings to their value Zod schemas.
 *
 * All values can be null (field not set), so wrap with .nullable() when using.
 *
 * Categories:
 *   string types:   Text, Memo, ComboBox, LabelText, UserLabel, LabelSize,
 *                    LabelMaterial, LabelStyleGroup, Label3dStyle, LabelMaterialColor,
 *                    DropDown, Users
 *   number (int):   Number
 *   number (float): Decimal, Percent, Currency, Weight, Measure
 *   number | string: FormulaField (computed — can be either)
 *   date string:    Date, DateTime (ISO 8601)
 *   boolean-ish:    TrueFalse ("Yes"/"No"), InvertedTrueFalse ("Yes"/"No"), Label3dMaterial (true/false)
 *   string[]:       MultiSelect, Tags
 *   object:         ColorDropDown, PartnerDropDown, CompositeControl, UsersTags, ColorwayField
 */
export const FieldValueSchemas: Record<string, z.ZodType> = {
  // ── String types ──
  Text:              z.string().nullable(),
  Memo:              z.string().nullable(),
  ComboBox:          z.string().nullable(),
  DropDown:          z.string().nullable(),
  LabelText:         z.string().nullable(),
  UserLabel:         z.string().nullable(),
  LabelSize:         z.string().nullable(),
  LabelMaterial:     z.string().nullable(),
  LabelStyleGroup:   z.string().nullable(),
  Label3dStyle:      z.string().nullable(),
  LabelMaterialColor: z.string().nullable(),
  Users:             z.string().nullable(),

  // ── Integer ──
  Number:            z.number().nullable(),

  // ── Double ──
  Decimal:           z.number().nullable(),
  Percent:           z.number().nullable(),
  Currency:          z.number().nullable(),
  Weight:            z.number().nullable(),
  Measure:           z.number().nullable(),

  // ── Formula (can be number or string) ──
  FormulaField:      z.union([z.number(), z.string()]).nullable(),

  // ── Date (ISO 8601 string) ──
  Date:              z.string().nullable(),
  DateTime:          z.string().nullable(),

  // ── Boolean ──
  // Note: TrueFalse returns "Yes"/"No" as strings in responses, but true/false also possible
  TrueFalse:         z.union([z.string(), z.boolean()]).nullable(),
  InvertedTrueFalse: z.union([z.string(), z.boolean()]).nullable(),
  Label3dMaterial:   z.union([z.boolean(), z.string()]).nullable(),

  // ── String arrays ──
  MultiSelect:       z.array(z.string()).nullable(),
  Tags:              z.array(z.string()).nullable(),

  // ── Complex objects ──
  ColorDropDown:     ColorDropDownValueSchema.nullable(),
  PartnerDropDown:   PartnerDropDownValueSchema.nullable(),
  CompositeControl:  CompositeControlValueSchema.nullable(),
  UsersTags:         UsersTagsValueSchema.nullable(),
  ColorwayField:     ColorwayFieldValueSchema.nullable(),

  // ── Special ──
  MultiSelectBOMVariation: z.array(z.unknown()).nullable(),
  ImageColor:        z.unknown().nullable(), // colorway image reference
  Radio:             z.string().nullable(),
  Hidden:            z.unknown().nullable(),
};

/**
 * Type-safe field value getter.
 *
 * Usage:
 *   const item = { id: "color_drop_down999", value: { hex: "ff0000", ... }, type: "ColorDropDown", ... };
 *   const color = parseFieldValue(item.type, item.value);
 *   // color is typed as ColorDropDownValue | null if type matches
 */
export function parseFieldValue(fieldType: string, value: unknown): unknown {
  const schema = FieldValueSchemas[fieldType];
  if (!schema) return value;
  const result = schema.safeParse(value);
  return result.success ? result.data : value;
}

/**
 * Supported search operators per field type (from source code attributes).
 * Useful for building type-safe filter builders.
 */
export const FieldSearchOperators: Record<string, { operators: string[]; default: string }> = {
  Text:              { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  Memo:              { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  Number:            { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Decimal:           { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Percent:           { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Currency:          { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Weight:            { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Measure:           { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  Date:              { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  DateTime:          { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  TrueFalse:         { operators: ["is"], default: "is" },
  InvertedTrueFalse: { operators: ["is"], default: "is" },
  DropDown:          { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  ComboBox:          { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  MultiSelect:       { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  ColorDropDown:     { operators: ["is", "is_not", "is_empty", "is_not_empty"], default: "is" },
  PartnerDropDown:   { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  CompositeControl:  { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  Tags:              { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  UsersTags:         { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  Users:             { operators: ["in", "not_in", "is_empty", "is_not_empty"], default: "in" },
  FormulaField:      { operators: ["is", "is_not", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "is_empty", "is_not_empty"], default: "is" },
  UserLabel:         { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  LabelText:         { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  LabelMaterial:     { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  LabelSize:         { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  Label3dMaterial:   { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  Label3dStyle:      { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
  LabelStyleGroup:   { operators: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"], default: "contains" },
};
