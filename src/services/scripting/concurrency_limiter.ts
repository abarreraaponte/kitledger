import { workerConfig } from "../../config.ts";

const workerURL = new URL("./worker.ts", import.meta.url);

// --- Pool Configuration ---

/** A worker from the pool, with metadata. */
export type PooledWorker = {
	worker: Worker;
	jobsDone: number;
};

const POOL_CONFIG = {
	min: workerConfig.poolSize,
	max: workerConfig.poolSize * 4,
	recycleAfterJobs: 100,
};

const idleWorkers: PooledWorker[] = [];
const waitingTasks: ((worker: PooledWorker) => void)[] = [];
let currentPoolSize = 0;

// --- Private Functions ---

/** Creates a new, clean worker and adds it to the pool. */
function createWorker(): PooledWorker {
	currentPoolSize++;
	return {
		worker: new Worker(workerURL.href, {
			type: "module",
			deno: { permissions: "none" },
		}),
		jobsDone: 0,
	};
}

/**
 * Safely terminates a worker and starts a new one to
 * maintain the pool's 'min' size.
 */
function recycleWorker(reason: string) {
	console.log(`Recycling worker: ${reason}`);
	currentPoolSize--;
	// Immediately create a new one to replace it
	// and add it to the pool.
	const newWorker = createWorker();
	releaseWorker(newWorker);
}

// --- Public API ---

/**
 * Starts the worker pool with the minimum number of workers.
 */
export function initializePool() {
	for (let i = 0; i < POOL_CONFIG.min; i++) {
		idleWorkers.push(createWorker());
	}
}

/**
 * Resolves with an available worker from the pool.
 */
export function acquireWorker(): Promise<PooledWorker> {
	return new Promise((resolve) => {
		// 1. If a worker is idle, use it
		if (idleWorkers.length > 0) {
			const pooledWorker = idleWorkers.shift()!;
			resolve(pooledWorker);
			return;
		}

		// 2. If no workers are idle but we're not at max, create a new one
		if (currentPoolSize < POOL_CONFIG.max) {
			const pooledWorker = createWorker();
			resolve(pooledWorker);
			return;
		}

		// 3. If at max capacity, wait in the queue
		waitingTasks.push(resolve);
	});
}

/**
 * Releases a worker back into the pool.
 * @param pooledWorker The worker to release.
 * @param isDirty If true, the worker is compromised (e.g., timed out) and must be terminated.
 */
export function releaseWorker(pooledWorker: PooledWorker, isDirty = false) {
	// 1. If worker is dirty or has done too many jobs, recycle it.
	if (isDirty) {
		pooledWorker.worker.terminate();
		recycleWorker("Worker timed out or was dirty.");
		return;
	}
	if (pooledWorker.jobsDone >= POOL_CONFIG.recycleAfterJobs) {
		pooledWorker.worker.terminate();
		recycleWorker(`Worker hit job limit (${POOL_CONFIG.recycleAfterJobs})`);
		return;
	}

	// 2. If someone is waiting, give them this worker immediately
	if (waitingTasks.length > 0) {
		const nextTask = waitingTasks.shift()!;
		nextTask(pooledWorker);
		return;
	}

	// 3. If no one is waiting, put it back in the idle queue
	idleWorkers.push(pooledWorker);
}
