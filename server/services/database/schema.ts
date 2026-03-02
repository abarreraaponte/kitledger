import { boolean, index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./helpers.ts";
import { BalanceType } from "../../domain/types/account_types.ts";
import { BaseMetaProperty } from "../../domain/utils/base_schema.ts";

/**
 * 1. Tables, Indexes, and Constraints
 * This allows us to defined and view the database schema in a structured way.
 */

/**
 * 1.1 Users and Roles
 */

export const api_tokens = pgTable(
	"api_tokens",
	{
		hash: varchar("hash", { length: 64 }).primaryKey(),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id),
		name: varchar("name", { length: 64 }).notNull(),
		revoked_at: timestamp("revoked_at"),
	},
	(table) => [index("api_token_user_idx").on(table.user_id)],
);

export const permission_assignments = pgTable(
	"permission_assignments",
	{
		id: uuid("id").primaryKey(),
		permission_id: uuid("permission_id")
			.notNull()
			.references(() => permissions.id),
		user_id: uuid("user_id"),
		role_id: uuid("role_id"),
		...timestamps,
	},
	(table) => [
		index("permission_assignment_user_idx").on(table.user_id),
		index("permission_assignment_role_idx").on(table.role_id),
		index("permission_assignment_permission_idx").on(table.permission_id),
	],
);

export const permissions = pgTable("permissions", {
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 64 }).notNull().unique(),
	description: varchar("description", { length: 255 }),
	...timestamps,
});

export const roles = pgTable("roles", {
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 64 }).notNull().unique(),
	description: varchar("description", { length: 255 }),
	...timestamps,
});

export const sessions = pgTable("sessions", {
	hash: varchar("hash", { length: 64 }).primaryKey(),
	user_id: uuid("user_id")
		.notNull()
		.references(() => users.id),
	expires_at: timestamp("expires_at").notNull(),
	...timestamps,
});

export const system_permissions = pgTable(
	"system_permissions",
	{
		id: uuid("id").primaryKey(),
		permission: varchar("permission", { length: 64 }).notNull(),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id),
		...timestamps,
	},
	(table) => [
		index("system_permission_user_idx").on(table.user_id),
		index("system_permission_permission_idx").on(table.permission),
	],
);

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey(),
		first_name: varchar("first_name", { length: 64 }).notNull(),
		last_name: varchar("last_name", { length: 64 }).notNull(),
		email: varchar("email", { length: 64 }).notNull().unique(),
		password_hash: text("password_hash").notNull(),
		...timestamps,
	},
	(table) => [index("user_email_idx").on(table.email)],
);

export const user_roles = pgTable("user_roles", {
	id: uuid("id").primaryKey(),
	user_id: uuid("user_id")
		.notNull()
		.references(() => users.id),
	role_id: uuid("role_id")
		.notNull()
		.references(() => roles.id),
	...timestamps,
});

/**
 * 1.2 Entities
 */

// Add indexes
// Add constraints
// Add composite indexes for entities after adding entities table
export const entity_models = pgTable("entity_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 64 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

/**
 * 1.3 Transactions
 */
// Add indexes
// Add constraints
// Add composite indexes for transactions after adding transactions table
export const transaction_models = pgTable("transaction_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 64 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

/**
 * 1.4 Units
 */
// Add indexes
// Add constraints
// Add composite indexes for units after adding units table
export const unit_models = pgTable("unit_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 64 }).notNull(),
	active: boolean("active").default(true).notNull(),
	base_unit_id: uuid("base_unit_id").unique(),
	...timestamps,
});

/**
 * 1.5 Ledgers
 */
export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	balance_type: varchar("balance_type", { length: 10 }).notNull().$type<BalanceType>(),
	ledger_id: uuid("ledger_id").notNull(),
	parent_id: uuid("parent_id"),
	name: varchar("name", { length: 64 }).notNull(),
	meta: jsonb("meta").$type<BaseMetaProperty>(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

export const ledgers = pgTable("ledgers", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 64 }).notNull(),
	description: varchar("description", { length: 255 }),
	unit_model_id: uuid("unit_model_id").notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

/**
 * 2. Relations
 * These are for Drizzle query building features and have no direct effect on the database schema.
 */

export const apiTokenRelations = relations(api_tokens, ({ one }) => ({
	user: one(users, {
		fields: [api_tokens.user_id],
		references: [users.id],
	}),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
	permissionAssignments: many(permission_assignments),
	roles: many(roles),
	users: many(users),
}));

export const permissionAssignmentRelations = relations(permission_assignments, ({ one }) => ({
	permission: one(permissions, {
		fields: [permission_assignments.permission_id],
		references: [permissions.id],
	}),
	user: one(users, {
		fields: [permission_assignments.user_id],
		references: [users.id],
	}),
	role: one(roles, {
		fields: [permission_assignments.role_id],
		references: [roles.id],
	}),
}));

export const roleRelations = relations(roles, ({ many }) => ({
	users: many(user_roles),
	permissions: many(permission_assignments),
}));

export const systemPermissionRelations = relations(system_permissions, ({ one }) => ({
	user: one(users, {
		fields: [system_permissions.user_id],
		references: [users.id],
	}),
}));

export const userRelations = relations(users, ({ many }) => ({
	roles: many(user_roles),
	apiTokens: many(api_tokens),
	permissions: many(permission_assignments),
	system_permissions: many(system_permissions),
}));

export const userRoleRelations = relations(user_roles, ({ one }) => ({
	user: one(users, {
		fields: [user_roles.user_id],
		references: [users.id],
	}),
	role: one(roles, {
		fields: [user_roles.role_id],
		references: [roles.id],
	}),
}));
