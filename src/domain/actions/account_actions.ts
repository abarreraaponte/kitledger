import { Account, AccountCreateData, AccountCreateSchema, AccountInsert } from "../types/account_types.ts";
import * as v from "valibot";
import {
	parseValibotIssues,
	ValidationError,
	ValidationFailure,
	ValidationResult,
	ValidationSuccess,
} from "../utils/validation.ts";
import { accounts } from "../../services/database/schema.ts";
import { db } from "../../services/database/db.ts";
import { eq } from "drizzle-orm";
import { generate as v7 } from "@std/uuid/unstable-v7";
import { findLedgerId, findParentAccount } from "../repositories/account_repository.ts";

async function refIdAlreadyExists(refId: string): Promise<boolean> {
	const results = await db.query.accounts.findMany({
		where: eq(accounts.ref_id, refId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function altIdAlreadyExists(altId: string | null): Promise<boolean> {
	if (!altId) {
		return false;
	}
	const results = await db.query.accounts.findMany({
		where: eq(accounts.alt_id, altId),
		columns: { id: true },
	});
	return results.length > 0;
}

async function validateAccountCreate(
	data: AccountCreateData,
): Promise<ValidationResult<AccountCreateData>> {
	const result = v.safeParse(AccountCreateSchema, data);
	let success = result.success;

	if (!result.success) {
		return { success: false, errors: parseValibotIssues(result.issues) };
	}

	const errors: ValidationError[] = [];

	const [refIdError, altIdError, ledgerId] = await Promise.all([
		refIdAlreadyExists(result.output.ref_id),
		altIdAlreadyExists(result.output.alt_id ?? null),
		findLedgerId(result.output.ledger_id),
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

	if (ledgerId) {
		result.output.ledger_id = ledgerId;
	}
	else {
		success = false;
		errors.push({
			type: "data",
			path: "ledger_id",
			message: "Invalid ledger ID.",
		});
	}

	if (result.output.parent_id) {
		const parentAccount = await findParentAccount(result.output.parent_id, result.output.ledger_id);
		if (parentAccount) {
			result.output.parent_id = result.output.parent_id ? parentAccount.id : null;
			result.output.balance_type = parentAccount.balance_type;
		}
		else {
			success = false;
			errors.push({
				type: "data",
				path: "parent_id",
				message: "Invalid parent account ID.",
			});
		}
	}

	return { success, data: result.output, errors: errors };
}

export async function createAccount(
	data: AccountCreateData,
): Promise<ValidationSuccess<Account> | ValidationFailure<AccountCreateData>> {
	const validation = await validateAccountCreate(data);

	if (!validation.success || !validation.data) {
		return {
			success: false,
			data: data,
			errors: validation.errors,
		};
	}

	const insertData: AccountInsert = {
		id: v7(),
		...validation.data,
	};

	const result = await db.insert(accounts).values(insertData).returning();

	if (result.length === 0) {
		return {
			success: false,
			data: validation.data,
			errors: [{
				type: "data",
				path: null,
				message: "Failed to create account.",
			}],
		};
	}

	return {
		success: true,
		data: result[0],
	};
}
