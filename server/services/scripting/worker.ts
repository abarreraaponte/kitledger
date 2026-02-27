import type { HostToWorkerMessage, WorkerToHostMessage } from "./runtime.ts";
import type { ExecuteScriptArgs } from "./runtime.ts";

self.onmessage = async (event: MessageEvent<ExecuteScriptArgs>) => {
	const port = event.ports[0];
	if (!port) {
		self.close();
		return;
	}

	port.start();

	const { code, inputJSON, scriptType, trigger } = event.data;

	// --- Sandbox global communication ---
	const listeners = new Map<string, Set<EventListener>>();
	self.postMessage = (message: WorkerToHostMessage<unknown>) => {
		try {
			port.postMessage(message);
		}
		catch (e) {
			console.error("Kitledger worker: Failed to post message to host.", e);
		}
	};
	self.addEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
		if (type !== "message") return;
		const callback = typeof listener === "function" ? listener : listener.handleEvent;
		if (!callback) return;
		let set = listeners.get("message");
		if (!set) {
			set = new Set();
			listeners.set("message", set);
		}
		set.add(callback);
	};
	self.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
		if (type !== "message") return;
		const set = listeners.get("message");
		if (set) {
			const callback = typeof listener === "function" ? listener : listener.handleEvent;
			if (callback) set.delete(callback);
		}
	};
	port.onmessage = (event: MessageEvent<HostToWorkerMessage<unknown>>) => {
		const set = listeners.get("message");
		if (set) {
			set.forEach((listener) => {
				try {
					listener(event);
				}
				catch (e) {
					console.error("Kitledger worker: Error in user event listener:", e);
				}
			});
		}
	};
	// --- End Sandbox ---

	try {
		const dataUrl = `data:text/javascript,${encodeURIComponent(code)}`;
		const module = await import(dataUrl);

		if (!module.default) {
			throw new Error("Script must have a default export.");
		}

		const handler = module.default;
		const input = JSON.parse(inputJSON);

		if (scriptType === "ServerEvent" || scriptType === "EndpointRequest") {
			// Object-based handlers
			if (typeof handler !== "object" || handler === null) {
				throw new Error(`${scriptType} scripts must export an object.`);
			}

			const key = trigger?.toLowerCase();
			if (key && typeof handler[key] === "function") {
				await handler[key](input);
			}
			else if (scriptType === "EndpointRequest") {
				throw new Error(`Method "${trigger}" not implemented on endpoint.`);
			}
			// For ServerEvent, it's fine if the hook isn't implemented (no-op)
		}
		else {
			// Function-based handlers (ScheduledTask, QueuedTask)
			if (typeof handler !== "function") {
				throw new Error(`${scriptType} scripts must have a default export function.`);
			}
			await handler(input);
		}

		port.postMessage({ type: "EXECUTION_RESULT", payload: { status: "SUCCESS" } });
	}
	catch (error: unknown) {
		port.postMessage({
			type: "EXECUTION_RESULT",
			payload: { status: "ERROR", error: (error as Error).message },
		});
	}
	finally {
		port.close();
	}
};
