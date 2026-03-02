import { timestamp } from "drizzle-orm/pg-core";
import * as v from "valibot";

/**
 * Common database helper for timestamps
 */
export const timestamps = {
	created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: "date" }),
};

/**
 * Supported operation types for get operations.
 */
export enum GetOperationType {
	FILTER = "filter",
	SEARCH = "search",
	QUERY = "query",
}

/**
 * Parameters for filter operations, including optional limit and offset.
 */
export type FilterOperationParameters = Record<string, string> & {
	limit?: number;
	offset?: number;
};

/**
 * Result structure for get operations, including data array and optional limit and offset.
 */
export type GetOperationResult<T> = {
	data: T[];
	count: number;
	limit?: number;
	offset?: number;
	errors?: { field?: string; message: string }[];
};

export type QueryResultRow = v.InferInput<typeof QueryResultRowSchema>;

export const QueryResultRowSchema = v.record(
	v.string(),
	v.union(
		[
			v.string(),
			v.number(),
			v.boolean(),
			v.date(),
			v.null(),
			v.record(
				v.string(),
				v.union(
					[
						v.string(),
						v.number(),
						v.boolean(),
						v.date(),
						v.null(),
					],
				),
			),
		],
	),
);

export const QueryResultSchema = v.array(QueryResultRowSchema);

/**
 * Utility function to parse boolean filter values from strings or booleans to be used in queries and filters.
 * @param value
 * @returns
 */
export function parseBooleanFilterValue(value: string | boolean): boolean | null {
	if (typeof value === "boolean") {
		return value;
	}
	const lowerValue = value.toLowerCase();
	if (lowerValue === "true") {
		return true;
	}
	if (lowerValue === "false") {
		return false;
	}
	return null;
}

/**
 * String constant representing a wildcard for boolean filters.
 */
export const ANY = "any";

/**
 * Default value for pagination limit.
 */
export const defaultLimit = 100;

/**
 * Maximum allowable value for pagination limit.
 */
export const maxLimit = 1000;

/**
 * Default value for pagination offset.
 */
export const defaultOffset = 0;
