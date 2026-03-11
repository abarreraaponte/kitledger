import { Account, BalanceType } from "../types/account_types.ts";
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
import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { accounts, ledgers } from "../../services/database/schema.ts";

/**
 * Procedurally builds and executes a filter query for accounts based on the provided parameters.
 * @param params
 * @returns
 */
export async function filterAccounts(params: FilterOperationParameters): Promise<GetOperationResult<Account>> {
	const { limit = defaultLimit, offset = defaultOffset, ...filters } = params;

	const filterConditions: SQL<unknown>[] = [];

	let ledgerId: string | null = null;

	for (const [key, value] of Object.entries(filters)) {
		if (key === accounts.id.name && String(value).length > 0) {
			filterConditions.push(eq(accounts.id, String(value)));
		}

		if (key === accounts.ref_id.name && String(value).length > 0) {
			filterConditions.push(eq(accounts.ref_id, String(value)));
		}

		if (key === accounts.alt_id.name && String(value).length > 0) {
			filterConditions.push(eq(accounts.alt_id, String(value)));
		}

		if (key === accounts.balance_type.name && String(value).length > 0) {
			filterConditions.push(eq(accounts.balance_type, String(value) as BalanceType));
		}

		if (key === accounts.name.name && String(value).length > 0) {
			filterConditions.push(sql`${accounts.name} ILIKE ${"%" + String(value) + "%"}`);
		}

		if (key === accounts.ledger_id.name && String(value).length > 0) {
			ledgerId = await findLedgerId(String(value));
			if (ledgerId) {
				filterConditions.push(eq(accounts.ledger_id, ledgerId));
			}
		}

		if (key === accounts.active.name && String(value).length > 0) {
			if (value === ANY) {
				continue;
			}
			const booleanValue = parseBooleanFilterValue(String(value));
			if (booleanValue !== null) {
				filterConditions.push(eq(accounts.active, booleanValue));
			}
		}

		if (key === accounts.parent_id.name && String(value).length > 0) {
			const parentAccount = await findParentAccount(String(value), null);
			if (parentAccount) {
				filterConditions.push(eq(accounts.parent_id, parentAccount.id));
			}
			else {
				filterConditions.push(eq(sql`${accounts.parent_id}::text`, value));
			}
		}
	}

	// Default to only active accounts if no active filter is provided
	if (!Object.keys(filters).includes(accounts.active.name)) {
		filterConditions.push(eq(accounts.active, true));
	}

	const results = await db.select().from(accounts).where(and(...filterConditions))
		.limit(Math.min(limit, maxLimit))
		.offset(offset);

	return {
		data: results,
		limit: Math.min(limit, maxLimit),
		offset: offset,
		count: results.length,
	};
}

/**
 * Finds the parent account by ID or ref_id or alt_id.
 * Returns the ID of the parent account if found, otherwise returns null.
 */
export async function findParentAccount(parentId: string, ledgerId?: string | null): Promise<Account | null> {
	if (!parentId) {
		return null;
	}
	const parent = await db.query.accounts.findFirst({
		where: and(
			or(
				eq(sql`${accounts.id}::text`, parentId),
				eq(accounts.ref_id, parentId),
				eq(accounts.alt_id, parentId),
			),
			ledgerId ? eq(accounts.ledger_id, ledgerId) : undefined,
			eq(accounts.active, true),
		),
	});
	return parent ? parent : null;
}

/**
 * Finds the ledger by ID or ref_id or alt_id.
 * @param ledgerId
 * @returns
 */
export async function findLedgerId(ledgerId: string): Promise<string | null> {
	const ledger = await db.query.ledgers.findFirst({
		where: and(
			or(
				eq(sql`${ledgers.id}::text`, ledgerId),
				eq(ledgers.ref_id, ledgerId),
				eq(ledgers.alt_id, ledgerId),
			),
			eq(ledgers.active, true),
		),
		columns: { id: true },
	});
	return ledger ? ledger.id : null;
}
