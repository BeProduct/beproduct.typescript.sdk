import { z } from "zod";
import { UserSchema } from "./common.js";

export const SharedPartnerSchema = z.object({
  partner: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    partnerType: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
  }),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
});
export type SharedPartner = z.infer<typeof SharedPartnerSchema>;
