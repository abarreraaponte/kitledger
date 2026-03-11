import { Ledger, LedgerCreateData, LedgerCreateSchema, LedgerInsert } from "../types/ledger_types.ts";
import * as v from "valibot";
import {
	parseValibotIssues,
	ValidationError,
	ValidationFailure,
	ValidationResult,
	ValidationSuccess,
} from "../utils/validation.ts";
import { db } from "../../services/database/db.ts";
import { ledgers } from "../../services/database/schema.ts";
import { eq } from "drizzle-orm";
import { generate as v7 } from "@std/uuid/unstable-v7";
import { findUnitModelId } from "../repositories/ledger_repository.ts";

async function refIdAlreadyExists(refId: string): Promise<boolean> {
	const results = await db.query.ledgers.findMany({
		where: eq(ledgers.ref_id, refId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function altIdAlreadyExists(altId: string | null): Promise<boolean> {
	if (!altId) {
		return false;
	}
	const results = await db.query.ledgers.findMany({
		where: eq(ledgers.alt_id, altId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function validateLedgerCreate(data: LedgerCreateData): Promise<ValidationResult<LedgerCreateData>> {
	const result = v.safeParse(LedgerCreateSchema, data);
	let success = result.success;

	if (!result.success) {
		return {
			success: false,
			errors: parseValibotIssues(result.issues),
		};
	}

	const errors: ValidationError[] = [];

	const [refIdError, altIdError, unitModelId] = await Promise.all([
		refIdAlreadyExists(data.ref_id),
		altIdAlreadyExists(data.alt_id ?? null),
		findUnitModelId(data.unit_model_id),
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

	if (unitModelId) {
		result.output.unit_model_id = unitModelId;
	}
	else {
		success = false;
		errors.push({
			type: "data",
			path: "unit_model_id",
			message: "Unit type ID does not exist or is inactive.",
		});
	}

	return {
		success: success,
		data: result.output,
		errors: errors,
	};
}

export async function createLedger(
	data: LedgerCreateData,
): Promise<ValidationSuccess<Ledger> | ValidationFailure<LedgerCreateData>> {
	const validation = await validateLedgerCreate(data);

	if (!validation.success || !validation.data) {
		return {
			success: false,
			data: data,
			errors: validation.errors,
		};
	}

	const insertData: LedgerInsert = {
		id: v7(),
		...validation.data,
	};

	const result = await db.insert(ledgers).values(insertData).returning();

	if (result.length === 0) {
		return {
			success: false,
			data: validation.data,
			errors: [{
				type: "data",
				path: null,
				message: "Failed to create ledger.",
			}],
		};
	}

	return {
		success: true,
		data: result[0],
	};
}
