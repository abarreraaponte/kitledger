import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { apiV1Prefix, apiV1Router } from "./services/http/api/v1/router.ts";
import { authPrefix, authRouter } from "./services/http/api/auth/router.ts";
import { join } from "@std/path/join";
import { runMigrations } from "./services/database/db.ts";
import { serverConfig } from "./config.ts";
import { execute } from "./setup.ts";

await runMigrations();

// --- Server and CLI Startup Logic ---
const args = Deno.args;

if (args.length === 0 || args[0] === "serve") {
	console.log(`Server is running on port ${serverConfig.port}`);

	const server = new Hono();

	/**
	 * Authentication routes
	 * /api/auth/*
	 */
	server.route(authPrefix, authRouter);

	/**
	 * API v1 routes
	 * /api/v1/*
	 */
	server.route(apiV1Prefix, apiV1Router);

	/**
	 * Serve the client SPA and assets.
	 */

	/**
	 * Server the assets.
	 */
	server.get(
		"/assets/*",
		serveStatic({
			root: join(String(import.meta.dirname), "../dist/client"),
		}),
	);

	/**
	 * Serve the client's index.html file.
	 */
	server.get("/*", async (c) => {
		const html = await Deno.readTextFile(join(String(import.meta.dirname), "../dist/client/index.html"));
		return c.html(html);
	});

	Deno.serve(
		{ port: serverConfig.port },
		server.fetch,
	);
}
else {
	await execute(args);
}
