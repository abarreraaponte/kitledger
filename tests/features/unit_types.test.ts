import { describe, test, expect } from "vitest";
import { postgresUrl, postgresConfig } from "../test_config";
import { UnitTypes, UnitTypeFactory, createDatabase } from "../../packages/core/main";

createDatabase({
	postgresUrl,
	maxConnections: postgresConfig.max_connections,
});

const SUCCESS_REF_ID = `T${Math.floor(Math.random() * 9999)}`;

// Using .sequential to maintain similar execution order to Deno's default for interdependent tests.
describe.sequential("UnitType API", () => {
	test("Create a valid unit type", async () => {
		const unitTypePayload = new UnitTypeFactory().make();
		unitTypePayload.ref_id = SUCCESS_REF_ID;

		const res = await UnitTypes.create(unitTypePayload);

		expect(res.id).toHaveLength(36);
		expect(res.ref_id).toBe(SUCCESS_REF_ID);
	});

	test("Invalid name fails validation", async () => {
		const unitTypePayload = new UnitTypeFactory().make();
		unitTypePayload.name = "A".repeat(256);

		const res = await UnitTypes.validateCreation(unitTypePayload);

		expect(res.success).toBe(false);
	});

	test("Repeated Ref ID fails validation", async () => {
		const unitTypePayload = new UnitTypeFactory().make();
		unitTypePayload.ref_id = SUCCESS_REF_ID;

		const res = await UnitTypes.validateCreation(unitTypePayload);

		expect(res.success).toBe(false);
	});
});
