import { UnitModel } from "../types/unit_model_types.ts";
import { and, eq, type SQL, sql } from "drizzle-orm";
import { unit_models } from "../../services/database/schema.ts";
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

export async function filterUnitModels(params: FilterOperationParameters): Promise<GetOperationResult<UnitModel>> {
	const { limit = defaultLimit, offset = defaultOffset, ...filters } = params;

	const filterConditions: SQL<unknown>[] = [];

	for (const [key, value] of Object.entries(filters)) {
		if (key === unit_models.id.name && String(value).length > 0) {
			filterConditions.push(eq(unit_models.id, String(value)));
		}

		if (key === unit_models.ref_id.name && String(value).length > 0) {
			filterConditions.push(eq(unit_models.ref_id, String(value)));
		}

		if (key === unit_models.alt_id.name && String(value).length > 0) {
			filterConditions.push(eq(unit_models.alt_id, String(value)));
		}

		if (key === unit_models.name.name && String(value).length > 0) {
			filterConditions.push(sql`${unit_models.name} ILIKE ${"%" + String(value) + "%"}`);
		}

		if (key === unit_models.active.name && String(value).length > 0) {
			if (value === ANY) {
				continue;
			}
			const booleanValue = parseBooleanFilterValue(String(value));
			if (booleanValue !== null) {
				filterConditions.push(eq(unit_models.active, booleanValue));
			}
		}
	}

	// By default, only return active unit models
	if (!Object.keys(filters).includes(unit_models.active.name)) {
		filterConditions.push(eq(unit_models.active, true));
	}

	const results = await db.select().from(unit_models)
		.where(and(...filterConditions))
		.limit(Math.min(limit, maxLimit))
		.offset(offset);

	return {
		data: results,
		limit: Math.min(limit, maxLimit),
		offset: offset,
		count: results.length,
	};
}
