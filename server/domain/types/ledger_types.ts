import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as v from "valibot";
import { InferOutput } from "valibot";
import { ledgers } from "../../services/database/schema.ts";

export const LedgerCreateSchema = v.object({
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64)), null),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(64)),
	description: v.nullable(v.pipe(v.string(), v.maxLength(255))),
	unit_model_id: v.string(),
	active: v.nullish(v.boolean(), true),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type LedgerInsert = InferInsertModel<typeof ledgers>;
export type Ledger = InferSelectModel<typeof ledgers>;
export type LedgerCreateData = InferOutput<typeof LedgerCreateSchema>;
