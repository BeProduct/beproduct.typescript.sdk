import { z } from "zod";

/**
 * A Revisions page entry. Each item wraps a `reply` (the revision/comment post)
 * plus the application it belongs to. Note the nested `reply` object uses
 * PascalCase keys — that's exactly what the API returns here, unlike the
 * camelCase used elsewhere. Fields are kept lenient (nullable/optional +
 * passthrough) because revision types vary (comments vs. 3D revisions).
 */
export const RevisionReplySchema = z
  .object({
    Id: z.string(),
    PostId: z.string().nullable().optional(),
    Type: z.string().nullable().optional(),
    From: z
      .object({
        Id: z.string().nullable().optional(),
        Name: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    Title: z.string().nullable().optional(),
    Body: z.string().nullable().optional(),
    CreateDate: z.string().nullable().optional(),
    Revision3D: z.unknown().nullable().optional(),
  })
  .passthrough();

export const RevisionItemSchema = z
  .object({
    reply: RevisionReplySchema,
    applicationId: z.string().nullable().optional(),
    applicationName: z.string().nullable().optional(),
  })
  .passthrough();
