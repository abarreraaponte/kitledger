import { ThreadWorker } from "@poolifier/poolifier-web-worker";
import { hashPassword } from "../../domain/utils/crypto.ts";

export enum availableWorkerTasks {
	HASH_PASSWORD = "HASH_PASSWORD",
}

const tasks = {
	[availableWorkerTasks.HASH_PASSWORD]: async (data: string | undefined) => {
		if (data) {
			return await hashPassword(data);
		}
	},
};

export default new ThreadWorker(tasks, { maxInactiveTime: 60000 });
