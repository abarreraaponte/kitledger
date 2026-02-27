import { PgTable } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import { parseValibotIssues, ValidationResult } from "../../domain/utils/validation.ts";
import { db } from "./db.ts";
import {
	defaultLimit,
	defaultOffset,
	GetOperationResult,
	maxLimit,
	QueryResultRow,
	QueryResultSchema,
} from "./helpers.ts";
import * as v from "@valibot/valibot";
import knex, { Knex } from "knex";

/**
 * Maximum allowed nesting depth for filter groups to prevent overly complex queries.
 */
const MAX_NESTING_DEPTH = 5;

/**
 * Use valibot to validate and parse the incoming query parameters.
 * @param params
 * @returns
 */
function validateQueryParams(params: Query): ValidationResult<Query> {
	const result = v.safeParse(QuerySchema, params);

	if (!result.success) {
		return { success: false, errors: parseValibotIssues(result.issues) };
	}

	return { success: true, data: result.output };
}

/**
 * Prepares and executes a query against the specified table using the provided parameters.
 * @param table
 * @param params
 * @returns
 */
export async function executeQuery(table: PgTable, params: Query): Promise<GetOperationResult<QueryResultRow>> {
	const validationResult = validateQueryParams(params);
	const parsedParams = validationResult.success ? validationResult.data : null;

	if (!validationResult.success || !parsedParams) {
		console.error("Validation errors", validationResult.errors);
		return {
			data: [],
			count: 0,
			offset: 0,
			limit: 0,
			errors: validationResult.errors?.map((e) => ({ field: e.path || undefined, message: e.message })),
		};
	}

	try {
		const knexBuilder = knex({ client: "pg" });

		const limit = Math.min(parsedParams.limit ?? defaultLimit, maxLimit);
		const offset = parsedParams.offset ?? defaultOffset;

		const { sql, bindings } = buildQuery(knexBuilder, getTableName(table), params, limit, offset)
			.toSQL()
			.toNative();

		console.log("Executing query:", sql, bindings);

		const queryResult = await db.$client.unsafe(sql, bindings as string[]);

		console.log("Query result:", queryResult);

		const parsedQueryResult = v.safeParse(QueryResultSchema, queryResult);

		if (!parsedQueryResult.success) {
			console.error("Failed to parse query result", parsedQueryResult.issues);
			throw new Error("Failed to parse query result");
		}

		return {
			data: parsedQueryResult.output,
			count: parsedQueryResult.output.length ?? 0,
			offset: offset,
			limit: limit,
		};
	}
	catch (error) {
		return {
			data: [],
			count: 0,
			offset: 0,
			limit: 0,
			errors: [{ message: error instanceof Error ? error.message : "Query execution error" }],
		};
	}
}

/**
 * Recursively applies filters from a ConditionGroup to a Knex query builder.
 * @param queryBuilder
 * @param filterGroup
 * @param depth
 */
function applyFilters(queryBuilder: Knex.QueryBuilder, filterGroup: ConditionGroup, depth: number) {
	if (depth > MAX_NESTING_DEPTH) {
		throw new Error(`Query nesting depth exceeds the maximum of ${MAX_NESTING_DEPTH}.`);
	}

	// Use a nested 'where' to group conditions with parentheses, e.g., WHERE ( ... )
	queryBuilder.where(function () {
		for (const filter of filterGroup.conditions) {
			// Determine the chaining method (.where or .orWhere)
			const connector = filterGroup.connector;
			const method = filterGroup.connector === "or" ? "orWhere" : "where";

			// If the filter is another group, recurse
			if ("connector" in filter) {
				this[method](function () {
					// Pass the nested group directly and increment the depth
					applyFilters(this, filter, depth + 1);
				});
				continue;
			}

			// Apply the specific filter condition
			const { column, operator, value } = filter;
			switch (operator) {
				case "in": {
					const caseMethod = connector === "or" ? "orWhereIn" : "whereIn";
					this[caseMethod](column, value);
					break;
				}

				case "not_in": {
					const caseMethod = connector === "or" ? "orWhereNotIn" : "whereNotIn";
					this[caseMethod](column, value);
					break;
				}

				case "empty": {
					const caseMethod = connector === "or" ? "orWhereNull" : "whereNull";
					this[caseMethod](column);
					break;
				}

				case "not_empty": {
					const caseMethod = connector === "or" ? "orWhereNotNull" : "whereNotNull";
					this[caseMethod](column);
					break;
				}
				// Handles =, !=, >, <, etc.
				default: {
					this[method](column, operator, value);
					break;
				}
			}
		}
	});
}

