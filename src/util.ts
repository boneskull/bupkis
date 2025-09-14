/**
 * Utility functions.
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

    // Recursively search in object/array values
    if (Array.isArray(obj)) {
      // For arrays, search in each element
      for (const item of obj) {
        if (hasKey(item, key, visited)) {
          return true;
        }
      }
    } else {
      // For objects, search in each property value
      for (const propValue of Object.values(obj)) {
        if (hasKey(propValue, key, visited)) {
          return true;
        }
      }
    }

    return false;
  } finally {
    visited.delete(obj);
  }
}

/**
 * _Recursively_ searches within an object, array, or any nested structure to
 * find whether a specific value exists.
 *
 * Uses strict equality (===) to compare values, with special handling for empty
 * objects. Handles circular references by tracking visited objects to prevent
 * infinite recursion.
 *
 * @example
 *
 * ```ts
 * const obj = { a: 1, b: { c: 2, d: [{ e: 3 }] }, empty: {} };
 *
 * hasValue(obj, 2); // true (found in obj.b.c)
 * hasValue(obj, 3); // true (found in obj.b.d[0].e)
 * hasValue(obj, {}); // true (found in obj.empty, matches empty objects)
 * hasValue(obj, '1'); // false (strict equality, 1 !== '1')
 * hasValue(obj, 999); // false (value not found)
 * ```
 *
 * @param obj The object, array, or value to search within
 * @param value The value to search for (using strict equality, with special
 *   empty object handling)
 * @param visited Internal set for circular reference detection
 * @returns True if the value is found anywhere in the structure, false
 *   otherwise
 */
export function hasValue(
  obj: unknown,
  value: unknown,
  visited = new WeakSet<object>(),
): boolean {
  // Direct value comparison
  if (obj === value) {
    return true;
  }

  // Special case: Check for empty objects
  if (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const objKeys = Object.keys(obj);
    const valueKeys = Object.keys(value);

    // Both are empty objects
    if (objKeys.length === 0 && valueKeys.length === 0) {
      return true;
    }
  }

  // Handle primitives that can't contain nested values
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Prevent infinite recursion with circular references
  if (visited.has(obj)) {
    return false;
  }
  visited.add(obj);

  try {
    // Recursively search in object/array values
    if (Array.isArray(obj)) {
      // For arrays, search in each element
      for (const item of obj) {
        if (hasValue(item, value, visited)) {
          return true;
        }
      }
    } else {
      // For objects, search in each property value
      for (const propValue of Object.values(obj)) {
        if (hasValue(propValue, value, visited)) {
          return true;
        }
      }
    }

    return false;
  } finally {
    visited.delete(obj);
  }
}

/**
 * _Recursively_ searches for a key-value pair within an object or array.
 *
 * Uses strict equality (===) to compare values. Handles circular references by
 * tracking visited objects to prevent infinite recursion.
 *
 * @example
 *
 * ```ts
 * const obj = { a: 1, b: { c: 2, d: [{ e: 3 }] } };
 *
 * hasKeyValue(obj, 'c', 2); // true
 * hasKeyValue(obj, 'e', 3); // true
 * hasKeyValue(obj, 'a', '1'); // false (strict equality)
 * hasKeyValue(obj, 'x', 1); // false (key not found)
 * /**
 * Maps an array of objects to an object keyed by the specified key.
 *
 * @param collection Array of objects
 * @param key Name of key
 * @returns Object mapping key values to objects
 * ```
 */
export function keyBy<
  const T extends readonly Record<PropertyKey, any>[],
  K extends StringKeyOf<T[number]>,
>(collection: T, key: K): Record<string, T[number]> {
  const result = {} as Record<string, T[number]>;

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
