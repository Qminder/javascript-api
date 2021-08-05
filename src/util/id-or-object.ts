
/**
 * Marks a parameter that accepts either the object's ID or the object itself.
 */
export type IdOrObject<T extends { id: number | string }> = Pick<T, 'id'> | T["id"];

/**
 * Converts an object to its ID, or if an ID was passed instead, returns that ID.
 * Always returns a string.
 */
export function extractId<T extends { id: number | string }>(idOrObject: T | string | number): string {
  if (typeof idOrObject === 'string' || typeof idOrObject === 'number') {
    return `${idOrObject}`;
  }
  return `${idOrObject.id}`;
}

/**
 * Converts an object to its ID, or if an ID was passed instead, returns that ID.
 * Always returns a number.
 */
export function extractIdToNumber<T extends { id: number | string }>(idOrObject: T | string | number): number {
  if (typeof idOrObject === 'number') {
    return idOrObject;
  }
  if (typeof idOrObject === 'string') {
    return parseInt(idOrObject, 10);
  }
  return extractIdToNumber(idOrObject.id);
}