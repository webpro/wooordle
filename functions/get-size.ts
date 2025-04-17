export const getSize = (list: Set<string>): number => list[Symbol.iterator]().next().value.length;
