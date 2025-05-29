import { getDbInstance } from '../services/database/db.ts';
import { BalanceType, kl_core_accounts, kl_core_ledgers } from '../services/database/schema.ts';
import z from 'zod/v4';
import { eq, or } from 'drizzle-orm';
import { valueIsAvailable } from '../utils/validation.ts';
import { validate as validateUuid } from '@std/uuid';
import { type NewAccount } from '../types/index.ts';

/**
 * Check if the name is available
 * @param name
 * @returns Promise<boolean>
 */
async function nameIsAvailable(name: string): Promise<boolean> {
	return await valueIsAvailable(kl_core_accounts, 'name', name);
}

/**
 * Check if the ref_id is available
 * @param ref_id
 * @returns :Promise<boolean>
 */
async function refIdIsAvailable(ref_id: string): Promise<boolean> {
	return await valueIsAvailable(kl_core_accounts, 'ref_id', ref_id);
}

/**
 * Check if the alt_id is available
 * @param alt_id
 * @returns :Promise<boolean>
 */
async function altIdIsAvailable(alt_id: string): Promise<boolean> {
	return await valueIsAvailable(kl_core_accounts, 'alt_id', alt_id);
}

/**
 * Validate the creation of a new account
 * @param data
 * @returns Promise<z.SafeParseResult<NewAccount, z.ZodError>>
 */
async function validateCreation(data: NewAccount) {
	const db = getDbInstance();
	const validationSchema = z
		.object({
			id: z.uuid(),
			ref_id: z
				.string()
				.max(64, { error: 'Ref ID must be less than 64 characters' })
				.refine(refIdIsAvailable, {
					error: 'Ref ID already exists',
				})
				.optional()
				.nullable(),
			alt_id: z
				.string()
				.max(64, { error: 'Alt ID must be less than 64 characters' })
				.refine(altIdIsAvailable, {
					error: 'Alt ID already exists',
				})
				.optional()
				.nullable(),
			name: z.string().max(255, { error: 'Name must be less than 255 characters' }).refine(nameIsAvailable, {
				error: 'Name already exists',
			}),
			balance_type: z.enum([BalanceType.DEBIT, BalanceType.CREDIT]).optional().nullable(),
			ledger_id: z.string().optional().nullable(),
			parent_id: z.uuid().optional().nullable(),
			meta: z.any().optional().nullable(),
			active: z.boolean().optional().nullable(),
		})
		.superRefine(async (data, ctx) => {
			if (data.parent_id) {
				const is_uuid = validateUuid(data.parent_id);

				const filters = is_uuid
					? {
						where: eq(kl_core_accounts.id, data.parent_id),
					}
					: {
						where: or(
							eq(kl_core_accounts.ref_id, data.parent_id),
							eq(kl_core_accounts.alt_id, data.parent_id),
						),
					};

				// Verify that parent_id exists
				const parent = await db.query.kl_core_accounts.findFirst(filters);
				if (!parent) {
					ctx.addIssue({
						path: ['parent_id'],
						error: 'Parent ID does not exist',
						code: z.ZodIssueCode.custom,
					});
				} else {
					// override balance_type, ledger_id and active with the equivalent values from the parent.
					data.balance_type = parent.balance_type;
					data.ledger_id = parent.ledger_id;
					data.active = parent.active;
				}
			} else {
				// Require balance_type and ledger_id if parent_id is not provided
				if (!data.balance_type) {
					ctx.addIssue({
						path: ['balance_type'],
						error: 'balance_type is required when parent_id is not provided',
						code: z.ZodIssueCode.custom,
					});
				}

				if (!data.ledger_id) {
					ctx.addIssue({
						path: ['ledger_id'],
						error: 'ledger_id is required when parent_id is not provided',
						code: z.ZodIssueCode.custom,
					});
				} else {
					const is_uuid = validateUuid(data.ledger_id);

					const filters = is_uuid ? { where: eq(kl_core_ledgers.id, data.ledger_id) } : {
						where: or(
							eq(kl_core_ledgers.ref_id, data.ledger_id),
							eq(kl_core_ledgers.alt_id, data.ledger_id),
						),
					};

					const ledger = await db.query.kl_core_ledgers.findFirst(filters);

					if (!ledger) {
						ctx.addIssue({
							path: ['ledger_id'],
							error: 'Ledger ID does not exist',
							code: z.ZodIssueCode.custom,
						});
					} else {
						data.ledger_id = ledger.id;
					}
				}
			}
		});

	return await validationSchema.safeParseAsync(data);
}

/**
 * Create a new account
 * @param data
 * @returns Promise<InferSelectModel<typeof accounts>>
 */
async function create(data: NewAccount)  {
	const db = getDbInstance();
	const result = await db.insert(kl_core_accounts).values(data).returning();
	return result[0];
}

/**
 * Export a namespaced object with the functions
 */
export const Accounts = {
	create,
	validateCreation,
};
