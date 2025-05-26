import { describe, test, expect } from "vitest";
import { postgresUrl, postgresConfig } from "../test_config";
import { Ledgers, UnitTypes, Accounts, AccountFactory, LedgerFactory, UnitTypeFactory, createDatabase } from "../../packages/core/main";

createDatabase({
	postgresUrl,
	maxConnections: postgresConfig.max_connections,
});

const sample_ledger_data = new LedgerFactory().make();
const uom_type_array = await UnitTypes.create(new UnitTypeFactory().make());
sample_ledger_data.unit_type_id = uom_type_array.id;
const ledger = await Ledgers.create(sample_ledger_data);

const SUCCESS_REF_ID = `T${Math.floor(Math.random() * 9999)}`;

// Using .sequential to maintain similar execution order to Deno's default for interdependent tests.
describe.sequential("Account API", () => {
	test("Create a valid account", async () => {
		const accountPayload = new AccountFactory().make();
		accountPayload.ref_id = SUCCESS_REF_ID;
		accountPayload.ledger_id = ledger.id;

		const res = await Accounts.create(accountPayload);
		expect(res.id).toHaveLength(36);
		expect(res.ref_id).toBe(SUCCESS_REF_ID);
	});

	test("Invalid name fails validation", async () => {
		const accountPayload = new AccountFactory().make();
		accountPayload.name = "A".repeat(256);
		accountPayload.ledger_id = ledger.id;

		const res = await Accounts.validateCreation(accountPayload);
		expect(res.success).toBe(false);
	});

	test("Repeated Ref ID fails validation", async () => {
		const accountPayload = new AccountFactory().make();
		accountPayload.ref_id = SUCCESS_REF_ID;
		accountPayload.ledger_id = ledger.id;

		const res = await Accounts.validateCreation(accountPayload);

		expect(res.success).toBe(false);
	});
});
