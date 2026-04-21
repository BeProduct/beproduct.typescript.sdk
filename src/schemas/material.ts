import { z } from "zod";
import { FolderSchema, FormItemSchema, ImageSchema, UserSchema } from "./common.js";
import { ColorwaySchema, SizeSchema } from "./style.js";

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  supplierType: z.string().nullable().optional(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

export const MaterialDataSchema = z.object({
  fields: z.array(FormItemSchema),
  mainImage: ImageSchema.optional(),
  detailImage: ImageSchema.optional(),
});

export const MaterialHeaderSchema = z.object({
  id: z.string(),
  headerNumber: z.string(),
  headerName: z.string(),
  folder: FolderSchema,
  headerData: MaterialDataSchema,
  colorways: z.array(ColorwaySchema).optional(),
  sizeRange: z.array(SizeSchema).optional(),
  suppliers: z.array(SupplierSchema).optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).nullable().optional(),
  planIds: z.array(z.string()).nullable().optional(),
  isDeleted: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
});
export type MaterialHeader = z.infer<typeof MaterialHeaderSchema>;
