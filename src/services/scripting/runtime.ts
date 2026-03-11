import { acquireWorker, initializePool, releaseWorker } from "./concurrency_limiter.ts";

export const __API_METHODS = [
	"UNIT_MODEL.CREATE",
] as const;

export type Method = typeof __API_METHODS[number];

export type ActionRequestPayload<T> = {
	id: string;
	method: Method;
	payload: T;
};

export type ExecutionResultPayload = {
	status: "SUCCESS" | "ERROR";
	error?: string;
};

export type WorkerToHostMessage<TRequest> =
	| { type: "ACTION_REQUEST"; payload: ActionRequestPayload<TRequest> }
	| { type: "EXECUTION_RESULT"; payload: ExecutionResultPayload };

export type ActionResponsePayload<TResponse> = {
	id: string;
	result?: TResponse;
	error?: string;
};

export type HostToWorkerMessage<TResponse> = {
	type: "ACTION_RESPONSE";
	payload: ActionResponsePayload<TResponse>;
};

// --- Internal RPC Implementation ---

export function __host_rpc<TRequest, TResponse>(
	method: Method,
	data: TRequest,
): Promise<TResponse> {
	return new Promise((resolve, reject) => {
		const id = crypto.randomUUID();
		const payload: ActionRequestPayload<TRequest> = { id, method, payload: data };

		const responseHandler = (event: MessageEvent<HostToWorkerMessage<unknown>>) => {
			if (event.data &&
				event.data.type === "ACTION_RESPONSE" &&
				event.data.payload.id === id) {
				self.removeEventListener("message", responseHandler);
				const { result, error } = event.data.payload;

				if (error) {
					reject(new Error(error));
				} else {
					resolve(result as TResponse);
				}
			}
		};

		self.addEventListener("message", responseHandler);
		self.postMessage({ type: "ACTION_REQUEST", payload });
	});
}

const apiMethodMap: Record<Method, (payload: unknown) => unknown> = {
	"UNIT_MODEL.CREATE": (payload: unknown) => {
		console.log("[User Script | API]: UNIT_MODEL.CREATE called with:", payload);
		return { id: `um_${crypto.randomUUID()}`, status: "created" };
	},
};

function getApiMethod(methodName: Method): (payload: unknown) => unknown {
	const method = apiMethodMap[methodName];
	if (!method) {
		throw new Error(`Unknown API method: ${methodName}`);
	}
	return method;
}

async function invokeApiMethod(methodName: Method, payload: unknown): Promise<unknown> {
	const method = getApiMethod(methodName);
	return await method(payload);
}

initializePool();

function timeout(
	ms: number,
	terminatedFlag: { value: boolean },
): { promise: Promise<never>; timeoutId: number } {
	let timeoutId;
	const promise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			terminatedFlag.value = true;
			reject(new Error(`Script execution timed out after ${ms}ms`));
		}, ms);
	});
	return { promise, timeoutId: timeoutId! };
}

/**
 * Arguments for executing a Kit Action Script.
 */
export interface ExecuteScriptArgs {
	/** The bundled, executable JavaScript code. */
	code: string;
	/** A JSON string representing the script's 'input' object. */
	inputJSON: string;
	/** The script type, e.g., "ServerEvent", "EndpointRequest". */
	scriptType: string;
	/** The specific trigger, e.g., "beforeCreate" or "GET". */
	trigger?: string;
	/** The execution timeout in milliseconds. */
	timeoutMs: number;
}

export async function executeScript(args: ExecuteScriptArgs): Promise<ExecutionResultPayload> {
	const pooledWorker = await acquireWorker();
	const worker = pooledWorker.worker;
	pooledWorker.jobsDone++;

	const terminatedFlag = { value: false };
	let timeoutId: number | undefined;

	try {
		const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
			const channel = new MessageChannel();
			const hostPort = channel.port1;

			hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage<unknown>>) => {
				if (terminatedFlag.value) return;

				const message = event.data;
				switch (message.type) {
					case "ACTION_REQUEST": {
						try {
							const result = await invokeApiMethod(message.payload.method, message.payload.payload);
							hostPort.postMessage({
								type: "ACTION_RESPONSE",
								payload: { id: message.payload.id, result },
							} as HostToWorkerMessage<unknown>);
						}
						catch (e) {
							hostPort.postMessage({
								type: "ACTION_RESPONSE",
								payload: { id: message.payload.id, error: (e as Error).message },
							} as HostToWorkerMessage<unknown>);
						}
						break;
					}
					case "EXECUTION_RESULT": {
						hostPort.close();
						if (message.payload.status === "SUCCESS") resolve(message.payload);
						else reject(new Error(message.payload.error ?? "Unknown execution error"));
						break;
					}
				}
			};

			hostPort.onmessageerror = (err) => {
				if (!terminatedFlag.value) {
					reject(new Error(`MessagePort error: ${err.data}`));
				}
			};

			worker.postMessage(args, [channel.port2]);
		});

		const { promise: timeoutPromise, timeoutId: id } = timeout(
			args.timeoutMs,
			terminatedFlag,
		);
		timeoutId = id;

		return await Promise.race([
			executionPromise,
			timeoutPromise,
		]);
	}
	finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		releaseWorker(pooledWorker, terminatedFlag.value);
	}
}
