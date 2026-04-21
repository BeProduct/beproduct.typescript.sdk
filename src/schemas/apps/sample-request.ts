import { z } from "zod";
import { FormItemSchema, ImageSchema } from "../common.js";

export const FitPhotoSchema = z.object({
  id: z.string(),
  image: ImageSchema.nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const SampleRequestSubmitDataSchema = z.object({
  fitComments: z.string().nullable().optional(),
  fitPhotos: z.array(FitPhotoSchema).optional(),
});

export const SampleRequestAppDataSchema = z.object({
  poms: z.array(z.object({
    id: z.string(),
    isLinked: z.boolean().optional(),
    pom: z.object({
      code: z.string().optional(),
      pointOfMeasure: z.string().optional(),
      tolMinus: z.number().nullable().optional(),
      tolPlus: z.number().nullable().optional(),
      requested: z.number().nullable().optional(),
      fields: z.array(FormItemSchema).optional(),
    }).nullable().optional(),
    gradeRules: z.array(z.object({
      sizeName: z.string().nullable().optional(),
      spec: z.number().nullable().optional(),
      rule: z.number().nullable().optional(),
    })).optional(),
    submits: z.array(z.object({
      id: z.string().nullable().optional(),
      fields: z.array(FormItemSchema).optional(),
    })).optional(),
  })).optional(),
  submits: z.array(z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    sampleSize: z.string().nullable().optional(),
    size: z.union([z.string(), z.number()]).nullable().optional(),
    dueDate: z.string().nullable().optional(),
    receivedDate: z.string().nullable().optional(),
    fitDate: z.string().nullable().optional(),
    resubmitDueDate: z.string().nullable().optional(),
    submitStatus: z.string().nullable().optional(),
    submitStatusDate: z.string().nullable().optional(),
    data: SampleRequestSubmitDataSchema.nullable().optional(),
  })).optional(),
  measurementSystem: z.string().nullable().optional(),
}).passthrough();

export const DesignSampleSubmitSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  receivedDate: z.string().nullable().optional(),
  fitDate: z.string().nullable().optional(),
  resubmitDueDate: z.string().nullable().optional(),
  submitStatus: z.string().nullable().optional(),
  submitStatusDate: z.string().nullable().optional(),
  data: SampleRequestSubmitDataSchema.nullable().optional(),
});

export const DesignSampleDataSchema = z.object({
  submits: z.array(DesignSampleSubmitSchema).optional(),
}).passthrough();
