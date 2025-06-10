import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';
import z from 'zod/v4';

// Custom Schemas & Types
export const MetaRecordSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));
export type MetaRecord = z.infer<typeof MetaRecordSchema>;

export const TransactionLineSchema = z.record(z.string(), MetaRecordSchema);
export type TransactionLine = z.infer<typeof TransactionLineSchema>;

export enum BalanceType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT',
}

export interface TransactionModel {
	ref_id: string;
	alt_id?: string | null;
	name: string;
	active?: boolean;
}

export interface EntityModel {
	ref_id: string;
	alt_id?: string | null;
	name: string;
	active?: boolean;
}

// Main Database Interface
export interface Database {
	accounts: AccountTable;
	conversion_rates: ConversionRateTable;
	dimensions: DimensionTable;
	entities: EntityTable;
	entries: EntryTable;
	ledgers: LedgerTable;
	transactions: TransactionTable;
	unit_types: UnitTypeTable;
	units: UnitTable;
}

// Table: accounts
export interface AccountTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  balance_type: BalanceType | null;
  ledger_id: string;
  parent_id: string | null;
  name: string;
  meta: JSONColumnType<MetaRecord> | null;
  active: Generated<boolean>;
}
export type Account = Selectable<AccountTable>;
export type AccountInsert = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

// Table: conversion_rates
export interface ConversionRateTable {
  id: Generated<string>;
  from_uom_id: string;
  to_uom_id: string;
  rate: string; // Numeric types are best handled as strings for precision
}
export type ConversionRate = Selectable<ConversionRateTable>;
export type ConversionRateInsert = Insertable<ConversionRateTable>;
export type ConversionRateUpdate = Updateable<ConversionRateTable>;

// Table: dimensions
export interface DimensionTable {
  id: Generated<string>;
  entry_id: string;
  entity_model_id: string | null;
  entity_id: string;
}
export type Dimension = Selectable<DimensionTable>;
export type DimensionInsert = Insertable<DimensionTable>;
export type DimensionUpdate = Updateable<DimensionTable>;

// Table: entities
export interface EntityTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  entity_model_id: string;
  parent_id: string | null;
  name: string;
  meta: JSONColumnType<MetaRecord> | null;
}
export type Entity = Selectable<EntityTable>;
export type EntityInsert = Insertable<EntityTable>;
export type EntityUpdate = Updateable<EntityTable>;

// Table: entries
export interface EntryTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  ledger_id: string;
  debit_account_id: string;
  credit_account_id: string;
  uom_id: string;
  value: Generated<string>; // Numeric types are best handled as strings for precision
  transaction_id: string;
}
export type Entry = Selectable<EntryTable>;
export type EntryInsert = Insertable<EntryTable>;
export type EntryUpdate = Updateable<EntryTable>;

// Table: ledgers
export interface LedgerTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  name: string;
  description: string | null;
  unit_type_id: string | null;
  active: Generated<boolean>;
}
export type Ledger = Selectable<LedgerTable>;
export type LedgerInsert = Insertable<LedgerTable>;
export type LedgerUpdate = Updateable<LedgerTable>;

// Table: transactions
export interface TransactionTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  transaction_model_id: string;
  date: ColumnType<Date>;
  meta: JSONColumnType<MetaRecord> | null;
  lines: JSONColumnType<TransactionLine> | null;
}
export type Transaction = Selectable<TransactionTable>;
export type TransactionInsert = Insertable<TransactionTable>;
export type TransactionUpdate = Updateable<TransactionTable>;

// Table: unit_types
export interface UnitTypeTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  name: string;
}
export type UnitType = Selectable<UnitTypeTable>;
export type UnitTypeInsert = Insertable<UnitTypeTable>;
export type UnitTypeUpdate = Updateable<UnitTypeTable>;

// Table: units
export interface UnitTable {
  id: Generated<string>;
  ref_id: string;
  alt_id: string | null;
  unit_type_id: string;
  name: string;
  symbol: string | null;
  precision: Generated<number>;
  decimal_separator: string;
  thousands_separator: string;
  active: Generated<boolean>;
}
export type Unit = Selectable<UnitTable>;
export type UnitInsert = Insertable<UnitTable>;
export type UnitUpdate = Updateable<UnitTable>;