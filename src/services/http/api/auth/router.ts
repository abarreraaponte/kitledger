import { Hono } from "@hono/hono";
import { setCookie } from "@hono/hono/cookie";
import { validateUserCredentials } from "../../../../domain/repositories/user_repository.ts";
import { startSession } from "../../../../domain/actions/session_actions.ts";
import { sessionConfig } from "../../../../config.ts";

const router = new Hono();

router.post("/login", async (c) => {
	try {
		const { email, password } = await c.req.json();

		const user = await validateUserCredentials(email, password);
		if (!user) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		const sessionToken = await startSession(user.id);

		// Set the HttpOnly cookie
		setCookie(c, sessionConfig.cookieName, sessionToken, {
			path: "/",
			secure: true, // Only send over HTTPS (set to false for localhost dev)
			httpOnly: true, // Cannot be accessed by client-side JS
			sameSite: "Strict", // Strongest CSRF protection
			maxAge: sessionConfig.ttl, // KL_SESSION_TTL in seconds
		});

		return c.json({
			id: user.id,
			email: user.email,
			first_name: user.first_name,
			last_name: user.last_name,
		});
	}
	catch (error) {
		console.error("Login failed:", error);
		return c.json({ error: "Login failed" }, 500);
	}
});

export const authRouter = router;
export const authPrefix = "/api/auth";
