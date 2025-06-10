import { Database } from './schema.ts';
import { type PostgresClientConfig, createPostgresClient } from './postgres.ts';
import { createSqliteClient } from './sqlite.ts';

export type DbType = 'postgres' | 'sqlite';

/**
 * Represents the standardized structure for a query result.
 */
export interface QueryResult<RowT> {
    rows: RowT[];
}

export type DbDataType = string|number|null|undefined|Date;

/**
 * Defines the common contract for any database client.
 * This ensures that we can use either a Postgres or SQLite client interchangeably.
 */
export interface DatabaseClient {
    /**
     * Executes a raw SQL query with optional parameters.
     * @param sql The SQL query string.
     * @param params An array of parameters to be safely substituted into the query.
     * @returns A promise that resolves to a QueryResult.
     */
    query<RowT extends Record<string, DbDataType>>(sql: string, params?: (DbDataType)[]): Promise<QueryResult<RowT>>;

    /**
     * Closes the database connection and releases resources.
     */
    disconnect(): Promise<void>;
}

/**
 * Configuration object for creating a Postgres client.
 */
export type PostgresConfig = {
    connection: PostgresClientConfig | string;
};

/**
 * Configuration object for creating an SQLite client.
 */
export type SqliteConfig = {
    path: string;
};

export type DbConfig = PostgresConfig | SqliteConfig;

/**
 * Factory function that creates and returns a database client based on the provided configuration.
 * @param config The configuration object specifying the database type and connection details.
 * @returns An instance of a class that implements the DatabaseClient interface.
 */
export function createDbClient(type: DbType, config: DbConfig): DatabaseClient {
    switch (type) {
        case 'postgres':
            return createPostgresClient(config);
        case 'sqlite':
            return createSqliteClient(config);
        default: {
            throw new Error(`Unsupported database type: ${type}`);
		}
    }
}