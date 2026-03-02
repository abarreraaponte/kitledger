import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { entity_models } from "../../services/database/schema.ts";
import { InferOutput } from "valibot";
import * as v from "valibot";

export const EntityModelCreateSchema = v.object({
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64)), null),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(64)),
	active: v.nullish(v.boolean(), true),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type EntityModelInsert = InferInsertModel<typeof entity_models>;
export type EntityModel = InferSelectModel<typeof entity_models>;
export type EntityModelCreateData = InferOutput<typeof EntityModelCreateSchema>;
