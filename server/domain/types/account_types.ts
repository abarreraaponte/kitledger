import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as v from "valibot";
import { InferOutput } from "valibot";
import { accounts } from "../../services/database/schema.ts";

export enum BalanceType {
	DEBIT = "debit",
	CREDIT = "credit",
}

export const AccountCreateSchema = v.object({
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64)), null),
	balance_type: v.enum(BalanceType),
	ledger_id: v.string(),
	parent_id: v.optional(v.nullable(v.string())),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(64)),
	meta: v.nullish(v.record(v.string(), v.union([v.string(), v.number(), v.date(), v.boolean(), v.null()])), null),
	active: v.nullish(v.boolean(), true),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type AccountInsert = InferInsertModel<typeof accounts>;
export type Account = InferSelectModel<typeof accounts>;
export type AccountCreateData = InferOutput<typeof AccountCreateSchema>;
