import { faker } from '@faker-js/faker';
import {
	type NewAccount,
	type NewEntityModel,
	type NewLedger,
	type NewTransactionModel,
	type NewUnitType,
} from '../types/index.ts';
import { generate as uuid } from '@std/uuid/unstable-v7';
import { BalanceType } from '../services/database/schema.ts';

abstract class Factory {
	abstract make(type?: string): NewLedger | NewAccount | NewUnitType | NewEntityModel | NewTransactionModel;
	abstract makeMany(
		count: number,
		type?: string,
	): NewLedger[] | NewAccount[] | NewUnitType[] | NewEntityModel[] | NewTransactionModel[];
}

/**
 * Factory for creating fake ledger objects.
 */
export class LedgerFactory extends Factory {
	/**
	 * Creates a new ledger object with random data.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns A new ledger object.
	 */
	public make(type?: string): NewLedger {
		// Choose to not do anything with the type argument
		type;

		return {
			id: uuid(),
			ref_id: uuid(),
			alt_id: uuid(),
			name: faker.company.name(),
			description: faker.company.catchPhrase(),
			active: true,
		};
	}

	/**
	 * Creates multiple ledger objects.
	 * @param count The number of ledgers to create.
	 * @returns An array of new ledger objects.
	 */
	public makeMany(count: number) {
		return Array.from({ length: count }, () => this.make());
	}
}

export class AccountFactory extends Factory {
	/**
	 * Creates a new account object with random data.
	 * @param type 
	 * @returns 
	 */
	public make(type?: string): NewAccount {
		// Choose to not do anything with the type argument
		type;

		return {
			id: uuid(),
			ref_id: uuid(),
			alt_id: uuid(),
			name: faker.company.name(),
			balance_type: [BalanceType.DEBIT, BalanceType.CREDIT][Math.floor(Math.random() * 2)],
			ledger_id: uuid(),
			active: true,
		};
	}

	/**
	 * Creates multiple account objects.
	 * @param count The number of accounts to create.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns An array of new account objects.
	 */
	public makeMany(count: number, type?: string) {
		return Array.from({ length: count }, () => this.make(type));
	}
}

export class UnitTypeFactory extends Factory {
	/**
	 * Creates a new unit type object with random data.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns A new unit type object.
	 */
	public make(type?: string): NewUnitType {
		type;

		return {
			id: uuid(),
			ref_id: uuid(),
			alt_id: uuid(),
			name: faker.word.words(2),
		};
	}

	/**
	 * Creates multiple unit type objects.
	 * @param count The number of unit types to create.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns An array of new unit type objects.
	 */
	public makeMany(count: number, type?: string) {
		return Array.from({ length: count }, () => this.make(type));
	}
}

export class EntityModelFactory extends Factory {
	/**
	 * Creates a new entity model object with random data.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns 
	 */
	public make(type?: string): NewEntityModel {
		type;

		return {
			id: uuid(),
			ref_id: uuid(),
			alt_id: uuid(),
			name: faker.company.name(),
		};
	}

	/**
	 * Creates multiple entity model objects.
	 * @param count The number of entity models to create.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns An array of new entity model objects.
	 */
	public makeMany(count: number, type?: string) {
		return Array.from({ length: count }, () => this.make(type));
	}
}

export class TransactionModelFactory extends Factory {
	/**
	 * Creates a new transaction model object with random data.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns A new transaction model object.
	 */
	public make(type?: string): NewTransactionModel {
		type;

		return {
			id: uuid(),
			ref_id: uuid(),
			alt_id: uuid(),
			name: faker.company.name(),
		};
	}

	/**
	 * Creates multiple transaction model objects.
	 * @param count The number of transaction models to create.
	 * @param type Optional type argument, not used in this implementation.
	 * @returns An array of new transaction model objects.
	 */
	public makeMany(count: number, type?: string) {
		return Array.from({ length: count }, () => this.make(type));
	}
}
