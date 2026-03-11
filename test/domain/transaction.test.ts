import { assert } from "@std/assert";
import { afterAll, describe, it } from "@std/testing/bdd";
import { db } from "../../src/services/database/db.ts";
import { createTransactionModel } from "../../src/domain/actions/transaction_model_actions.ts";
import { TransactionModelFactory } from "../../src/domain/factories/transaction_factories.ts";

describe("Transaction Domain Tests", () => {
	afterAll(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	it("Can create a valid transaction model", async () => {
		const transactionModelFactory = new TransactionModelFactory();
		const transactionModelData = transactionModelFactory.make(1)[0];
		transactionModelData.active = true;
		const transactionModelResult = await createTransactionModel(transactionModelData);

		if (transactionModelResult.success === false) {
			throw new Error("Failed to create Transaction Model");
		}

		assert(transactionModelResult.success === true);
	});

	it("Applies transaction model validation correctly", async () => {
		const transactionModelFactory = new TransactionModelFactory();
		const transactionModelData = transactionModelFactory.make(1)[0];
		const transactionModelResult = await createTransactionModel(transactionModelData);

		if (transactionModelResult.success === false) {
			throw new Error("Failed to create Transaction Model");
		}

		const missingNameTransactionModel = transactionModelFactory.make(1)[0];
		missingNameTransactionModel.name = "";
		const missingNameTransactionModelResult = await createTransactionModel(missingNameTransactionModel);

		assert(missingNameTransactionModelResult.success === false);

		const duplicateIdsTransactionModel = transactionModelFactory.make(1)[0];
		duplicateIdsTransactionModel.id = transactionModelResult.data.id;
		duplicateIdsTransactionModel.ref_id = transactionModelResult.data.ref_id;
		duplicateIdsTransactionModel.alt_id = transactionModelResult.data.alt_id;
		const duplicateIdsTransactionModelResult = await createTransactionModel(duplicateIdsTransactionModel);

		assert(duplicateIdsTransactionModelResult.success === false);
	});
});
