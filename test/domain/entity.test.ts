import { assert } from "@std/assert";
import { afterAll, describe, it } from "@std/testing/bdd";
import { db } from "../../src/services/database/db.ts";
import { createEntityModel } from "../../src/domain/actions/entity_model_actions.ts";
import { EntityModelFactory } from "../../src/domain/factories/entity_factories.ts";

describe("Entity Domain Tests", () => {
	afterAll(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	it("Can create a valid entity model", async () => {
		const entityModelFactory = new EntityModelFactory();
		const entityModelData = entityModelFactory.make(1)[0];
		entityModelData.active = true;
		const entityModelResult = await createEntityModel(entityModelData);

		if (entityModelResult.success === false) {
			throw new Error("Failed to create Entity Model");
		}

		assert(entityModelResult.success === true);
	});

	it("Applies entity model validation correctly", async () => {
		const entityModelFactory = new EntityModelFactory();
		const entityModelData = entityModelFactory.make(1)[0];
		const entityModelResult = await createEntityModel(entityModelData);

		if (entityModelResult.success === false) {
			throw new Error("Failed to create Entity Model");
		}

		const missingNameEntityModel = entityModelFactory.make(1)[0];
		missingNameEntityModel.name = "";
		const missingNameEntityModelResult = await createEntityModel(missingNameEntityModel);

		assert(missingNameEntityModelResult.success === false);

		const duplicateIdsEntityModel = entityModelFactory.make(1)[0];
		duplicateIdsEntityModel.id = entityModelResult.data.id;
		duplicateIdsEntityModel.ref_id = entityModelResult.data.ref_id;
		duplicateIdsEntityModel.alt_id = entityModelResult.data.alt_id;
		const duplicateIdsEntityModelResult = await createEntityModel(duplicateIdsEntityModel);

		assert(duplicateIdsEntityModelResult.success === false);
	});
});
