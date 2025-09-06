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

import { isNonNullObject, isPromiseLike, isString } from './guards.js';
import {
  FunctionSchema,
  RegExpSchema,
  StrongMapSchema,
  StrongSetSchema,
  WrappedPromiseLikeSchema,
} from './schema.js';

/**
 * Creates an object composed of keys generated from the results of running each
 * element of `collection` through `iteratee`.
 *
 * If `iteratee` is a function, it is invoked for each element in the
 * `collection`. If `iteratee` is a `PropertyKey`, it is used as a key to
 * retrieve the corresponding value from each element in `collection`.
 *
 * The corresponding value of each key is the last element responsible for
 * generating the key.
 *
 * @see {@link https://lodash.com/docs/4.17.15#keyBy | lodash.keyBy()}
 */
export function keyBy<
  const T extends readonly unknown[],
  K extends ((item: T[number]) => PropertyKey) | keyof T[number],
>(
  collection: T,
  iteratee: K,
): K extends keyof T[number]
  ? Record<PropertyKey & T[number][K], T[number]>
  : Record<PropertyKey, T[number]> {
  const result: Record<PropertyKey, T[number]> = {};

  for (const item of collection) {
    const key =
      typeof iteratee === 'function'
        ? iteratee(item)
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ((item as any)[iteratee] as PropertyKey);
    result[key] = item;
  }

  return result as K extends keyof T[number]
    ? Record<PropertyKey & T[number][K], T[number]>
    : Record<PropertyKey, T[number]>;
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
    /** If `true`, use `z.literal()` for primitive values instead of type schemas */
    literalPrimitives?: boolean;
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
    literalPrimitives = false,
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
      return literalPrimitives ? z.literal(value as bigint) : z.bigint();
    case 'boolean':
      return literalPrimitives ? z.literal(value as boolean) : z.boolean();
    case 'function':
      return FunctionSchema;
    case 'number':
      return literalPrimitives ? z.literal(value as number) : z.number();
    case 'string':
      return literalPrimitives ? z.literal(value as string) : z.string();
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
