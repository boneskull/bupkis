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

import {
  isA,
  isNonNullObject,
  isNullOrNonObject,
  isPromiseLike,
  isString,
} from './guards.js';
import {
  FunctionSchema,
  RegExpSchema,
  StrongMapSchema,
  StrongSetSchema,
  WrappedPromiseLikeSchema,
} from './schema.js';

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
  if (isNullOrNonObject(expected)) {
    return actual === (expected as unknown as Actual);
  }

  if (isNullOrNonObject(actual)) {
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
  if (isNullOrNonObject(expected)) {
    return actual === (expected as unknown as Actual);
  }

  if (isNullOrNonObject(actual)) {
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
      if (isA(value, RegExp)) {
        return [key, z.coerce.string().regex(value)];
      }
      if (isString(value)) {
        return [key, z.coerce.string().pipe(z.literal(value))];
      }
      if (isNonNullObject(value)) {
        return [key, z.object(shallowSatisfiesShape(value))];
      }
      return [key, z.literal(value)];
    }),
  );

/**
 * Creates an object composed of keys generated from the results of running each
 * element of {@link collection} through {@link iteratee}.
 *
 * If `iteratee` is a function, it is invoked for each element in the
 * {@link collection}. If `iteratee` is a {@link PropertyKey}, it is used as a key
 * to retrieve the corresponding value from each element in the
 * {@link collection}.
 *
 * The corresponding value of each key is the last element responsible for
 * generating the key.
 */
export function keyBy<const T extends readonly unknown[]>(
  collection: T,
  iteratee: ((item: T[number]) => PropertyKey) | keyof T[number],
): Record<PropertyKey, T[number]> {
  const result: Record<PropertyKey, T[number]> = {};

  for (const item of collection) {
    const key =
      typeof iteratee === 'function'
        ? iteratee(item)
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ((item as any)[iteratee] as PropertyKey);
    result[key] = item;
  }

  return result;
}

/**
 * Recursively converts an arbitrary value to a Zod v4 schema that would
 * validate values with the same structure.
 *
 * This function analyzes the runtime value and generates a corresponding Zod
 * schema that captures the value's structure and type information. It handles
 * primitives, objects, arrays, functions, and various built-in types, with
 * support for circular reference detection.
 *
 * @example
 *
 * ```typescript
 * // Primitive types
 * valueToSchema('hello'); // z.string()
 * valueToSchema(42); // z.number()
 * valueToSchema(true); // z.boolean()
 *
 * // Objects
 * valueToSchema({ name: 'John', age: 30 });
 * // z.object({ name: z.string(), age: z.number() })
 *
 * // Arrays
 * valueToSchema(['a', 'b', 'c']); // z.array(z.string())
 * valueToSchema([1, 'mixed']); // z.array(z.union([z.number(), z.string()]))
 *
 * // Nested structures
 * valueToSchema({ users: [{ name: 'John' }] });
 * // z.object({ users: z.array(z.object({ name: z.string() })) })
 * ```
 *
 * @param value - The value to convert to a schema
 * @param options - Configuration options for schema generation
 * @param visited - Internal WeakSet for circular reference detection
 * @returns A Zod schema that validates values matching the input's structure
 */
export const valueToSchema = (
  value: unknown,
  options: {
    /** Current depth (internal) */
    _currentDepth?: number;
    /** Whether to allow mixed types in arrays (default: true) */
    allowMixedArrays?: boolean;
    /**
     * If `true`, treat `RegExp` literals as `RegExp` literals; otherwise treat
     * as strings and attempt match
     */
    literalRegExp?: boolean;
    /** Maximum nesting depth to prevent stack overflow (default: 10) */
    maxDepth?: number;
    /** If `true`, will disallow unknown properties in objects */
    strict?: boolean;
  } = {},
  visited = new WeakSet<object>(),
): z.ZodType => {
  const {
    _currentDepth = 0,
    allowMixedArrays = true,
    literalRegExp = false,
    maxDepth = 10,
    strict = false,
  } = options;

  // Prevent infinite recursion
  if (_currentDepth >= maxDepth) {
    return z.unknown();
  }

  // Handle primitives
  if (value === null) {
    return z.null();
  }

  if (value === undefined) {
    return z.undefined();
  }
  if (Number.isNaN(value as number)) {
    return z.nan();
  }
  if (value === Infinity || value === -Infinity) {
    return z.literal(value as any);
  }

  const valueType = typeof value;

  switch (valueType) {
    case 'bigint':
      return z.bigint();
    case 'boolean':
      return z.boolean();
    case 'function':
      return FunctionSchema;
    case 'number':
      return z.number();
    case 'string':
      return z.string();
    case 'symbol':
      return z.symbol();
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Check for circular references
    if (visited.has(value)) {
      // Return a recursive schema reference or unknown for circular refs
      return z.unknown();
    }

    visited.add(value);

    try {
      // Handle built-in object types
      if (value instanceof Date) {
        return z.date();
      }

      if (value instanceof RegExp) {
        if (literalRegExp) {
          return RegExpSchema;
        }
        return z.coerce.string().regex(value);
      }

      if (value instanceof Map) {
        return StrongMapSchema;
      }

      if (value instanceof Set) {
        return StrongSetSchema;
      }

      if (value instanceof WeakMap) {
        return z.instanceof(WeakMap);
      }

      if (value instanceof WeakSet) {
        return z.instanceof(WeakSet);
      }

      if (value instanceof Error) {
        return z.instanceof(Error);
      }

      if (isPromiseLike(value)) {
        return WrappedPromiseLikeSchema;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return z.array(z.unknown());
        }

        const elementSchemas = value.map((item) =>
          valueToSchema(
            item,
            {
              ...options,
              _currentDepth: _currentDepth + 1,
            },
            visited,
          ),
        );

        if (allowMixedArrays) {
          // Create a union of all unique element types
          const uniqueSchemas = Array.from(
            new Set(elementSchemas.map((schema) => schema.constructor.name)),
          ).map((_, index) => elementSchemas[index]);

          if (uniqueSchemas.length === 1) {
            return z.array(uniqueSchemas[0]!);
          } else {
            return z.array(
              z.union(uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]),
            );
          }
        } else {
          // Use the first element's schema for all elements
          return z.array(elementSchemas[0]!);
        }
      }

      // Handle plain objects
      if (isNonNullObject(value)) {
        const schemaShape: Record<string, z.ZodType<any>> = {};

        for (const [key, val] of Object.entries(value)) {
          if (isString(key)) {
            schemaShape[key] = valueToSchema(
              val,
              {
                ...options,
                _currentDepth: _currentDepth + 1,
              },
              visited,
            );
          }
        }

        return strict
          ? z.strictObject(schemaShape)
          : z.looseObject(schemaShape);
      }

      // Handle other object types (ArrayBuffer, etc.)
      return z.custom<object>(
        (val) => typeof val === 'object' && val !== null,
        { message: 'Expected an object' },
      );
    } finally {
      visited.delete(value);
    }
  }

  // Fallback for unknown types
  return z.unknown();
};
