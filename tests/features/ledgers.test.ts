import { describe, test, expect } from "vitest";
import { postgresUrl, postgresConfig } from "../test_config";
import { UnitTypes, Ledgers, LedgerFactory, UnitTypeFactory, createDatabase } from "../../packages/core/main";

createDatabase({
	postgresUrl,
	maxConnections: postgresConfig.max_connections,
});

const uom_type = await UnitTypes.create(new UnitTypeFactory().make());

const SUCCESS_REF_ID = `T${Math.floor(Math.random() * 9999)}`;

// Using .sequential to maintain similar execution order to Deno's default for interdependent tests.
describe.sequential("Ledger API", () => {
	test("Create a valid ledger", async () => {
		const ledgerPayload = new LedgerFactory().make();
		ledgerPayload.ref_id = SUCCESS_REF_ID;
		ledgerPayload.unit_type_id = uom_type.id; // Use the id from the setup uom_type

		const res = await Ledgers.create(ledgerPayload);

		expect(res.id).toHaveLength(36);
		expect(res.ref_id).toBe(SUCCESS_REF_ID);
	});

	test("Invalid name fails validation", async () => {
		const ledgerPayload = new LedgerFactory().make();
		ledgerPayload.name = "A".repeat(256);
		ledgerPayload.unit_type_id = uom_type.id;

		const res = await Ledgers.validateCreation(ledgerPayload);

		expect(res.success).toBe(false);
	});

	test("Repeated Ref ID fails validation", async () => {
		const ledgerPayload = new LedgerFactory().make();
		ledgerPayload.ref_id = SUCCESS_REF_ID;
		ledgerPayload.unit_type_id = uom_type.id;

		const res = await Ledgers.validateCreation(ledgerPayload);

		expect(res.success).toBe(false);
	});
});
