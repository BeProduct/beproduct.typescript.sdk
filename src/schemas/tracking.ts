import { z } from "zod";
import { FolderSchema, FormItemSchema, ImageSchema, UserSchema, AppPageSchema } from "./common.js";

export const IdNameSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});
export type IdName = z.infer<typeof IdNameSchema>;

export const PlanViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const PlanTimelineSetupSchema = z.object({
  id: z.string(),
  department: z.string().nullable().optional(),
  actionDescription: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  pageName: z.string().nullable().optional(),
});

export const PlanSetupSchema = z.object({
  views: z.array(PlanViewSchema),
  timelines: z.array(PlanTimelineSetupSchema),
});

export const TrackingFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  createdBy: UserSchema.optional(),
  modifiedBy: UserSchema.optional(),
  active: z.boolean().optional(),
});
export type TrackingFolder = z.infer<typeof TrackingFolderSchema>;

export const TrackingPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  folderId: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  active: z.boolean().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  createdBy: UserSchema.optional(),
  modifiedBy: UserSchema.optional(),
  style: PlanSetupSchema.optional(),
  material: PlanSetupSchema.optional(),
});
export type TrackingPlan = z.infer<typeof TrackingPlanSchema>;

/** Supplier reference in tracking context */
export const SupplierShortSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  partnerType: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export const TimelineItemSchema = z.object({
  id: z.string(),
  timelineId: z.string(),
  status: z.string(),
  plan: z.string().nullable().optional(),
  rev: z.string().nullable().optional(),
  final: z.string().nullable().optional(),
  due: z.string().nullable().optional(),
  assignedTo: z.array(UserSchema).optional(),
  shareWith: z.array(SupplierShortSchema).optional(),
  late: z.boolean().optional(),
  submitsQuantity: z.number().optional(),
  page: AppPageSchema.nullable().optional(),
  request: AppPageSchema.nullable().optional(),
});
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

const PlanHeaderSchema = z.object({
  id: z.string(),
  headerNumber: z.string(),
  headerName: z.string(),
  folder: FolderSchema.optional(),
  frontImage: ImageSchema.optional(),
  mainImage: ImageSchema.optional(),
  fields: z.array(FormItemSchema).optional(),
}).passthrough();

export const PlanTimelineSchema = z.object({
  id: z.string(),
  colorId: z.string().nullable().optional(),
  colorNumber: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  supplier: IdNameSchema.nullable().optional(),
  suppliers: z.array(IdNameSchema).optional(),
  modifiedAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  header: PlanHeaderSchema,
  timelines: z.array(TimelineItemSchema),
  isArchived: z.boolean().optional(),
  fields: z.array(FormItemSchema).optional(),
});
export type PlanTimeline = z.infer<typeof PlanTimelineSchema>;

// ── Edit request types (for timeline updates) ──

/** Patch wrapper for scalar values: { value: T } */
export const ValuePatch = <T extends z.ZodType>(inner: T) =>
  z.object({ value: inner }).optional();

/** Patch wrapper for collections: { add?: T[], remove?: T[] } */
export const CollectionPatch = <T extends z.ZodType>(inner: T) =>
  z.object({ add: z.array(inner).optional(), remove: z.array(inner).optional() }).optional();

/** Request to edit a single timeline item (milestone) */
export const EditTimelineItemRequestSchema = z.object({
  id: z.string(),
  status: z.object({ value: z.string() }).optional(),
  rev: z.object({ value: z.string().nullable() }).optional(),
  final: z.object({ value: z.string().nullable() }).optional(),
  assignedTo: z.object({ add: z.array(z.string()).optional(), remove: z.array(z.string()).optional() }).optional(),
  shareWith: z.object({ add: z.array(z.string()).optional(), remove: z.array(z.string()).optional() }).optional(),
});
export type EditTimelineItemRequest = z.infer<typeof EditTimelineItemRequestSchema>;

/** Request to edit a tracking row (timeline) */
export const EditTimelineRequestSchema = z.object({
  id: z.string(),
  colorwayId: z.object({ value: z.string() }).optional(),
  size: z.object({ value: z.string() }).optional(),
  supplier: z.object({ add: z.array(z.string()).optional(), remove: z.array(z.string()).optional() }).optional(),
  timelines: z.array(EditTimelineItemRequestSchema).optional(),
});
export type EditTimelineRequest = z.infer<typeof EditTimelineRequestSchema>;

// ── Progress ──

export const PlanProgressSchema = z.object({
  not_started: z.number(),
  in_progress: z.number(),
  waiting_on: z.number(),
  rejected: z.number(),
  approved: z.number(),
  approved_with_corrections: z.number(),
  na: z.number(),
  late: z.number(),
  total: z.number(),
});
export type PlanProgress = z.infer<typeof PlanProgressSchema>;
