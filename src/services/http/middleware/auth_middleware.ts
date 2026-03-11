import { createMiddleware } from "@hono/hono/factory";
import { getCookie } from "@hono/hono/cookie";
import { getSessionUserId, getTokenUserId } from "../../../domain/repositories/user_repository.ts";
import { sessionConfig } from "../../../config.ts";
import { hashString } from "../../../domain/utils/crypto.ts";

export const auth = createMiddleware(async (c, next) => {
	const headerToken = c.req.header("Authorization")?.replace("Bearer ", "");
	const cookieToken = getCookie(c, sessionConfig.cookieName);

	if (!headerToken && !cookieToken) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const rawToken = headerToken || cookieToken;
		const isHeader = !!headerToken;

		const tokenHash = await hashString(rawToken as string);

		let userId: string | null = null;

		if (isHeader) {
			userId = await getTokenUserId(tokenHash);
		} else {
			userId = await getSessionUserId(tokenHash);
		}

		if (!userId) {
			throw new Error("Invalid or expired token.");
		}

		c.set("user", userId);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unauthorized";
		return c.json({ error: errorMessage }, 401);
	}

	await next();
});	