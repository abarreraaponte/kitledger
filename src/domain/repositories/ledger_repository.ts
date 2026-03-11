import { Ledger } from "../types/ledger_types.ts";
import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { ledgers, unit_models } from "../../services/database/schema.ts";
import { db } from "../../services/database/db.ts";
import {
	ANY,
	defaultLimit,
	defaultOffset,
	FilterOperationParameters,
	GetOperationResult,
	maxLimit,
	parseBooleanFilterValue,
} from "../../services/database/helpers.ts";

export async function findUnitModelId(unitTypeId: string): Promise<string | null> {
	const unitModel = await db.query.unit_models.findFirst({
		where: and(
			or(
				eq(sql`${unit_models.id}::text`, unitTypeId),
				eq(unit_models.ref_id, unitTypeId),
				eq(unit_models.alt_id, unitTypeId),
			),
			eq(unit_models.active, true),
		),
		columns: { id: true },
	});
	return unitModel ? unitModel.id : null;
}

export async function filterLedgers(params: FilterOperationParameters): Promise<GetOperationResult<Ledger>> {
	const { limit = defaultLimit, offset = defaultOffset, ...filters } = params;

	const filterConditions: SQL<unknown>[] = [];

	for (const [key, value] of Object.entries(filters)) {
		if (key === ledgers.id.name && String(value).length > 0) {
			filterConditions.push(eq(ledgers.id, String(value)));
		}

		if (key === ledgers.ref_id.name && String(value).length > 0) {
			filterConditions.push(eq(ledgers.ref_id, String(value)));
		}

		if (key === ledgers.alt_id.name && String(value).length > 0) {
			filterConditions.push(eq(ledgers.alt_id, String(value)));
		}

		if (key === ledgers.name.name && String(value).length > 0) {
			filterConditions.push(sql`${ledgers.name} ILIKE ${"%" + String(value) + "%"}`);
		}

		if (key === ledgers.active.name && String(value).length > 0) {
			if (value === ANY) {
				continue;
			}
			const booleanValue = parseBooleanFilterValue(String(value));
			if (booleanValue !== null) {
				filterConditions.push(eq(ledgers.active, booleanValue));
			}
		}

		if (key === ledgers.unit_model_id.name && String(value).length > 0) {
			const unitModelId = await findUnitModelId(String(value));
			if (unitModelId) {
				filterConditions.push(eq(ledgers.unit_model_id, unitModelId));
			}
		}
	}

	// By default, only return active ledgers unless explicitly filtered otherwise
	if (!Object.keys(filters).includes(ledgers.active.name)) {
		filterConditions.push(eq(ledgers.active, true));
	}

	const results = await db.select().from(ledgers).where(and(...filterConditions))
		.limit(Math.min(limit, maxLimit))
		.offset(offset);

	return {
		data: results,
		limit: Math.min(limit, maxLimit),
		offset: offset,
		count: results.length,
	};
}
