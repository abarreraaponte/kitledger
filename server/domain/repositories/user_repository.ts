import { db } from "../../services/database/db.ts";
import { api_tokens, sessions, users } from "../../services/database/schema.ts";
import { and, eq, gt, isNull } from "drizzle-orm";
import { verifyPassword } from "../utils/crypto.ts";
import type { AppUser, Role, Permission } from "../types/auth_types.ts";

export async function getSessionUserId(sessionHash: string): Promise<string | null> {
	const session = await db.query.sessions.findFirst({
		where: and(
			eq(sessions.hash, sessionHash),
			gt(sessions.expires_at, new Date()),
		),
		columns: {
			user_id: true,
		},
	});
	return session ? session.user_id : null;
}

export async function getTokenUserId(tokenHash: string): Promise<string | null> {
	const token = await db.query.api_tokens.findFirst({
		where: and(eq(api_tokens.hash, tokenHash), isNull(api_tokens.revoked_at)),
		columns: {
			user_id: true,
		},
	});

	if (token) {
		return token.user_id;
	}
	else {
		return null;
	}
}

export async function validateUserCredentials(
	email: string,
	password: string,
): Promise<{ id: string; first_name: string; last_name: string; email: string } | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
		columns: {
			id: true,
			first_name: true,
			last_name: true,
			email: true,
			password_hash: true,
		},
	});

	if (!user || !user.password_hash) {
		return null;
	}

	const validPassword = await verifyPassword(user.password_hash, password);

	if (validPassword) {
		return {
			id: user.id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
		};
	}
	else {
		return null;
	}
}

export async function getAuthUser(userId: string): Promise<AppUser | null> {

	// 1. Fetch the user and all related data in one go.
	// This requires the `userRelations` to be correctly defined (see below).
	const userProfile = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			password_hash: false, // Exclude the password hash
		},
		with: {
			// Fetch system permissions (requires relation)
			system_permissions: true,
			// Fetch direct permission assignments
			permissions: {
				with: {
					permission: true, // Include the actual permission details
				},
			},
			// Fetch user_roles
			roles: {
				with: {
					// For each user_role, fetch the role
					role: {
						with: {
							// For each role, fetch its permission assignments
							permissions: {
								with: {
									permission: true, // Include the permission details
								},
							},
						},
					},
				},
			},
		},
	});

	if (!userProfile) {
		return null;
	}

	// 2. Process the nested data to match the AppUser type

	// Get the final list of Role objects
	const userRoles: Role[] = userProfile.roles.map(
		(userRole) => userRole.role,
	);

	// Use a Map to deduplicate permissions
	const permissionMap = new Map<string, Permission>();

	// Add permissions from roles
	for (const userRole of userProfile.roles) {
		for (const permAssignment of userRole.role.permissions) {
			if (permAssignment.permission) {
				permissionMap.set(
					permAssignment.permission.id,
					permAssignment.permission,
				);
			}
		}
	}

	// Add/overwrite with direct permissions
	for (const permAssignment of userProfile.permissions) {
		if (permAssignment.permission) {
			permissionMap.set(
				permAssignment.permission.id,
				permAssignment.permission,
			);
		}
	}

	// Convert the map back to an array
	const allPermissions = Array.from(permissionMap.values());

	// 3. Construct the final AppUser object
	const appUser: AppUser = {
		...userProfile,
		roles: userRoles,
		permissions: allPermissions,
		system_permissions: userProfile.system_permissions,
	};

	return appUser;
}
