import { FixedThreadPool } from "@poolifier/poolifier-web-worker";
import { workerConfig } from "../../config.ts";

export const workerPool = new FixedThreadPool(
	workerConfig.poolSize,
	new URL("./worker.ts", import.meta.url),
);
