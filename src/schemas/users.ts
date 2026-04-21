import { z } from "zod";
import { UserSchema } from "./common.js";

export const UserModelSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  accountType: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  registerdOn: z.string().nullable().optional(), // API typo preserved
  active: z.boolean().optional(),
});
export type UserModel = z.infer<typeof UserModelSchema>;

export const UserRoleSchema = z.object({
  id: z.string(),
  roleName: z.string(),
  roleDescription: z.string().optional(),
  roleType: z.string().optional(),
  isAdmin: z.boolean().optional(),
  createdBy: UserSchema.optional(),
  createdAt: z.string().optional(),
  modifiedBy: UserSchema.optional(),
  modifiedAt: z.string().optional(),
  active: z.boolean().optional(),
});
export type UserRole = z.infer<typeof UserRoleSchema>;
