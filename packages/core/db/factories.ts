import { faker } from '@faker-js/faker';
import {
    // Types
    type AccountInsert,
    type ConversionRateInsert,
    type DimensionInsert,
    type EntityInsert,
    type EntryInsert,
    type LedgerInsert,
    type TransactionInsert,
    type UnitInsert,
    type UnitTypeInsert,
    // Enums
    BalanceType,
} from './schema.ts';
import { generate as uuid } from '@std/uuid/unstable-v7';

type AllInsertTypes =
	| AccountFactory
	| ConversionRateInsert
	| DimensionInsert
	| EntityInsert
	| EntryInsert
    | LedgerInsert
	| TransactionInsert
    | UnitTypeInsert
    | UnitInsert;

abstract class Factory {
    abstract make(type?: string): AllInsertTypes;
    abstract makeMany(count: number, type?: string): AllInsertTypes[];
}

/**
 * Factory for creating fake Account objects.
 */
export class AccountFactory extends Factory {
    public make(): AccountInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            name: faker.finance.accountName(),
            balance_type: faker.helpers.arrayElement([BalanceType.DEBIT, BalanceType.CREDIT]),
            ledger_id: uuid(), // In a real scenario, this would be a valid ledger ID
            active: true,
            parent_id: faker.helpers.maybe(uuid),
            meta: faker.helpers.maybe(() => JSON.stringify(({
                source: faker.system.fileName(),
                timestamp: Date.now(),
            }))),
        };
    }

    public makeMany(count: number): AccountInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake ConversionRate objects.
 */
export class ConversionRateFactory extends Factory {
    public make(): ConversionRateInsert {
        return {
            id: uuid(),
            from_uom_id: uuid(), // Should reference a real Unit
            to_uom_id: uuid(), // Should reference a real Unit
            rate: faker.finance.amount({ min: 0.01, max: 200, dec: 8 }),
        };
    }

    public makeMany(count: number): ConversionRateInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Dimension objects.
 */
export class DimensionFactory extends Factory {
    public make(): DimensionInsert {
        return {
            id: uuid(),
            entry_id: uuid(),
            entity_model_id: faker.helpers.maybe(uuid),
            entity_id: uuid(),
        };
    }

    public makeMany(count: number): DimensionInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Entity objects.
 */
export class EntityFactory extends Factory {
    public make(): EntityInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            entity_model_id: uuid(), // Should reference a real EntityModel
            parent_id: faker.helpers.maybe(uuid),
            name: faker.person.fullName(),
            meta: faker.helpers.maybe(() => JSON.stringify(({
                email: faker.internet.email(),
                phone: faker.phone.number(),
            }))),
        };
    }

    public makeMany(count: number): EntityInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Entry objects.
 */
export class EntryFactory extends Factory {
    public make(): EntryInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            ledger_id: uuid(),
            debit_account_id: uuid(),
            credit_account_id: uuid(),
            uom_id: uuid(),
            value: faker.finance.amount({ min: 1, max: 10000, dec: 2 }),
            transaction_id: uuid(),
        };
    }

    public makeMany(count: number): EntryInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Ledger objects.
 */
export class LedgerFactory extends Factory {
    public make(): LedgerInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            active: true,
        };
    }

    public makeMany(count: number): LedgerInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Transaction objects.
 */
export class TransactionFactory extends Factory {
    public make(): TransactionInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            transaction_model_id: uuid(),
			date: faker.date.recent(),
            meta: faker.helpers.maybe(() => JSON.stringify(({
                reference_code: faker.string.alphanumeric(10),
                notes: faker.lorem.sentence(),
            }))),
            lines: JSON.stringify(({
                line_1: { item: faker.commerce.productName(), quantity: faker.number.int({ min: 1, max: 5 }) },
                line_2: { item: faker.commerce.productName(), quantity: faker.number.int({ min: 1, max: 5 }) },
            })),
        };
    }

    public makeMany(count: number): TransactionInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake UnitType objects.
 */
export class UnitTypeFactory extends Factory {
    public make(): UnitTypeInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            name: faker.helpers.arrayElement(['Currency', 'Weight', 'Distance', 'Volume']),
        };
    }

    public makeMany(count: number): UnitTypeInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

/**
 * Factory for creating fake Unit objects.
 */
export class UnitFactory extends Factory {
    public make(): UnitInsert {
        return {
            id: uuid(),
            ref_id: uuid(),
            alt_id: faker.helpers.maybe(uuid),
            unit_type_id: uuid(), // Should reference a real UnitType
            name: faker.finance.currencyName(),
            symbol: faker.finance.currencySymbol(),
            precision: 2,
            decimal_separator: '.',
            thousands_separator: ',',
            active: true,
        };
    }

    public makeMany(count: number): UnitInsert[] {
        return Array.from({ length: count }, () => this.make());
    }
}

