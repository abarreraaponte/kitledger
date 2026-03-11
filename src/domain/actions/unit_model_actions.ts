import { UnitModel, UnitModelCreateData, UnitModelCreateSchema, UnitModelInsert } from "../types/unit_model_types.ts";
import * as v from "valibot";
import {
	parseValibotIssues,
	ValidationError,
	ValidationFailure,
	ValidationResult,
	ValidationSuccess,
} from "../utils/validation.ts";
import { db } from "../../services/database/db.ts";
import { unit_models } from "../../services/database/schema.ts";
import { eq } from "drizzle-orm";
import { generate as v7 } from "@std/uuid/unstable-v7";

async function refIdAlreadyExists(refId: string): Promise<boolean> {
	const results = await db.query.unit_models.findMany({
		where: eq(unit_models.ref_id, refId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function altIdAlreadyExists(altId: string | null): Promise<boolean> {
	if (!altId) {
		return false;
	}
	const results = await db.query.unit_models.findMany({
		where: eq(unit_models.alt_id, altId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function validateUnitModelCreate(data: UnitModelCreateData): Promise<ValidationResult<UnitModelCreateData>> {
	const result = v.safeParse(UnitModelCreateSchema, data);
	let success = result.success;

	if (!result.success) {
		return {
			success: false,
			errors: parseValibotIssues(result.issues),
		};
	}

	const errors: ValidationError[] = [];

	const [refIdError, altIdError] = await Promise.all([
		refIdAlreadyExists(data.ref_id),
		altIdAlreadyExists(data.alt_id ?? null),
	]);

	if (refIdError) {
		success = false;
		errors.push({
			type: "data",
			path: "ref_id",
			message: "Ref ID already exists.",
		});
	}

	if (altIdError) {
		success = false;
		errors.push({
			type: "data",
			path: "alt_id",
			message: "Alt ID already exists.",
		});
	}

	return {
		success: success,
		data: result.output,
		errors: errors,
	};
}

export async function createUnitModel(
	data: UnitModelCreateData,
): Promise<ValidationSuccess<UnitModel> | ValidationFailure<UnitModelCreateData>> {
	const validation = await validateUnitModelCreate(data);

	if (!validation.success || !validation.data) {
		return {
			success: false,
			data: data,
			errors: validation.errors,
		};
	}

	const insert_data: UnitModelInsert = {
		id: v7(),
		...validation.data,
	};

	const result = await db.insert(unit_models).values(insert_data).returning();

	if (result.length === 0) {
		return {
			success: false,
			data: validation.data,
			errors: [{
				type: "data",
				path: null,
				message: "Failed to create unit model.",
			}],
		};
	}

	return {
		success: true,
		data: result[0],
	};
}
