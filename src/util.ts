/**
 * Utility functions for object satisfaction and shape validation.
 *
 * This module provides core utility functions for checking if objects satisfy
 * expected shapes, including `satisfies` for partial matching,
 * `exhaustivelySatisfies` for exact matching, and `shallowSatisfiesShape` for
 * converting shapes to Zod schemas. All functions handle circular references
 * safely.
 *
 * @category API
 * @example
 *
 * ```ts
 * import * as util from 'bupkis/util';
 * ```
 *
 * @packageDocumentation
 */

import { type StringKeyOf } from 'type-fest';
import { z } from 'zod/v4';

export * from './value-to-schema.js';

/**
 * _Recursively_ searches within an object, array, or any nested structure to
 * find whether a specific key exists.
 *
 * Handles circular references by tracking visited objects to prevent infinite
 * recursion.
 *
 * @example
 *
 * ```ts
 * const obj = { a: 1, b: { c: 2, d: [{ e: 3 }] } };
 *
 * hasKey(obj, 'c'); // true
 * hasKey(obj, 'e'); // true
 * hasKey(obj, 'x'); // false (key not found)
 * ```
 *
 * @param obj The object, array, or value to search within
 * @param key The key to search for
 * @param visited Internal set for circular reference detection
 * @returns True if the key is found anywhere in the structure, false otherwise
 */
export function hasKey(
  obj: unknown,
  key: PropertyKey,
  visited = new WeakSet<object>(),
): boolean {
  // Handle primitives that can't contain keys
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Prevent infinite recursion with circular references
  if (visited.has(obj)) {
    return false;
  }
  visited.add(obj);

  try {
    // Check if this object has the key
    if (Object.hasOwn(obj, key)) {
      return true;
    }

  for (const item of collection) {
    const keyValue = item[key];
    if (
      typeof keyValue === 'string' ||
      typeof keyValue === 'number' ||
      typeof keyValue === 'symbol'
    ) {
      result[String(keyValue)] = item;
    }
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
  visited.add(obj);

  try {
    // Check if this object has the key with the exact value
    if (Object.hasOwn(obj, key)) {
      const objRecord = obj as Record<PropertyKey, unknown>;
      if (objRecord[key] === value) {
        return true;
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
    } else {
      // For objects, search in each property value
      for (const propValue of Object.values(obj)) {
        if (hasKeyValue(propValue, key, value, visited)) {
          return true;
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
