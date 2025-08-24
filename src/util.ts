/**
 * Utility functions for object satisfaction and shape validation.
 *
 * This module provides core utility functions for checking if objects satisfy
 * expected shapes, including `satisfies` for partial matching,
 * `exhaustivelySatisfies` for exact matching, and `shallowSatisfiesShape` for
 * converting shapes to Zod schemas. All functions handle circular references
 * safely.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

/**
 * Implementation of the "satisfies" semantic, which checks if `actual`
 * contains, at minimum, the expected shape.
 *
 * @param actual Actual object to check
 * @param expected Expected shape
 * @param visitedActual Seen objects in `actual` to prevent infinite recursion
 * @param visitedExpected Seen objects in `expected` to prevent infinite
 *   recursion
 * @returns `true` if `actual` satisfies `expected`, `false` otherwise
 */
export const satisfies = <
  Actual extends object,
  Expected extends object = Actual,
>(
  actual: Actual,
  expected: Expected,
  visitedActual = new WeakSet(),
  visitedExpected = new WeakSet(),
): boolean => {
  if (typeof expected !== 'object' || expected === null) {
    return actual === (expected as unknown as Actual);
  }

  if (typeof actual !== 'object' || actual === null) {
    return false;
  }

  // Check for circular references
  if (visitedActual.has(actual) || visitedExpected.has(expected)) {
    // If we've seen both objects before, assume they match to avoid infinite recursion
    // This is a conservative approach - in practice, circular structures should match
    // if they have the same structure
    return visitedActual.has(actual) && visitedExpected.has(expected);
  }

  // Mark objects as visited
  visitedActual.add(actual);
  visitedExpected.add(expected);

  for (const key of Object.keys(expected)) {
    if (key in actual) {
      if (
        !satisfies(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (actual as any)[key],
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (expected as any)[key],
          visitedActual,
          visitedExpected,
        )
      ) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
};

/**
 * Implementation of the "exhaustively satisfies" semantic, which checks if
 * `actual` has exactly the same properties as `expected` - no more, no less -
 * and all corresponding values must match.
 *
 * Unlike `satisfies`, this function requires an exact property match between
 * the two objects. The `actual` object cannot have additional properties beyond
 * what's in `expected`.
 *
 * @param actual Actual object to check
 * @param expected Expected shape with exact properties
 * @param visitedActual Seen objects in `actual` to prevent infinite recursion
 * @param visitedExpected Seen objects in `expected` to prevent infinite
 *   recursion
 * @returns `true` if `actual` exhaustively satisfies `expected`, `false`
 *   otherwise
 */
export const exhaustivelySatisfies = <
  Actual extends object,
  Expected extends object = Actual,
>(
  actual: Actual,
  expected: Expected,
  visitedActual = new WeakSet(),
  visitedExpected = new WeakSet(),
): boolean => {
  if (typeof expected !== 'object' || expected === null) {
    return actual === (expected as unknown as Actual);
  }

  if (typeof actual !== 'object' || actual === null) {
    return false;
  }

  // Check for circular references
  if (visitedActual.has(actual) || visitedExpected.has(expected)) {
    // If we've seen both objects before, assume they match to avoid infinite recursion
    // This is a conservative approach - in practice, circular structures should match
    // if they have the same structure
    return visitedActual.has(actual) && visitedExpected.has(expected);
  }

  // Mark objects as visited
  visitedActual.add(actual);
  visitedExpected.add(expected);

  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);

  // Check if both objects have the same number of properties
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  // Check if all expected keys exist in actual and have matching values
  for (const key of expectedKeys) {
    if (!(key in actual)) {
      return false;
    }

    if (
      !exhaustivelySatisfies(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (actual as any)[key],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (expected as any)[key],
        visitedActual,
        visitedExpected,
      )
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Creates a `ZodRawShape` to be used with `z.object()` that checks if an object
 * _shallowly_ satisfies the given shape.
 *
 * `RegExp` values in the shape will be converted to `z.string().regex(...)`
 * schemas, string values will be converted to `z.string().literal(...)`
 * schemas, and nested objects will be recursively converted. Other values will
 * be converted to `z.literal(...)` schemas.
 *
 * @returns A `ZodRawShape` for use with `z.object()`
 * @internal
 * @see {@link satisfies}
 */
export const shallowSatisfiesShape = (param: object): z.ZodRawShape =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  Object.fromEntries(
    Object.entries(param).map(([key, value]) => {
      if (value instanceof RegExp) {
        return [key, z.coerce.string().regex(value)];
      }
      if (typeof value === 'string') {
        return [key, z.coerce.string().pipe(z.literal(value))];
      }
      if (typeof value === 'object' && value !== null) {
        return [key, z.object(shallowSatisfiesShape(value as object))];
      }
      return [key, z.literal(value)];
    }),
  );
