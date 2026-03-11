/*
 * 1) Define the types
 */

type AuthConfig = Record<string, never>;

type CorsConfig = {
	origin: string | string[];
	allowMethods?: string[];
	allowHeaders?: string[];
	maxAge?: number;
	credentials?: boolean;
	exposeHeaders?: string[];
};

type DbConfig = {
	url: string;
	ssl: boolean;
	max: number;
};

type ServerConfig = {
	port: number;
	cors: CorsConfig;
};

type SessionConfig = {
	cookieName: string;
	ttl: number;
};

type WorkerConfig = {
	poolSize: number;
	taskTimeout: number;
	maxQueueSize: number;
};

/*
 * 2) Define the logic for complex values.
 */


/**
 * CORS configuration values and defaults.
 */
const corsDefaultHeaders = ["Content-Type", "Authorization", "X-Requested-With"];
const corsAllowedHeaders = [
	...new Set([...corsDefaultHeaders, ...(Deno.env.get("KL_CORS_ALLOWED_HEADERS")?.split(",") || [])]),
];
const corsAllowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const corsAllowedOrigins = Deno.env.get("KL_CORS_ALLOWED_ORIGINS")
	? String(Deno.env.get("KL_CORS_ALLOWED_ORIGINS")).split(",")
	: "*";
const corsCredentials = false;
const corsExposeHeaders: string[] = [];
const corsMaxAge = parseInt(Deno.env.get("KL_CORS_MAX_AGE") || "86400");

/**
 * Session configuration values and defaults.
 * This is used to manage session lifetimes and time-to-live (TTL).
 */
const sessionEnvTtl = Deno.env.get("KL_SESSION_TTL");
const sessionTtl = sessionEnvTtl ? parseInt(sessionEnvTtl) : (60 * 60 * 24); // 1 hour default
const sessionCookieName = Deno.env.get("KL_SESSION_COOKIE_NAME") || "kitledger_session";

/**
 * Worker pool configuration values and defaults.
 */
const workerPoolSize = parseInt(Deno.env.get("KL_WORKER_POOL_SIZE") || String(navigator.hardwareConcurrency)) || 1;
const workerTaskTimeout = parseInt(Deno.env.get("KL_WORKER_TASK_TIMEOUT") || "5000"); // Default to 5 seconds
const workerMaxQueueSize = Deno.env.get("KL_WORKER_MAX_QUEUE_SIZE")
	? parseInt(String(Deno.env.get("KL_WORKER_MAX_QUEUE_SIZE")))
	: Infinity;

/*
 * 3) Export the configuration objects.
 */

/**
 * Export pre-assembled configuration values for authentication.
 * Values are a mix of environment variables and defaults.
 */
export const authConfig: AuthConfig = {};

/**
 * Export pre-assembled configuration values for the database.
 * Values are a mix of environment variables and defaults.
 */
export const dbConfig: DbConfig = {
	url: Deno.env.get("KL_POSTGRES_URL") || "postgres://localhost:5432/kitledger",
	ssl: Deno.env.get("KL_POSTGRES_SSL") === "true",
	max: parseInt(Deno.env.get("KL_POSTGRES_MAX_CONNECTIONS") || "10"),
};

/**
 * Export pre-assembled configuration values for the HTTP server.
 * Values are a mix of environment variables and defaults.
 */
export const serverConfig: ServerConfig = {
	port: Deno.env.get("KL_SERVER_PORT") ? parseInt(String(Deno.env.get("KL_SERVER_PORT"))) : 8888,
	cors: {
		origin: corsAllowedOrigins,
		allowMethods: corsAllowedMethods,
		allowHeaders: corsAllowedHeaders,
		exposeHeaders: corsExposeHeaders,
		credentials: corsCredentials,
		maxAge: corsMaxAge,
	},
};

/**
 * Export pre-assembled configuration values for session management.
 * Values are a mix of environment variables and defaults.
 */
export const sessionConfig: SessionConfig = {
	ttl: sessionTtl,
	cookieName: sessionCookieName,
};

/**
 * Export pre-assembled configuration values for the worker pool.
 * Values are a mix of environment variables and defaults.
 */
export const workerConfig: WorkerConfig = {
	poolSize: workerPoolSize,
	taskTimeout: workerTaskTimeout,
	maxQueueSize: workerMaxQueueSize,
};
