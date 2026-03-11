import { assert } from "@std/assert";
import { afterAll, describe, it } from "@std/testing/bdd";
import { db } from "../../src/services/database/db.ts";
import { UnitModelFactory } from "../../src/domain/factories/unit_factories.ts";
import { createUnitModel } from "../../src/domain/actions/unit_model_actions.ts";

describe("Unit Domain Tests", () => {
	afterAll(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	it("Can create a valid unit model", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		assert(unitModelResult.success === true);
	});

	it("Applies unit model validation correctly", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		const missingNameUnitModel = unitModelFactory.make(1)[0];
		missingNameUnitModel.name = "";
		const missingNameUnitModelResult = await createUnitModel(missingNameUnitModel);

		assert(missingNameUnitModelResult.success === false);

		const duplicateIdsUnitModel = unitModelFactory.make(1)[0];
		duplicateIdsUnitModel.id = unitModelResult.data.id;
		duplicateIdsUnitModel.ref_id = unitModelResult.data.ref_id;
		duplicateIdsUnitModel.alt_id = unitModelResult.data.alt_id;
		const duplicateIdsUnitModelResult = await createUnitModel(duplicateIdsUnitModel);

		assert(duplicateIdsUnitModelResult.success === false);
	});
});
