import { z } from "zod";
import { FormItemSchema } from "../common.js";

// --- Shared ---

export const MultiMeasurementGradeRuleSchema = z.object({
  sizeName: z.string().nullable().optional(),
  sizeIndex: z.number().optional(),
  gradedSpec: z.number().nullable().optional(),
  gradeRule: z.number().nullable().optional(),
});

// --- MultiMeasurements ---

export const MultiMeasurementPomSchema = z.object({
  id: z.string(),
  isLinked: z.boolean().optional(),
  blockRowId: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  pointOfMeasure: z.string().nullable().optional(),
  tolMinus: z.number().nullable().optional(),
  tolPlus: z.number().nullable().optional(),
  initialSpec: z.number().nullable().optional(),
  revised: z.number().nullable().optional(),
  activeSpec: z.number().nullable().optional(),
  gradeRules: z.array(MultiMeasurementGradeRuleSchema).optional(),
  fields: z.array(FormItemSchema).optional(),
  initialColumns: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export const MultiMeasurementsDataSchema = z.object({
  measurementSystem: z.string().nullable().optional(),
  sizeClasses: z.array(z.object({
    sizeClass: z.record(z.string(), z.unknown()).optional(),
    poms: z.array(MultiMeasurementPomSchema).optional(),
    technicalSketches: z.array(z.record(z.string(), z.unknown())).optional(),
  }).passthrough()).nullable().optional(),
  blockHeader: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough();

// --- Single-size Measurements ---

export const MeasurementPomSchema = z.object({
  code: z.string().nullable().optional(),
  point_of_measure: z.string().nullable().optional(),
  tol_minus: z.number().nullable().optional(),
  tol_plus: z.number().nullable().optional(),
  revised: z.number().nullable().optional(),
  initial_spec: z.number().nullable().optional(),
}).passthrough();

export const MeasurementRowSchema = z.object({
  Id: z.string().nullable().optional(),
  is_linked: z.boolean().optional(),
  block_row_id: z.string().nullable().optional(),
  hide: z.boolean().optional(),
  poms: MeasurementPomSchema.nullable().optional(),
  specs: z.record(z.string(), z.number().nullable()).optional(),
  rules: z.record(z.string(), z.number().nullable()).optional(),
  samples: z.record(z.string(), z.number().nullable()).optional(),
}).passthrough();

export const MeasurementsDataSchema = z.object({
  fractionsMode: z.boolean().optional(),
  measurementSystem: z.string().nullable().optional(),
  data: z.array(MeasurementRowSchema).nullable().optional(),
  activeInitialField: z.string().nullable().optional(),
  sketches: z.array(z.record(z.string(), z.unknown())).optional(),
  SampleColumns: z.array(z.record(z.string(), z.unknown())).optional(),
  SampleSubmits: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

// --- Block Measurements ---

export const BlockMeasurementPomSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  pointOfMeasure: z.string().nullable().optional(),
  tolMinus: z.number().nullable().optional(),
  tolPlus: z.number().nullable().optional(),
  initialSpec: z.number().nullable().optional(),
  revised: z.number().nullable().optional(),
  gradeRules: z.array(MultiMeasurementGradeRuleSchema).optional(),
  fields: z.array(FormItemSchema).optional(),
}).passthrough();

export const BlockMeasurementsDataSchema = z.object({
  measurementSystem: z.string().nullable().optional(),
  sizeClasses: z.array(z.object({
    sizeClass: z.record(z.string(), z.unknown()).optional(),
    poms: z.array(BlockMeasurementPomSchema).optional(),
  }).passthrough()).nullable().optional(),
}).passthrough();
