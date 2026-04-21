import { z } from "zod";
import { UserSchema } from "./common.js";

export const DirectoryCompanySchema = z.object({
  id: z.string(),
  directoryId: z.string().nullable().optional(),
  name: z.string(),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  partnerType: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  createdBy: UserSchema.optional(),
  modifiedBy: UserSchema.optional(),
});
export type DirectoryCompany = z.infer<typeof DirectoryCompanySchema>;

export const ContactSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  mobilePhone: z.string().nullable().optional(),
  workPhone: z.string().nullable().optional(),
  accountType: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  registerdOn: z.string().nullable().optional(), // API typo preserved
  active: z.boolean().optional(),
  invitedAsVendor: z.boolean().optional(),
  invitationPending: z.boolean().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;
