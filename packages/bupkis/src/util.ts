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

import { type Keypath } from './types.js';

export * from './value-to-schema.js';

const { isInteger, isNaN } = Number;

/**
 * Retrieves the value at a given keypath from an object using dot or bracket
 * notation.
 *
 * Supports keypaths like:
 *
 * - `'foo.bar'` - dot notation
 * - `'foo[1].spam'` - bracket notation with array indices
 * - `'foo["bar-baz"].quux'` - bracket notation with quoted strings
 * - `"foo['bar-baz'].quux"` - bracket notation with single quotes
 *
 * This function cannot retrieve values associated with symbol keys.
 *
 * @example
 *
 * ```ts
 * const obj = {
 *   foo: {
 *     bar: 'hello',
 *     'bar-baz': { quux: 'world' },
 *   },
 *   arr: [{ spam: 'eggs' }],
 * };
 *
 * get(obj, 'foo.bar');
 * get(obj, 'arr[0].spam');
 * get(obj, 'foo["bar-baz"].quux');
 * get(obj, 'foo.nonexistent');
 * get(obj, 'foo.nonexistent', 'default');
 * ```
 *
 * @function
 * @param obj The object to retrieve the value from
 * @param keypath The keypath using dot or bracket notation
 * @param defaultValue Optional default value to return if the keypath is not
 *   found
 * @returns The value at the keypath, or defaultValue if not found
 */
export const get = <T = unknown>(
  obj: unknown,
  keypath: Keypath,
  defaultValue?: T,
): T | undefined => {
  if (typeof obj !== 'object' || obj === null || typeof keypath !== 'string') {
    return defaultValue;
  }

  const keys = parseKeypath(keypath);

  if (keys.length === 0) {
    return defaultValue;
  }

  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }

    const currentObj = current as Record<PropertyKey, unknown>;

    if (!(key in currentObj)) {
      return defaultValue;
    }

    current = currentObj[key];
  }

  return current as T;
};

/**
 * Returns whether a value exists at a given keypath within an object using dot
 * or bracket notation.
 *
 * Supports keypaths like:
 *
 * - `'foo.bar'` - dot notation
 * - `'foo[1].spam'` - bracket notation with array indices
 * - `'foo["bar-baz"].quux'` - bracket notation with quoted strings
 * - `"foo['bar-baz'].quux"` - bracket notation with single quotes
 *
 * This function cannot consider values associated with symbol keys.
 *
 * @example
 *
 * ```ts
 * const obj = {
 *   foo: {
 *     bar: 'hello',
 *     'bar-baz': { quux: 'world' },
 *   },
 *   arr: [{ spam: 'eggs' }],
 * };
 *
 * has(obj, 'foo.bar');
 * has(obj, 'arr[0].spam');
 * has(obj, 'foo["bar-baz"].quux');
 * has(obj, 'foo.nonexistent');
 * ```
 *
 * @function
 * @param obj The object to examine the value from
 * @param keypath The keypath using dot or bracket notation
 * @returns `true` if the keypath exists, `false` otherwise
 */
export const has = (obj: unknown, keypath: Keypath): boolean => {
  if (typeof obj !== 'object' || obj === null || typeof keypath !== 'string') {
    return false;
  }

  const keys = parseKeypath(keypath);

  if (keys.length === 0) {
    return false;
  }

  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return false;
    }

    const currentObj = current as Record<PropertyKey, unknown>;

    if (!(key in currentObj)) {
      return false;
    }
    current = currentObj[key];
  }

  return true;
};

/**
 * Maps an array of objects to an object keyed by the specified key.
 *
 * @function
 * @param collection Array of objects
 * @param key Name of key
 * @returns Object mapping key values to objects
 */
export const keyBy = <
  const T extends readonly Record<PropertyKey, any>[],
  K extends StringKeyOf<T[number]>,
>(
  collection: T,
  key: K,
): Record<string, T[number]> => {
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
};

/**
 * Parses a keypath string into an array of individual keys, supporting dot and
 * bracket notation.
 *
 * Parsing rules:
 *
 * - Dot notation: Splits keys by `.` (e.g., `'foo.bar'` → `['foo', 'bar']`).
 * - Bracket notation: Extracts keys inside `[]`. If the key is a quoted string
 *   (single or double quotes), the quotes are removed (e.g., `'foo["bar-baz"]'`
 *   → `['foo', 'bar-baz']`). If the key is an integer (e.g., `'foo[0]'`), it is
 *   parsed as a number.
 * - Mixed notation: Supports combinations (e.g., `'foo.bar[0].baz'` → `['foo',
 *   'bar', 0, 'baz']`).
 * - Quoted keys: Keys inside brackets can be quoted with single or double quotes.
 *   Quotes are stripped, and the content is used as the key.
 * - Numeric keys: If a bracketed key is an integer, it is returned as a number;
 *   otherwise, as a string.
 * - Whitespace inside brackets is preserved as part of the key.
 * - Does not support escape sequences inside quotes.
 *
 * Limitations:
 *
 * - Does not support symbol keys.
 * - Does not handle escape characters inside quoted keys.
 *
 * @example
 *
 * ```ts
 * parseKeypath('foo.bar'); // ['foo', 'bar']
 * parseKeypath('foo[0].baz'); // ['foo', 0, 'baz']
 * parseKeypath('foo["bar-baz"].quux'); // ['foo', 'bar-baz', 'quux']
 * parseKeypath("foo['bar-baz'].quux"); // ['foo', 'bar-baz', 'quux']
 * parseKeypath("arr[10]['spam']"); // ['arr', 10, 'spam']
 * ```
 *
 * @function
 * @param keypath The keypath string to parse, using dot and/or bracket
 *   notation.
 * @returns An array of keys, where each key is a string or number. Bracketed
 *   integer keys are returned as numbers; all others as strings.
 */
export const parseKeypath = <S extends string = string>(
  keypath: Keypath<S>,
): (number | string)[] => {
  const keys: (number | string)[] = [];
  let i = 0;

  while (i < keypath.length) {
    if (keypath[i] === '[') {
      i++;
      let key = '';
      let inQuotes = false;
      let quoteChar = '';

      while (i < keypath.length && (keypath[i] !== ']' || inQuotes)) {
        const char = keypath[i];

        if (!inQuotes && (char === '"' || char === "'")) {
          inQuotes = true;
          quoteChar = char;
        } else if (inQuotes && char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        } else {
          key += char;
        }

        i++;
      }

      i++;

      const numKey = Number(key);
      keys.push(isInteger(numKey) && !isNaN(numKey) ? numKey : key);
    } else if (keypath[i] === '.') {
      i++;
    } else {
      let key = '';

      while (i < keypath.length && keypath[i] !== '.' && keypath[i] !== '[') {
        key += keypath[i];
        i++;
      }

      if (key) {
        keys.push(key);
      }
    }
  }

  return keys;
};
