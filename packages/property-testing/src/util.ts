/**
 * Utility functions for property-based testing.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';

const { freeze, hasOwn, keys, values } = Object;
const { isArray } = Array;
const { floor } = Math;
const { parseInt: parseIntNum } = Number;

/**
 * _Recursively_ searches within an object, array, or any nested structure to
 * find whether a specific key exists.
 *
 * Handles circular references by tracking visited objects to prevent infinite
 * recursion.
 *
 * @function
 * @param obj The object, array, or value to search within
 * @param key The key to search for
 * @param visited Internal set for circular reference detection
 * @returns True if the key is found anywhere in the structure, false otherwise
 */
export const hasKeyDeep = (
  obj: unknown,
  key: PropertyKey,
  visited = new WeakSet<object>(),
): boolean => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (visited.has(obj)) {
    return false;
  }
  visited.add(obj);

  try {
    if (hasOwn(obj, key)) {
      return true;
    }

    if (isArray(obj)) {
      for (const item of obj) {
        if (hasKeyDeep(item, key, visited)) {
          return true;
        }
      }
    } else {
      for (const propValue of values(obj)) {
        if (hasKeyDeep(propValue, key, visited)) {
          return true;
        }
      }
    }

    return false;
  } finally {
    visited.delete(obj);
  }
};

/**
 * _Recursively_ searches within an object, array, or any nested structure to
 * find whether a specific value exists.
 *
 * Uses strict equality (===) to compare values, with special handling for empty
 * objects. Handles circular references by tracking visited objects to prevent
 * infinite recursion.
 *
 * @function
 * @param obj The object, array, or value to search within
 * @param value The value to search for (using strict equality, with special
 *   empty object handling)
 * @param visited Internal set for circular reference detection
 * @returns True if the value is found anywhere in the structure, false
 *   otherwise
 */
export const hasValueDeep = (
  obj: unknown,
  value: unknown,
  visited = new WeakSet<object>(),
): boolean => {
  if (obj === value) {
    return true;
  }

  if (
    typeof obj === 'object' &&
    obj !== null &&
    !isArray(obj) &&
    typeof value === 'object' &&
    value !== null &&
    !isArray(value)
  ) {
    const objKeys = keys(obj);
    const valueKeys = keys(value);

    if (objKeys.length === 0 && valueKeys.length === 0) {
      return true;
    }
  }

  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (visited.has(obj)) {
    return false;
  }
  visited.add(obj);

  try {
    if (isArray(obj)) {
      for (const item of obj) {
        if (hasValueDeep(item, value, visited)) {
          return true;
        }
      }
    } else {
      for (const propValue of values(obj)) {
        if (hasValueDeep(propValue, value, visited)) {
          return true;
        }
      }
    }

    return false;
  } finally {
    visited.delete(obj);
  }
};

/**
 * Filters objects for use with "deep equal"-or-"satisfies"-based assertions.
 *
 * Excludes objects that contain keys or values that break Zod parsing.
 *
 * @function
 * @param value Arbitrary value
 * @returns `true` if the value does not have problematic keys/values
 */
export const objectFilter = (value: unknown) =>
  !hasKeyDeep(value, '__proto__') &&
  !hasKeyDeep(value, 'valueOf') &&
  !hasValueDeep(value, {}) &&
  !hasKeyDeep(value, 'toString');

/**
 * Arbitrary that generates any value except objects with `__proto__` or
 * `valueOf` keys somewhere deep within them.
 */
export const filteredAnything = fc.anything().filter(objectFilter);

/**
 * Arbitrary that generates only objects without `__proto__` or `valueOf` keys
 * somewhere deep within them.
 */
export const filteredObject = fc.object().filter(objectFilter);

/**
 * Filters strings to remove characters that could cause regex syntax errors.
 * Removes: [ ] ( ) { } ^ $ * + ? . \ |
 *
 * @function
 * @param str Input string
 * @returns String with problematic regex characters removed
 */
export const safeRegexStringFilter = (str: string) =>
  str.replace(/[[\](){}^$*+?.\\|]/g, '');

/**
 * Predefined run sizes for property-based tests.
 */
const RUN_SIZES = freeze({
  large: 500,
  medium: 250,
  small: 50,
} as const);

/**
 * Calculates the number of runs for property-based tests based on the
 * environment and the desired run size.
 *
 * @function
 * @param runSize One of 'small', 'medium', or 'large' to indicate the desired
 *   number of runs
 * @returns The calculated number of runs
 */
export const calculateNumRuns = (
  runSize: keyof typeof RUN_SIZES = 'medium',
) => {
  if (process.env.WALLABY) {
    return floor(RUN_SIZES[runSize] / 10);
  }
  if (process.env.CI) {
    return floor(RUN_SIZES[runSize] / 5);
  }
  if (process.env.NUM_RUNS) {
    return parseIntNum(process.env.NUM_RUNS, 10);
  }
  return RUN_SIZES[runSize];
};
