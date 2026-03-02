import { ApiTokenFactory, SessionFactory, UserFactory } from "../../server/domain/factories/auth_factories.ts";
import { system_permissions, users } from "../../server/services/database/schema.ts";
import { assert } from "@std/assert";
import { createSuperUser, type NewSuperUser } from "../../server/domain/actions/user_actions.ts";
import { db } from "../../server/services/database/db.ts";
import { SYSTEM_ADMIN_PERMISSION } from "../../server/domain/actions/permission_actions.ts";
import { startSession } from "../../server/domain/actions/session_actions.ts";
import { createToken } from "../../server/domain/actions/token_actions.ts";
import { getSessionUserId, getTokenUserId } from "../../server/domain/repositories/user_repository.ts";
import { hashPassword, hashString } from "@server/domain/utils/crypto.ts";
import { eq } from "drizzle-orm";
import { afterAll, describe, it } from "@std/testing/bdd";

describe("Auth Domain Tests", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    it("User factory creates valid User objects", () => {
        const factory = new UserFactory();
        const users = factory.make(5);
        assert(users.length === 5);
        users.forEach((user) => {
            assert(typeof user.id === "string");
            assert(typeof user.email === "string");
            assert(user.email.includes("@"));
            assert(typeof user.password_hash === "string");
        });
    });

    it("Session factory creates valid Session objects", () => {
        const factory = new SessionFactory();
        const sessions = factory.make(3);
        assert(sessions.length === 3);
        sessions.forEach((session) => {
            assert(typeof session === "string");
            assert(session.length > 0);
        });
    });

    it("ApiToken factory creates valid ApiToken objects", () => {
        const factory = new ApiTokenFactory();
        const tokens = factory.make(4);
        assert(tokens.length === 4);
        tokens.forEach((token) => {
            assert(typeof token.hash === "string");
            assert(typeof token.user_id === "string");
            assert(typeof token.name === "string");
            assert(token.revoked_at === null || token.revoked_at instanceof Date);
        });
    });

    it("createSuperUser returns a valid NewSuperUser object", async () => {
        const factory = new UserFactory();
        const fakeUser = factory.make(1)[0];
        const newSuperUser: NewSuperUser | null = await createSuperUser(
            fakeUser.first_name,
            fakeUser.last_name,
            fakeUser.email,
        );

        assert(newSuperUser !== null);
        assert(typeof newSuperUser.id === "string");
        assert(newSuperUser.first_name === fakeUser.first_name);
        assert(newSuperUser.last_name === fakeUser.last_name);
        assert(newSuperUser.email === fakeUser.email);
        assert(typeof newSuperUser.password === "string");
        assert(typeof newSuperUser.api_token === "string");
        assert(newSuperUser.api_token.length > 0);

        const userFromDb = await db.query.users.findFirst({
            where: eq(users.id, newSuperUser.id),
        });
        assert(userFromDb !== null);
        assert(userFromDb?.first_name === newSuperUser.first_name);
        assert(userFromDb?.last_name === newSuperUser.last_name);

        const userEmailFromDb = await db.query.users.findFirst({
            where: eq(users.email, newSuperUser.email),
        });
        assert(userEmailFromDb?.id === newSuperUser.id);

        const systemPermissionFromDbRes = await db.query.system_permissions.findMany({
            where: eq(system_permissions.user_id, newSuperUser.id),
        });
        const systemPermissionFromDb = systemPermissionFromDbRes.map((permission) => permission.permission);
        assert(systemPermissionFromDb?.includes(SYSTEM_ADMIN_PERMISSION));
    });

    it("startSession creates a valid session and retrieves user ID", async () => {
        const factory = new UserFactory();
        const fakeUser = factory.make(1)[0];
        
        const newSuperUser: NewSuperUser | null = await createSuperUser(
            fakeUser.first_name,
            fakeUser.last_name,
            fakeUser.email,
        );
        if (newSuperUser === null) {
            throw new Error("Failed to create super user for session test");
        }
        
        const sessionId = await startSession(newSuperUser.id);
        assert(typeof sessionId === "string");
        assert(sessionId.length > 0);

        const sessionHash = await hashString(sessionId);
        const retrievedUserId = await getSessionUserId(sessionHash);
        assert(retrievedUserId === newSuperUser.id);
    });

    it("createToken and getTokenUserId work correctly", async () => {
        const user = new UserFactory().make(1)[0];
        await db.insert(users).values(user);
        
        const tokenId = await createToken(user.id, "Test Token");
        assert(typeof tokenId === "string");
        assert(tokenId.length > 0);

        const tokenHash = await hashString(tokenId);
        const retrievedUserId = await getTokenUserId(tokenHash);
        assert(retrievedUserId === user.id);
        
        const nonExistentTokenHash = await hashString("invalid_token_string");
        const nonExistentUserId = await getTokenUserId(nonExistentTokenHash);
        assert(nonExistentUserId === null);
    });

    it("hashPassword generates a valid hash", async () => {
        const password = "securePassword123";
        const hashedPassword = await hashPassword(password);
        assert(typeof hashedPassword === "string" && hashedPassword.length > 0);
        assert(hashedPassword.startsWith("$argon2id$"));
    });
});