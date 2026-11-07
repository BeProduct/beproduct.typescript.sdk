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

/**
 * GET Users/Roles/{roleId}/Permissions. Keys are open-ended on both levels:
 * modules ("Style", "Tracking", ...) and flags ("Full", "View", "AiWorkflow", ...)
 * differ per module and grow over time.
 */
export const RolePermissionsSchema = z.record(z.string(), z.record(z.string(), z.boolean()));
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;

/** GET Users/Roles/Folder/{folderId}. `appPermissions` is filled only for selected roles. */
export const FolderRoleSchema = z.object({
  id: z.string(),
  roleName: z.string().nullable().optional(),
  roleDescription: z.string().nullable().optional(),
  roleType: z.string().nullable().optional(),
  selected: z.boolean(),
  /** The folder's own permission for this role; null/absent = the role's module default applies. */
  folderPermission: z.object({ full: z.boolean(), view: z.boolean() }).nullable().optional(),
  appPermissions: z.array(z.object({
    appId: z.string(),
    appName: z.string().nullable().optional(),
    /** no_access | read_only | read_write | full_access; null = not set, the UI derives it from folder permissions. */
    rulesSet: z.string().nullable().optional(),
  })),
});
export type FolderRole = z.infer<typeof FolderRoleSchema>;
