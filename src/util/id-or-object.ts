export type ID = string | number;
/**
 * Marks a parameter that accepts either the object's ID or the object itself.
 */
export type IdOrObject<T extends { id: ID }> = Pick<T, 'id'> | T["id"] | ID;

/**
 * Converts an object to its ID, or if an ID was passed instead, returns that ID.
 * Always returns a string.
 */
export function extractId<T extends { id: ID }>(idOrObject: T | ID): string {
  if (typeof idOrObject === 'string' || typeof idOrObject === 'number') {
    return `${idOrObject}`;
  }
  if (idOrObject.id === null ||
      idOrObject.id === undefined) {
    throw new Error("ID cannot be extracted from parameter");
  }
  return `${idOrObject.id}`;
}

/**
 * Converts an object to its ID, or if an ID was passed instead, returns that ID.
 * Always returns a number.
 */
export function extractIdToNumber<T extends { id: ID }>(idOrObject: T | ID): number {
  if (typeof idOrObject === 'number') {
    return idOrObject;
  }
  if (typeof idOrObject === 'string') {
    return parseInt(idOrObject, 10);
  }
  return extractIdToNumber(idOrObject.id);
}