/**
 * Builds a Knex query object from a QueryOptions configuration.
 * @param kx - The Knex instance.
 * @param tableName - The name of the table to query.
 * @param options - The QueryOptions object.
 * @returns A Knex QueryBuilder instance.
 */
export function buildQuery(
	kx: Knex,
	tableName: string,
	options: Query,
	limit: number,
	offset: number,
): Knex.QueryBuilder {
	let query: Knex.QueryBuilder;
	let fromClause: string = tableName;

	// 1. Process Recursive CTE (now with hardcoded conventions)
	if (options.recursive) {
		// Hardcoded conventions for simplicity
		const cteName = "hierarchy";
		const parentKey = "id";
		const childKey = "parent_id";

		fromClause = cteName; // The rest of the query will select FROM the CTE result.

		const { direction, startWith } = options.recursive;

		// Build the "anchor" query that finds the starting records.
		const anchorBuilder = kx.from(tableName).where((qb) => applyFilters(qb, startWith, 1));
		const { sql: anchorSql, bindings: anchorBindings } = anchorBuilder.toSQL().toNative();

		// Determine the join direction based on 'ancestors' or 'descendants'
		const [joinFrom, joinTo] = direction === "ancestors"
			? [`t."${parentKey}"`, `h."${childKey}"`] // To find a parent, match table's PK to hierarchy's FK
			: [`t."${childKey}"`, `h."${parentKey}"`]; // To find children, match table's FK to hierarchy's PK

		const cteBodySql = `
            (${anchorSql})
            UNION ALL
            SELECT t.*
            FROM "${tableName}" AS t
            JOIN "${cteName}" AS h ON ${joinFrom} = ${joinTo}
        `;

		query = kx.withRecursive(cteName, kx.raw(cteBodySql, anchorBindings)).from(fromClause);
	}
	else {
		query = kx(fromClause);
	}

	// 2. Process Joins
	if (options.joins?.length) {
		options.joins.forEach((join) => {
			// Handle table aliasing (e.g., 'users as u')
			const tableToJoin = join.as ? `${join.table} as ${join.as}` : join.table;

			switch (join.type) {
				case "inner":
					query.innerJoin(tableToJoin, join.onLeft, join.onRight);
					break;
				case "left":
					query.leftJoin(tableToJoin, join.onLeft, join.onRight);
					break;
				case "right":
					query.rightJoin(tableToJoin, join.onLeft, join.onRight);
					break;
				case "full_outer":
					query.fullOuterJoin(tableToJoin, join.onLeft, join.onRight);
					break;
			}
		});
	}

	// 3. Process Columns (SELECT)
	const selections = options.select.map((col) => {
		if (typeof col === "string") {
			return col;
		}
		if ("func" in col) {
			// Use knex.raw for aggregate functions to prevent SQL injection
			return kx.raw(`${col.func.toUpperCase()}(??) as ??`, [col.column, col.as]);
		}
		// Handle aliasing
		return col.as ? `${col.column} as ${col.as}` : col.column;
	});
	query.select(selections);

	// 4. Process Filters (WHERE), starting with depth 1
	options.where.forEach((group) => applyFilters(query, group, 1));

	// 5. Process Group By
	if (options.groupBy?.length) {
		query.groupBy(options.groupBy);
	}

	// 6. Process Sorts (ORDER BY)
	if (options.orderBy?.length) {
		// Knex's orderBy can take an array of objects directly
		query.orderBy(options.orderBy.map((s) => ({ column: s.column, order: s.direction })));
	}

	// 7. Process Limit
	query.limit(limit);

	// 8. Process Offset
	query.offset(offset);

	return query;
}

// --- Base Filter Schemas ---
const BaseConditionSchema = v.object({
    column: v.string(),
});

/**
 * Schema for parsing array condition values (e.g., 'in', 'not_in' operators)
 */
const ArrayValueConditionSchema = v.intersect([
    BaseConditionSchema,
    v.object({
        operator: v.union([v.literal('in'), v.literal('not_in')]),
        value: v.array(v.union([v.string(), v.number(), v.boolean()])),
    }),
]);

/**
 * Schema for parsing date condition values (e.g., 'equal', 'gt', 'lt' operators)
 */
const DateValueConditionSchema = v.intersect([
    BaseConditionSchema,
    v.object({
        operator: v.union([ v.literal('equal'), v.literal('not_equal'), v.literal('gt'), v.literal('gtequal'), v.literal('lt'), v.literal('ltequal'), v.literal('empty'), v.literal('not_empty')]),
        value: v.pipe(v.string(), v.isoDateTime())
    }),
]);

/**
 * Schema for parsing numeric condition values (e.g., 'equal', 'gt', 'lt' operators)
 */
