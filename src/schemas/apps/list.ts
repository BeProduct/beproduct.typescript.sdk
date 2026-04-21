import { z } from "zod";
import { FormItemSchema } from "../common.js";
import { GridAppDataSchema } from "./grid.js";

export const ListPageItemSchema = z.object({
  id: z.string(),
  controls: z.array(FormItemSchema),
  image: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
});
export type ListPageItem = z.infer<typeof ListPageItemSchema>;

export const ImagesFormDataSchema = z.object({
  image: z.array(ListPageItemSchema),
  form: z.array(FormItemSchema),
});

export const ImagesGridDataSchema = z.object({
  image: z.array(ListPageItemSchema),
  grid: GridAppDataSchema,
});

export const TextListDataSchema = z.object({
  text: z.string().nullable().optional(),
  images: z.array(ListPageItemSchema),
});
