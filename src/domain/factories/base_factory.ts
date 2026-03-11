/**
 * A generic factory function to create an array of items.
 * @param factory A function that creates a single item.
 * @param count The number of items to create.
 * @returns An array of created items.
 */
export const factory = <T>(factory: () => T, count: number): T[] => {
	return Array.from({ length: count }, factory);
};

export class BaseFactory<T> {
	private factory: () => T;

	constructor(factory: () => T) {
		this.factory = factory;
	}

	public make(count: number): T[] {
		return factory(this.factory, count);
	}
}
