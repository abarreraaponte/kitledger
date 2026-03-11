import { assert } from "@std/assert";
import { afterAll, describe, it } from "@std/testing/bdd";
import { db } from "../../src/services/database/db.ts";
import { createLedger } from "../../src/domain/actions/ledger_actions.ts";
import { createAccount } from "../../src/domain/actions/account_actions.ts";
import { AccountFactory, LedgerFactory } from "../../src/domain/factories/ledger_factories.ts";
import { UnitModelFactory } from "../../src/domain/factories/unit_factories.ts";
import { createUnitModel } from "../../src/domain/actions/unit_model_actions.ts";
import { generate } from "@std/uuid/unstable-v7";

describe("Ledger Domain Tests", () => {
	afterAll(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	it("Can create a valid ledger", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if (
			unitModelResult.success === false || !unitModelResult.data ||
			!Object.keys(unitModelResult.data).includes("id")
		) {
			throw new Error("Failed to create Unit Model");
		}

		const ledgerFactory = new LedgerFactory();
		const ledgerData = ledgerFactory.make(1)[0];
		ledgerData.unit_model_id = unitModelResult.data.id;
		const ledgerResult = await createLedger(ledgerData);

		if (ledgerResult.success === false) {
			throw new Error("Failed to create Ledger");
		}

		assert(ledgerResult.success === true);
	});

	it("Applies ledger validation correctly", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		const ledgerFactory = new LedgerFactory();
		const ledgerData = ledgerFactory.make(1)[0];
		ledgerData.unit_model_id = unitModelResult.data.id;
		ledgerData.alt_id = generate();
		await createLedger(ledgerData);

		const missingNameLedger = ledgerFactory.make(1)[0];
		missingNameLedger.unit_model_id = unitModelResult.data.id;
		missingNameLedger.name = "";
		const missingNameLedgerResult = await createLedger(missingNameLedger);

		assert(missingNameLedgerResult.success === false);
		assert(missingNameLedgerResult.errors?.some((e) => e.type === "structure"));

		const duplicateIdsLedger = ledgerFactory.make(1)[0];
		duplicateIdsLedger.unit_model_id = unitModelResult.data.id;
		duplicateIdsLedger.ref_id = ledgerData.ref_id;
		duplicateIdsLedger.alt_id = ledgerData.alt_id;
		const duplicateIdsResult = await createLedger(duplicateIdsLedger);

		assert(duplicateIdsResult.success === false);
		assert(duplicateIdsResult.errors?.some((e) => e.type === "data"));
	});

	it("Can create a valid account", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		const ledgerFactory = new LedgerFactory();
		const ledgerData = ledgerFactory.make(1)[0];
		ledgerData.unit_model_id = unitModelResult.data.id;
		ledgerData.alt_id = generate();
		const ledgerResult = await createLedger(ledgerData);

		if (ledgerResult.success === false) {
			throw new Error("Failed to create Ledger");
		}

		const accountFactory = new AccountFactory();
		const accountData = accountFactory.make(1)[0];
		accountData.ledger_id = ledgerResult.data.id;
		accountData.parent_id = null;
		const accountResult = await createAccount(accountData);

		assert(accountResult.success === true);

		const missingNameAccount = accountFactory.make(1)[0];
		missingNameAccount.ledger_id = ledgerResult.data.id;
		missingNameAccount.name = "";
		const missingNameAccountResult = await createAccount(missingNameAccount);

		assert(missingNameAccountResult.success === false);
		assert(missingNameAccountResult.errors?.some((e) => e.type === "structure"));

		const duplicateIdsAccount = accountFactory.make(1)[0];
		duplicateIdsAccount.ledger_id = ledgerResult.data.id;
		duplicateIdsAccount.ref_id = accountData.ref_id;
		duplicateIdsAccount.alt_id = accountData.alt_id;
		const duplicateIdsResult = await createAccount(duplicateIdsAccount);

		assert(duplicateIdsResult.success === false);
		assert(duplicateIdsResult.errors?.some((e) => e.type === "data"));
	});
});
