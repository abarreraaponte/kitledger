import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dbConfig } from "../../config.ts";
import { dirname, join } from "@std/path";
import { fromFileUrl } from "@std/path/from-file-url";

import * as schema from "./schema.ts";

export const db = drizzle({
	connection: dbConfig,
	schema: schema,
});

const __dirname = dirname(import.meta.url);
const migrationsPath = join(fromFileUrl(__dirname), "migrations");

export async function runMigrations() {
	await migrate(db, {
		migrationsFolder: migrationsPath,
		migrationsTable: "schema_history",
		migrationsSchema: "public",
	});
}
