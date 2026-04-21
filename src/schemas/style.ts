import { z } from "zod";
import { FolderSchema, FormItemSchema, ImageSchema, UserSchema } from "./common.js";

export const AvailableArtboardSchema = z.object({
  artboarIndex: z.number(), // API typo preserved
  imageUrl: z.string(),
});

/** Raw field values keyed by field ID — not FormItem[], just { fieldId: rawValue } */
const RawFieldsDict = z.record(z.string(), z.unknown()).nullable().optional();

/** Image can be a string URL (on headers) or an {preview, origin} object */
const ImageOrString = z.union([z.string(), ImageSchema]).nullable().optional();

export const ColorwaySchema = z.object({
  id: z.string(),
  colorNumber: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  secondaryColorNumber: z.string().nullable().optional(),
  secondaryColorName: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  hideColorway: z.boolean().optional(),
  imageHeaderId: z.string().nullable().optional(),
  fields: RawFieldsDict,
  image: ImageOrString,
  colorSourceId: z.string().nullable().optional(),
}).passthrough();
export type Colorway = z.infer<typeof ColorwaySchema>;

export const SizeSchema = z.object({
  name: z.string(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  unitOfMeasure: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  isSampleSize: z.boolean().optional(),
  sizeIndex: z.number().optional(),
  hideSize: z.boolean().optional(),
  fields: RawFieldsDict,
}).passthrough();
export type Size = z.infer<typeof SizeSchema>;

/** sizeRange can be a display string like "XS-XL" or an array of Size objects */
const SizeRangeFlexible = z.union([z.string(), z.array(z.lazy(() => SizeSchema))]).nullable().optional();

export const SizeClassModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean().optional(),
  sizeRange: SizeRangeFlexible,
}).passthrough();

export const StyleDataSchema = z.object({
  fields: z.array(FormItemSchema),
  frontImage: ImageSchema.optional(),
  sideImage: ImageSchema.optional(),
  backImage: ImageSchema.optional(),
  availableArtboards: z.array(AvailableArtboardSchema).optional(),
});

export const StyleHeaderSchema = z.object({
  id: z.string(),
  headerNumber: z.string(),
  headerName: z.string(),
  folder: FolderSchema,
  headerData: StyleDataSchema,
  colorways: z.array(ColorwaySchema).optional(),
  sizeRange: z.array(SizeSchema).optional(),
  sizeClasses: z.array(SizeClassModelSchema).optional(),
  planIds: z.array(z.string()).nullable().optional(),
  isDeleted: z.boolean().optional(),
  copiedOrCarriedOverFrom: z.string().nullable().optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).nullable().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type StyleHeader = z.infer<typeof StyleHeaderSchema>;
