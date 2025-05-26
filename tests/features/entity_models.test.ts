import { describe, test, expect } from "vitest";
import { postgresUrl, postgresConfig } from "../test_config";
import { EntityModels, EntityModelFactory, createDatabase } from "../../packages/core/main";

createDatabase({
	postgresUrl,
	maxConnections: postgresConfig.max_connections,
});

const SUCCESS_REF_ID = `T${Math.floor(Math.random() * 9999)}`;

// Using .sequential to maintain similar execution order to Deno's default for interdependent tests.
describe.sequential("EntityModel API", () => {
	test("Create a valid entity model", async () => {
		const entityModelPayload = new EntityModelFactory().make();
		entityModelPayload.ref_id = SUCCESS_REF_ID;

		const res = await EntityModels.create(entityModelPayload);
		expect(res.id).toHaveLength(36);
		expect(res.ref_id).toBe(SUCCESS_REF_ID);
	});

	test("Invalid name fails validation", async () => {
		const entityModelPayload = new EntityModelFactory().make();
		entityModelPayload.name = "A".repeat(256);

		const res = await EntityModels.validateCreation(entityModelPayload);

		expect(res.success).toBe(false);
	});

	test("Repeated Ref ID fails validation", async () => {
		const entityModelPayload = new EntityModelFactory().make();
		entityModelPayload.ref_id = SUCCESS_REF_ID;

		const res = await EntityModels.validateCreation(entityModelPayload);
		expect(res.success).toBe(false);
	});
});
