import { faker } from "@faker-js/faker";
import { EntityModel } from "../types/entity_model_types.ts";
import { BaseFactory } from "../factories/base_factory.ts";

export class EntityModelFactory extends BaseFactory<EntityModel> {
	constructor() {
		super(makeEntityModel);
	}
}

const makeEntityModel = (): EntityModel => ({
	id: faker.string.uuid(),
	ref_id: faker.string.alphanumeric(10),
	name: faker.company.name(),
	alt_id: faker.datatype.boolean() ? faker.string.alphanumeric(8) : null,
	active: faker.datatype.boolean(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});
