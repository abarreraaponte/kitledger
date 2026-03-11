import { dbConfig } from "./server/config.ts";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/services/database/schema.ts",
	out: "./src/services/database/migrations",
	migrations: {
		table: "migrations",
		schema: "public",
	},
	dbCredentials: {
		url: dbConfig.url,
		ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
	},
});
