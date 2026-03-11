import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	api_tokens,
	permission_assignments,
	permissions,
	roles,
	system_permissions,
	user_roles,
	users,
} from "../../services/database/schema.ts";

export type ApiTokenInsert = InferInsertModel<typeof api_tokens>;
export type ApiToken = InferSelectModel<typeof api_tokens>;

export type PermissionAssignmentInsert = InferInsertModel<typeof permission_assignments>;
export type PermissionAssignment = InferSelectModel<typeof permission_assignments>;

export type PermissionInsert = InferInsertModel<typeof permissions>;
export type Permission = InferSelectModel<typeof permissions>;

export type RoleInsert = InferInsertModel<typeof roles>;
export type Role = InferSelectModel<typeof roles>;

export type SystemPermissionInsert = InferInsertModel<typeof system_permissions>;
export type SystemPermission = InferSelectModel<typeof system_permissions>;

export type UserInsert = InferInsertModel<typeof users>;
export type User = InferSelectModel<typeof users>;

export type UserRoleInsert = InferInsertModel<typeof user_roles>;
export type UserRole = InferSelectModel<typeof user_roles>;

export type AppUser = Omit<User, "password_hash"> & {
	roles: Role[];
	permissions: Permission[];
	system_permissions: SystemPermission[];
};
