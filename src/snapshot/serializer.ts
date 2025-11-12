/**
 * Serialization utilities for converting values to snapshot strings.
 *
 * Provides default serialization logic that handles:
 *
 * - Circular references
 * - Non-JSON types (Functions, Symbols, BigInt, etc.)
 * - Error objects
 * - Map and Set collections
 * - Key sorting for deterministic output
 *
 * @packageDocumentation
 */

const { entries, getOwnPropertyNames } = Object;
const { isArray } = Array;

import stringify from 'json-stable-stringify';

import { isA, isError } from '../guards.js';

/**
 * Options for the default serializer.
 */
export interface SerializerOptions {
  /**
   * Maximum depth for nested objects.
   *
   * Deeper objects will be replaced with `[Object]` or `[Array]`.
   *
   * @default Infinity
   */
  depth?: number;

  /**
   * Custom replacer for non-serializable values.
   *
   * This function is called for each value during serialization and can
   * transform or filter values before they're converted to JSON.
   *
   * @example
   *
   * ```typescript
   * replacer: (value) => {
   *   // Redact secrets
   *   if (typeof value === 'object' && value && 'password' in value) {
   *     return { ...value, password: '[REDACTED]' };
   *   }
   *   return value;
   * };
   * ```
   *
   * @param value - The value to process
   * @returns The transformed value, or `undefined` to omit
   */
  replacer?: (value: unknown) => unknown;

  /**
   * Whether to sort object keys alphabetically.
   *
   * This ensures deterministic output regardless of property insertion order.
   *
   * @default true
   */
  sortKeys?: boolean;
}

/**
 * Default JSON replacer that handles non-JSON types.
 *
 * Converts JavaScript-specific types into JSON-serializable representations:
 *
 * - Functions: omitted (`undefined`)
 * - Symbols: converted to string
 * - BigInt: converted to string with `n` suffix
 * - `undefined`: converted to string `'undefined'`
 * - RegExp: converted to string representation
 * - Date: converted to ISO string
 * - Error: converted to object with name, message, and other properties
 * - Map: converted to `{ __type: 'Map', entries: [...] }`
 * - Set: converted to `{ __type: 'Set', values: [...] }`
 *
 * @example
 *
 * ```typescript
 * defaultReplacer(Symbol('test')); // 'Symbol(test)'
 * defaultReplacer(42n); // '42n'
 * defaultReplacer(() => {}); // undefined (omitted)
 * ```
 *
 * @function
 * @param value - Value to convert
 * @returns Converted value, or `undefined` to omit
 */
const defaultReplacer = (value: unknown): unknown => {
  // Functions are omitted
  if (typeof value === 'function' || value === undefined) {
    return undefined;
  }

  // Symbols converted to string
  if (typeof value === 'symbol') {
    return value.toString();
  }

  // BigInt converted to string with suffix
  if (typeof value === 'bigint') {
    return `${value.toString()}n`;
  }

  if (isA(value, RegExp)) {
    return value.toString();
  }

  if (isA(value, Date)) {
    return value.toISOString();
  }

  if (isError(value)) {
    const errorProps: Record<string, unknown> = {
      message: value.message,
      name: value.name,
    };

    // Include other enumerable properties
    for (const prop of getOwnPropertyNames(value)) {
      if (prop !== 'stack') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        errorProps[prop] = (value as any)[prop];
      }
    }

    return errorProps;
  }

  // Map to array of entries
  if (isA(value, Map)) {
    return {
      __type: 'Map',
      entries: [...value.entries()],
    };
  }

  // Set to array
  if (isA(value, Set)) {
    return {
      __type: 'Set',
      values: [...value.values()],
    };
  }

  return value;
};

/**
 * Detects and marks circular references in an object graph, and applies
 * replacer for special types.
 *
 * Uses a WeakSet to track visited objects without holding strong references.
 * Circular references are replaced with the string `'[Circular]'`.
 *
 * @example
 *
 * ```typescript
 * const obj: any = { a: 1 };
 * obj.self = obj;
 * detectCircular(obj, defaultReplacer); // { a: 1, self: '[Circular]' }
 * ```
 *
 * @function
 * @param value - Value to process
 * @param replacer - Function to transform values
 * @returns Value with circular references replaced and special types converted
 */
const detectCircular = (
  value: unknown,
  replacer: (value: unknown) => unknown,
): unknown => {
  const seen = new WeakSet<object>();

  /**
   * @function
   */
  const visit = (val: unknown): unknown => {
    // Apply replacer first (handles special types)
    const replaced = replacer(val);

    // If replacer returned something different, use it
    if (replaced !== val) {
      // If replaced is an object, we need to visit it recursively
      if (typeof replaced === 'object' && replaced !== null) {
        val = replaced;
      } else {
        // Primitive or special transformation, return as-is
        return replaced;
      }
    }

    // Primitives can't be circular
    if (typeof val !== 'object' || val === null) {
      return val;
    }

    // Check if we've seen this object before
    if (seen.has(val)) {
      return '[Circular]';
    }

    // Mark as seen
    seen.add(val);

    // Handle arrays
    if (isArray(val)) {
      return val.map((item) => visit(item));
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of entries(val)) {
      const visited = visit(value);
      // Only include if not undefined (functions are omitted)
      if (visited !== undefined) {
        result[key] = visited;
      }
    }
    return result;
  };

  return visit(value);
};

/**
 * Default serializer using JSON.stringify with custom handling.
 *
 * This serializer provides robust handling of JavaScript values including:
 *
 * - Circular reference detection
 * - Non-JSON type conversion
 * - Optional key sorting for deterministic output
 * - Custom replacer support
 *
 * The output is formatted with 2-space indentation for readability.
 *
 * @example
 *
 * ```typescript
 * const obj = { b: 2, a: 1, date: new Date('2025-01-01') };
 * defaultSerializer(obj, { sortKeys: true });
 * // Returns:
 * // {
 * //   "a": 1,
 * //   "b": 2,
 * //   "date": "2025-01-01T00:00:00.000Z"
 * // }
 * ```
 *
 * @example
 *
 * ```typescript
 * const circular: any = { a: 1 };
 * circular.self = circular;
 * defaultSerializer(circular);
 * // Returns:
 * // {
 * //   "a": 1,
 * //   "self": "[Circular]"
 * // }
 * ```
 *
 * @function
 * @param value - Value to serialize
 * @param options - Serialization options
 * @returns JSON string representation
 */
export const defaultSerializer = (
  value: unknown,
  options: SerializerOptions = {},
): string => {
  const { replacer = defaultReplacer } = options;

  // Handle circular references and apply replacer
  const processed = detectCircular(value, replacer);
  // Don't pass replacer to stringify - it's already been applied
  return String(stringify(processed, { space: 2 }));
};

/**
 * Serializer compatible with node:test's snapshot format.
 *
 * This is currently an alias for {@link defaultSerializer}, but exists as a
 * separate export to allow for future node:test-specific customization.
 *
 * @example
 *
 * ```typescript
 * import test from 'node:test';
 * import { nodeTestCompatibleSerializer } from 'bupkis/snapshot';
 *
 * test('my test', (t) => {
 *   const data = { foo: 'bar' };
 *   expect(data, 'to match snapshot', t, {
 *     serializer: nodeTestCompatibleSerializer,
 *   });
 * });
 * ```
 *
 * @function
 * @param value - Value to serialize
 * @returns JSON string representation
 */
export const nodeTestCompatibleSerializer = (value: unknown): string => {
  // Node:test expects the same format as our default serializer
  return defaultSerializer(value);
};