const NumericValueConditionSchema = v.intersect([
	BaseConditionSchema,
	v.object({
		operator: v.union([ v.literal('equal'), v.literal('not_equal'), v.literal('gt'), v.literal('gtequal'), v.literal('lt'), v.literal('ltequal'), v.literal('empty'), v.literal('not_empty')]),
		value: v.union([v.number(), v.boolean()]),
	}),
]);

/**
 * Schema for parsing text condition values (e.g., 'equal', 'contains', 'like' operators)
 */
const TextValueConditionSchema = v.intersect([
	BaseConditionSchema,
	v.object({
		operator: v.union([ v.literal('equal'), v.literal('not_equal'), v.literal('contains'), v.literal('empty'), v.literal('like'), v.literal('not_empty'), v.literal('starts_with'), v.literal('ends_with')]),
		value: v.union([v.string(), v.boolean()]),
	}),
]);

/**
 * Schema for parsing any condition value
 */
export const ConditionSchema = v.union([
    ArrayValueConditionSchema,
    DateValueConditionSchema,
    NumericValueConditionSchema,
	TextValueConditionSchema,
]);

/**
 * Recursive Schema for parsing a group of conditions combined with a logical connector ('and'/'or')
 */
export const ConditionGroupSchema: v.GenericSchema<ConditionGroup> = v.lazy(() =>
    v.object({
        connector: v.union([v.literal('and'), v.literal('or')]),
        conditions: v.array(v.union([ConditionSchema, ConditionGroupSchema])),
    })
);

/**
 * Schema for a simplified recursive query, assuming conventions:
 * - The parent record's primary key is 'id'.
 * - The child record's foreign key is 'parent_id'.
 */
export const RecursiveQuerySchema = v.object({
  // 'ancestors' walks up the tree from child to parent; 'descendants' walks down.
  direction: v.union([v.literal('ancestors'), v.literal('descendants')]),
  // A standard filter to define the starting point of the recursion.
  startWith: ConditionGroupSchema,
});

/**
 * Schema for parsing a simple column selection (with optional alias)
 */
export const SimpleColumnSchema = v.object({
    column: v.string(),
    as: v.optional(v.string()),
});

/**
 * Schema for parsing an aggregate column selection (with function, column, and alias)
 */
export const AggregateColumnSchema = v.object({
    func: v.union([ v.literal('sum'), v.literal('avg'), v.literal('count'), v.literal('min'), v.literal('max')]),
    column: v.string(),
    as: v.string(),
});

/**
 * Schema for parsing any column selection (simple or aggregate)
 */
export const ColumnSchema = v.union([
    v.string(),
    AggregateColumnSchema,
    SimpleColumnSchema
]);

/**
 * Schema for parsing a JOIN clause.
 */
export const JoinSchema = v.object({
	type: v.union([
		v.literal('inner'),
		v.literal('left'),
		v.literal('right'),
		v.literal('full_outer'),
	]),
	table: v.string(),
	as: v.optional(v.string()),
	onLeft: v.string(),
	onRight: v.string(),
});

/**
 * Schema for parsing an order by clause (column and direction)
 */
export const OrderSchema = v.object({
    column: v.string(),
    direction: v.union([v.literal('asc'), v.literal('desc')]),
});

/**
 * Schema for parsing a complete query with selections, conditions, ordering, grouping, limits, and offsets
 */
export const QuerySchema = v.object({
    select: v.array(ColumnSchema),
	recursive: v.optional(RecursiveQuerySchema),
	joins: v.optional(v.array(JoinSchema)),
	where: v.array(ConditionGroupSchema),
    orderBy: v.optional(v.array(OrderSchema)),
    groupBy: v.optional(v.array(v.string())),
    limit: v.optional(v.pipe(
		v.number(),
		v.integer(),
		v.minValue(1),
		v.maxValue(1000)
	)),
    offset: v.optional(v.pipe(
		v.number(),
		v.integer(),
		v.minValue(0)
	)),
});

/**
 * Condition Group type (recursive)
 */
export type ConditionGroup = {
    connector: 'and' | 'or';
    conditions: (v.InferOutput<typeof ConditionSchema> | ConditionGroup)[];
};

/**
 * Condition type inferred from ConditionSchema
 */
export type Condition = v.InferInput<typeof ConditionSchema>;

/**
 * Column type inferred from ColumnSchema
 */
export type Column = v.InferInput<typeof ColumnSchema>;

/**
 * Join type inferred from JoinSchema
 */
export type Join = v.InferInput<typeof JoinSchema>;

/**
 * Order type inferred from OrderSchema
 */
export type Order = v.InferInput<typeof OrderSchema>;

/**
 * Query type inferred from QuerySchema
 */
export type Query = v.InferInput<typeof QuerySchema>;