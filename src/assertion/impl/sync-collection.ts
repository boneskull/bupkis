// do not remove; otherwise zshy will not resolve the .d.ts file; it must be referenced directly
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./shims.d.ts" />
/**
 * Collection-based assertions for arrays, objects, Maps, and Sets.
 *
 * These assertions handle operations like containment, size checking, and
 * set-theoretic operations for various collection types including native
 * JavaScript collections and WeakMap/WeakSet.
 *
 * @packageDocumentation
 * @groupDescription Collection Assertions
 * Assertions for arrays, objects, Maps, Sets, and collection operations.
 *
 * @showGroup
 */
import setDifference from 'set.prototype.difference';
import setIntersection from 'set.prototype.intersection';
import isDisjointFrom from 'set.prototype.isdisjointfrom';
import isSubsetOf from 'set.prototype.issubsetof';
import isSupersetOf from 'set.prototype.issupersetof';
import symmetricDifference from 'set.prototype.symmetricdifference';
import setUnion from 'set.prototype.union';
import { z } from 'zod/v4';

import { isWeakKey } from '../../guards.js';
import {
  AnyMapSchema,
  AnySetSchema,
  KeypathSchema,
  MapSchema,
  NonCollectionObjectSchema,
  NonNegativeIntegerSchema,
  PropertyKeySchema,
  SetSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
  UnknownSchema,
} from '../../schema.js';
import { has } from '../../util.js';
import {
  valueToSchema,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion } from '../create.js';

const { hasOwn, keys } = Object;

/**
 * Asserts that a Map or WeakMap contains a specific key. For WeakMap, the key
 * must be an object.
 *
 * @example
 *
 * ```ts
 * const map = new Map([['key', 'value']]);
 * expect(map, 'to contain', 'key'); // passes
 *
 * const obj = {};
 * const weakMap = new WeakMap([[obj, 'value']]);
 * expect(weakMap, 'to contain', obj); // passes
 * expect(weakMap, 'to contain', 'string'); // fails (not an object)
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-contain-any
 * @bupkisAssertionCategory collections
 */
export const mapContainsAssertion = createAssertion(
  [AnyMapSchema, ['to contain', 'to include'], UnknownSchema],
  (subject, key) => {
    // WeakMap.has only works with object or symbol keys
    let hasKey: boolean;
    if (subject instanceof WeakMap) {
      if (!isWeakKey(key)) {
        return {
          message: `WeakMap keys must be objects or symbols, got ${typeof key}`,
        };
      }
      hasKey = subject.has(key);
    } else {
      hasKey = subject.has(key);
    }
    if (!hasKey) {
      return {
        actual: key,
        expected: `key to exist in ${subject.constructor.name}`,
        message: `Expected ${subject.constructor.name} to contain key`,
      };
    }
  },
);

/**
 * Asserts that a Map has a specific size.
 *
 * @example
 *
 * ```ts
 * const map = new Map([
 *   ['a', 1],
 *   ['b', 2],
 * ]);
 * expect(map, 'to have size', 2); // passes
 * expect(map, 'to have size', 3); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-have-size-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const mapSizeAssertion = createAssertion(
  [MapSchema, 'to have size', NonNegativeIntegerSchema],
  (_subject, expectedSize) =>
    z.map(z.unknown(), z.unknown()).refine((map) => map.size === expectedSize, {
      error: `Expected Map to have size ${expectedSize}`,
    }),
);

/**
 * Asserts that a Map is empty.
 *
 * @example
 *
 * ```ts
 * expect(new Map(), 'to be empty'); // passes
 * expect(new Map([['key', 'value']]), 'to be empty'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-be-empty
 * @bupkisAssertionCategory collections
 */
export const emptyMapAssertion = createAssertion(
  [MapSchema, 'to be empty'],
  MapSchema.refine((map) => map.size === 0, {
    error: 'Expected Map to be empty',
  }),
);

/**
 * Asserts that a Set or WeakSet contains a specific value. For WeakSet, the
 * value must be an object.
 *
 * @example
 *
 * ```ts
 * const set = new Set(['a', 'b']);
 * expect(set, 'to contain', 'a'); // passes
 *
 * const obj = {};
 * const weakSet = new WeakSet([obj]);
 * expect(weakSet, 'to contain', obj); // passes
 * expect(weakSet, 'to contain', 'string'); // fails (not an object)
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-contain-any
 * @bupkisAssertionCategory collections
 */
export const setContainsAssertion = createAssertion(
  [AnySetSchema, ['to contain', 'to include'], UnknownSchema],
  (subject, value) => {
    // WeakSet.has only works with object or symbol values
    if (subject instanceof WeakSet && !isWeakKey(value)) {
      return {
        message: `WeakSet values must be objects or symbols, got ${typeof value}`,
      };
    }
    // At this point, if it's a WeakSet, we know value is a WeakKey
    const hasValue =
      subject instanceof WeakSet
        ? subject.has(value as WeakKey)
        : subject.has(value);
    if (!hasValue) {
      return {
        actual: value,
        expected: `value to exist in ${subject.constructor.name}`,
        message: `Expected ${subject.constructor.name} to contain value`,
      };
    }
  },
);

/**
 * Asserts that a Set has a specific size.
 *
 * @example
 *
 * ```ts
 * const set = new Set(['a', 'b']);
 * expect(set, 'to have size', 2); // passes
 * expect(set, 'to have size', 3); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-have-size-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const setSizeAssertion = createAssertion(
  [SetSchema, 'to have size', NonNegativeIntegerSchema],
  (_subject, expectedSize) =>
    z
      .set(z.unknown())
      .min(expectedSize, { error: `Expected Set to have size ${expectedSize}` })
      .max(expectedSize, {
        error: `Expected Set to have size ${expectedSize}`,
      }),
);

/**
 * Asserts that a Set is empty.
 *
 * @example
 *
 * ```ts
 * expect(new Set(), 'to be empty'); // passes
 * expect(new Set(['value']), 'to be empty'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-be-empty
 * @bupkisAssertionCategory collections
 */
export const emptySetAssertion = createAssertion(
  [SetSchema, 'to be empty'],
  SetSchema.refine(({ size }) => size === 0, {
    error: 'Expected Set to be empty',
  }),
);

/**
 * Asserts that an array contains a specific value.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to contain', 2); // passes
 * expect([1, 2, 3], 'to contain', 4); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor array-to-contain-any
 * @bupkisAssertionCategory collections
 */
export const arrayContainsAssertion = createAssertion(
  [UnknownArraySchema, ['to contain', 'to include'], UnknownSchema],
  (subject, value) => {
    if (!subject.includes(value)) {
      return {
        message: `Expected array to contain value`,
      };
    }
  },
);

/**
 * Asserts that an array contains an item that satisfies a given shape or
 * pattern. Uses partial matching semantics - the item only needs to match the
 * specified properties.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1, b: 2 }, { c: 3 }], 'to have item satisfying', { a: 1 }); // passes
 * expect([{ a: 1 }, { b: 2 }], 'to have an item satisfying', { c: 3 }); // fails
 * expect([1, 2, 3], 'to contain item satisfying', 2); // passes (exact match)
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor array-to-have-item-satisfying
 * @bupkisAssertionCategory collections
 */
export const arrayItemSatisfiesAssertion = createAssertion(
  [
    UnknownArraySchema,
    [
      'to have item satisfying',
      'to have an item satisfying',
      'to contain item satisfying',
    ],
    UnknownSchema,
  ],
  (subject, shape) => {
    const schema = valueToSchema(shape, valueToSchemaOptionsForSatisfies);
    for (const item of subject) {
      const result = schema.safeParse(item);
      if (result.success) {
        return;
      }
    }
    return {
      message: `Expected array to contain an item satisfying the given shape`,
    };
  },
);

/**
 * Asserts that an array has a specific size.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to have length', 3); // passes
 * expect([1, 2, 3], 'to have size', 2); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor array-to-have-size-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const arraySizeAssertion = createAssertion(
  [
    UnknownArraySchema,
    ['to have length', 'to have size'],
    NonNegativeIntegerSchema,
  ],
  (_subject, expectedSize) =>
    UnknownArraySchema.min(expectedSize, {
      error: `Expected array to have size ${expectedSize}}`,
    }).max(expectedSize, {
      error: `Expected array to have size ${expectedSize}}`,
    }),
);

/**
 * Asserts that an array is non-empty.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to be non-empty'); // passes
 * expect([], 'to be non-empty'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor array-not-to-be-empty
 * @bupkisAssertionCategory collections
 */
export const nonEmptyArrayAssertion = createAssertion(
  [UnknownArraySchema, 'to be non-empty'],
  UnknownArraySchema.min(1, { error: 'Expected array to be non-empty' }),
);

/**
 * Asserts that an object has specific keys/properties.
 *
 * @example
 *
 * ```ts
 * expect({ a: 1, b: 2 }, 'to have keys', 'a', 'b'); // passes
 * expect({ a: 1 }, 'to have keys', 'a', 'b'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor object-to-have-keys-array
 * @bupkisAssertionCategory object
 */
// TODO support keypaths, maybe.
// TODO support `undefined` values (will require moving away from Zod schema)
export const objectKeysAssertion = createAssertion(
  [
    NonCollectionObjectSchema,
    [
      'to have keys',
      'to have properties',
      'to have props',
      'to contain keys',
      'to contain properties',
      'to contain props',
      'to include keys',
      'to include properties',
      'to include props',
    ],
    z.array(PropertyKeySchema).nonempty(),
  ],
  (_subject, keys) =>
    NonCollectionObjectSchema.superRefine((subject, ctx) => {
      // iterate thru keys and add an issue for each missing
      for (const k of keys) {
        if (!hasOwn(subject, k)) {
          ctx.addIssue({
            code: 'custom',
            input: subject,
            message: `Expected object to contain key "${String(k)}"`,
            params: { bupkisType: 'missing_key' },
          });
        }
      }
    }),
);

/**
 * Asserts that an object has a property at the specified keypath using dot or
 * bracket notation. Uses the `has()` function to traverse nested properties and
 * supports complex keypaths like 'foo.bar[0]["baz"]'.
 *
 * This assertion supports:
 *
 * - Dot notation: 'prop.nested'
 * - Bracket notation with numbers: 'arr[0]'
 * - Bracket notation with quoted strings: 'obj["key"]' or "obj['key']"
 * - Mixed notation: 'data.items[1].name'
 *
 * @example
 *
 * ```ts
 * const obj = {
 *   foo: { bar: [{ baz: 'value' }] },
 *   'kebab-case': 'works',
 * };
 *
 * expect(obj, 'to have key', 'foo.bar'); // passes
 * expect(obj, 'to have property', 'foo.bar[0].baz'); // passes
 * expect(obj, 'to have prop', 'foo["kebab-case"]'); // passes
 * expect(obj, 'to have key', 'nonexistent.path'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor object-to-have-key-string-number-symbol
 * @bupkisAssertionCategory object
 */
export const objectKeyAssertion = createAssertion(
  [
    NonCollectionObjectSchema,
    [
      'to have key',
      'to have property',
      'to have prop',
      'to contain key',
      'to contain property',
      'to contain prop',
      'to include key',
      'to include property',
      'to include prop',
    ],
    KeypathSchema,
  ],
  (subject, keypath) => {
    const result = has(subject, keypath);
    if (!result) {
      return {
        actual: 'no such keypath',
        expect: `to have keypath ${keypath}`,
        message: `Expected object to contain keypath ${keypath}`,
      };
    }
  },
);

/**
 * Asserts that an object has an exact property key without keypath traversal.
 * This assertion checks for direct properties on the object and supports
 * symbols and keys that would conflict with bracket/dot notation.
 *
 * Unlike `objectKeyAssertion`, this does not use the `has()` function and
 * therefore:
 *
 * - Does not support keypath traversal (no dots or brackets)
 * - Can check for symbol keys
 * - Can check for keys containing dots, brackets, or other special characters
 * - Only checks direct properties (no nested access)
 *
 * @example
 *
 * ```ts
 * const sym = Symbol('test');
 * const obj = {
 *   simple: 'value',
 *   'key.with.dots': 'direct property',
 *   'key[with]brackets': 'another direct property',
 *   [sym]: 'symbol value',
 * };
 *
 * expect(obj, 'to have exact key', 'simple'); // passes
 * expect(obj, 'to have exact property', 'key.with.dots'); // passes (literal key)
 * expect(obj, 'to have exact prop', 'key[with]brackets'); // passes (literal key)
 * expect(obj, 'to have exact key', sym); // passes (symbol key)
 *
 * // These would fail because they're not direct properties:
 * expect(obj, 'to have exact key', 'nested.path'); // fails (no keypath traversal)
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor object-to-have-only-keys-array
 * @bupkisAssertionCategory object
 */
export const objectExactKeyAssertion = createAssertion(
  [
    NonCollectionObjectSchema,
    ['to have exact key', 'to have exact property', 'to have exact prop'],
    PropertyKeySchema,
  ],
  (_, key) =>
    NonCollectionObjectSchema.transform((v) => ({ ...v })).refine(
      (value) => hasOwn(value, key),
      { error: `Expected object to have own exact key "${String(key)}"` },
    ),
);

/**
 * Asserts that an object has a specific number of keys.
 *
 * @example
 *
 * ```ts
 * expect({ a: 1, b: 2 }, 'to have size', 2); // passes
 * expect({ a: 1 }, 'to have size', 2); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor unknown-to-be-an-object
 * @bupkisAssertionCategory object
 */
export const objectSizeAssertion = createAssertion(
  [UnknownRecordSchema, 'to have size', NonNegativeIntegerSchema],
  (subject, expectedSize) => {
    const actual = keys(subject).length;
    if (actual !== expectedSize) {
      return {
        actual,
        expected: expectedSize,
        message: `Expected object to have ${expectedSize} keys, but it has ${actual} keys`,
      };
    }
  },
);

/**
 * Asserts that two Sets are equal (same elements, order-independent).
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2]), 'to equal', new Set([2, 1])); // passes
 * expect(new Set([1, 2]), 'to equal', new Set([1, 3])); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-equal-set
 * @bupkisAssertionCategory collections
 */
export const setEqualityAssertion = createAssertion(
  [SetSchema, 'to equal', SetSchema],
  (actual, expected) => {
    return actual.size === expected.size && isSubsetOf(actual, expected);
  },
);

/**
 * Asserts that one Set is a subset of another.
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2]), 'to be a subset of', new Set([1, 2, 3])); // passes
 * expect(new Set([1, 4]), 'to be a subset of', new Set([1, 2, 3])); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-be-a-subset-of-set
 * @bupkisAssertionCategory collections
 */
export const setSubsetAssertion = createAssertion(
  [SetSchema, 'to be a subset of', SetSchema],
  (subset, superset) => isSubsetOf(subset, superset),
);

/**
 * Asserts that one Set is a superset of another.
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2, 3]), 'to be a superset of', new Set([1, 2])); // passes
 * expect(new Set([1, 2]), 'to be a superset of', new Set([1, 2, 3])); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-be-a-superset-of-set
 * @bupkisAssertionCategory collections
 */
export const setSupersetAssertion = createAssertion(
  [SetSchema, 'to be a superset of', SetSchema],
  (superset, subset) => isSupersetOf(superset, subset),
);

/**
 * Asserts that two Sets intersect (have common elements).
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2]), 'to intersect with', new Set([2, 3])); // passes
 * expect(new Set([1, 2]), 'to intersect with', new Set([3, 4])); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-have-intersection-with-set-satisfying-any
 * @bupkisAssertionCategory collections
 */
export const setIntersectionAssertion = createAssertion(
  [SetSchema, 'to intersect with', SetSchema],
  (setA, setB) => !isDisjointFrom(setA, setB),
);

/**
 * Asserts that two Sets are disjoint (have no common elements).
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2]), 'to be disjoint from', new Set([3, 4])); // passes
 * expect(new Set([1, 2]), 'to be disjoint from', new Set([2, 3])); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-to-be-disjoint-from-set
 * @bupkisAssertionCategory collections
 */
export const setDisjointAssertion = createAssertion(
  [SetSchema, 'to be disjoint from', SetSchema],
  (setA, setB) => isDisjointFrom(setA, setB),
);

/**
 * Asserts that the union of two Sets equals a third Set.
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Set([1, 2]),
 *   'to have union',
 *   new Set([3]),
 *   'equal to',
 *   new Set([1, 2, 3]),
 * ); // passes
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-union-with-set-to-equal-set
 * @bupkisAssertionCategory collections
 */
export const setUnionEqualityAssertion = createAssertion(
  [SetSchema, 'to have union', SetSchema, 'equal to', SetSchema],
  (setA, setB, expected) => {
    const result = setUnion(setA, setB);
    return (
      result.size === expected.size &&
      isSubsetOf(result, expected) &&
      isSubsetOf(expected, result)
    );
  },
);

/**
 * Asserts that the intersection of two Sets equals a third Set.
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Set([1, 2, 3]),
 *   'to have intersection',
 *   new Set([2, 3, 4]),
 *   'equal to',
 *   new Set([2, 3]),
 * ); // passes
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-intersection-with-set-to-equal-set
 * @bupkisAssertionCategory collections
 */
export const setIntersectionEqualityAssertion = createAssertion(
  [SetSchema, 'to have intersection', SetSchema, 'equal to', SetSchema],
  (setA, setB, expected) => {
    const result = setIntersection(setA, setB);
    return (
      result.size === expected.size &&
      isSubsetOf(result, expected) &&
      isSubsetOf(expected, result)
    );
  },
);

/**
 * Asserts that the difference between two Sets equals a third Set.
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Set([1, 2, 3]),
 *   'to have difference',
 *   new Set([2, 4]),
 *   'equal to',
 *   new Set([1, 3]),
 * ); // passes
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-difference-with-set-to-equal-set
 * @bupkisAssertionCategory collections
 */
export const setDifferenceEqualityAssertion = createAssertion(
  [SetSchema, 'to have difference', SetSchema, 'equal to', SetSchema],
  (setA, setB, expected) => {
    const result = setDifference(setA, setB);
    return (
      result.size === expected.size &&
      isSubsetOf(result, expected) &&
      isSubsetOf(expected, result)
    );
  },
);

/**
 * Asserts that the symmetric difference between two Sets equals a third Set.
 *
 * @example
 *
 * ```ts
 * expect(
 *   new Set([1, 2]),
 *   'to have symmetric difference',
 *   new Set([2, 3]),
 *   'equal to',
 *   new Set([1, 3]),
 * ); // passes
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor set-symmetric-difference-with-set-to-equal-set
 * @bupkisAssertionCategory collections
 */
export const setSymmetricDifferenceEqualityAssertion = createAssertion(
  [SetSchema, 'to have symmetric difference', SetSchema, 'equal to', SetSchema],
  (setA, setB, expected) => {
    const result = symmetricDifference(setA, setB);
    return (
      result.size === expected.size &&
      isSubsetOf(result, expected) &&
      isSubsetOf(expected, result)
    );
  },
);

/**
 * Asserts that a Map has a specific key.
 *
 * @example
 *
 * ```ts
 * const map = new Map([['key', 'value']]);
 * expect(map, 'to have key', 'key'); // passes
 * expect(map, 'to have key', 'missing'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-have-key-any
 * @bupkisAssertionCategory collections
 */
export const mapKeyAssertion = createAssertion(
  [MapSchema, 'to have key', UnknownSchema],
  (map, key) => {
    if (!map.has(key)) {
      return {
        actual: [...map.keys()],
        expected: [...map.keys(), key],
        message: 'Expected Map to have key',
      };
    }
  },
);

/**
 * Asserts that a Map contains a specific value.
 *
 * @example
 *
 * ```ts
 * const map = new Map([['key', 'value']]);
 * expect(map, 'to have value', 'value'); // passes
 * expect(map, 'to have value', 'missing'); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-have-value-any
 * @bupkisAssertionCategory collections
 */
export const mapValueAssertion = createAssertion(
  [
    MapSchema,
    ['to have value', 'to contain value', 'to include value'],
    UnknownSchema,
  ],
  (map, value) => {
    for (const mapValue of map.values()) {
      if (mapValue === value) {
        return;
      }
    }
    return {
      actual: [...map.values()],
      expected: value,
      message: `Expected Map to have value`,
    };
  },
);

/**
 * Asserts that a Map has a specific key-value entry.
 *
 * @example
 *
 * ```ts
 * const map = new Map([['key', 'value']]);
 * expect(map, 'to have entry', ['key', 'value']); // passes
 * expect(map, 'to have entry', ['key', 'wrong']); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-have-entry-any-any
 * @bupkisAssertionCategory collections
 */
export const mapEntryAssertion = createAssertion(
  [
    AnyMapSchema,
    [
      'to have entry',
      'to have key/value pair',
      'to contain entry',
      'to contain key/value pair',
      'to include entry',
      'to include key/value pair',
    ],
    z.tuple([UnknownSchema, UnknownSchema]),
  ],
  (map, [key, value]) => {
    // WeakMap operations only work with object or symbol keys
    if (map instanceof WeakMap && !isWeakKey(key)) {
      return {
        message: `WeakMap keys must be objects or symbols, got ${typeof key}`,
      };
    }

    // At this point, if it's a WeakMap, we know key is a WeakKey
    const actualValue =
      map instanceof WeakMap ? map.get(key as WeakKey) : map.get(key);
    if (actualValue === value) {
      return;
    }

    const hasKey =
      map instanceof WeakMap ? map.has(key as WeakKey) : map.has(key);
    return {
      actual: hasKey ? [key, actualValue] : undefined,
      expected: [key, value],
      message: hasKey
        ? `Expected ${map.constructor.name} entry [${String(key)}, ${String(actualValue)}] to equal [${String(key)}, ${String(value)}]`
        : `Expected ${map.constructor.name} to have key ${String(key)}`,
    };
  },
);

/**
 * Asserts that two Maps are equal (same key-value pairs, order-independent).
 *
 * @example
 *
 * ```ts
 * const map1 = new Map([
 *   ['a', 1],
 *   ['b', 2],
 * ]);
 * const map2 = new Map([
 *   ['b', 2],
 *   ['a', 1],
 * ]);
 * expect(map1, 'to equal', map2); // passes
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor map-to-equal-map
 * @bupkisAssertionCategory collections
 */
export const mapEqualityAssertion = createAssertion(
  [MapSchema, 'to equal', MapSchema],
  (mapA, mapB) => {
    if (mapA.size !== mapB.size) {
      return {
        actual: mapA.size,
        expected: mapB.size,
        message: `Expected Maps to have equal sizes, got ${mapA.size} and ${mapB.size}`,
      };
    }
    for (const [key, value] of mapA) {
      if (!mapB.has(key)) {
        return {
          message: `Expected second Map to contain key ${String(key)}`,
        };
      }
      if (mapB.get(key) !== value) {
        return {
          actual: [key, mapB.get(key)],
          expected: [key, value],
          message: `Expected Maps to have equal value for key ${String(key)}`,
        };
      }
    }
  },
);

/**
 * Asserts that a collection (Map or Set) has a size greater than a threshold.
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2, 3]), 'to have size greater than', 2); // passes
 * expect(new Set([1]), 'to have size greater than', 2); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor collection-to-have-size-greater-than-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const collectionSizeGreaterThanAssertion = createAssertion(
  [
    z.union([MapSchema, SetSchema]),
    'to have size greater than',
    NonNegativeIntegerSchema,
  ],
  (collection, minSize) => {
    if (collection.size <= minSize) {
      return {
        actual: collection.size,
        expected: minSize,
        message: `Expected ${collection.constructor.name} to have size greater than ${minSize}, got ${collection.size}`,
      };
    }
  },
);

/**
 * Asserts that a collection (Map or Set) has a size less than a threshold.
 *
 * @example
 *
 * ```ts
 * expect(new Set([1]), 'to have size less than', 2); // passes
 * expect(new Set([1, 2, 3]), 'to have size less than', 2); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor collection-to-have-size-less-than-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const collectionSizeLessThanAssertion = createAssertion(
  [
    z.union([MapSchema, SetSchema]),
    'to have size less than',
    NonNegativeIntegerSchema,
  ],
  (collection, maxSize) => {
    if (collection.size >= maxSize) {
      return {
        actual: collection.size,
        expected: maxSize,
        message: `Expected ${collection.constructor.name} to have size less than ${maxSize}, got ${collection.size}`,
      };
    }
  },
);

/**
 * Asserts that a collection (Map or Set) has a size within a specific range.
 *
 * @example
 *
 * ```ts
 * expect(new Set([1, 2]), 'to have size between', [1, 3]); // passes
 * expect(new Set([1, 2, 3, 4]), 'to have size between', [1, 3]); // fails
 * ```
 *
 * @group Collection Assertions
 * @bupkisAnchor collection-to-have-size-between-nonnegative-integer-and-nonnegative-integer
 * @bupkisAssertionCategory collections
 */
export const collectionSizeBetweenAssertion = createAssertion(
  [
    z.union([MapSchema, SetSchema]),
    'to have size between',
    z.tuple([NonNegativeIntegerSchema, NonNegativeIntegerSchema]),
  ],
  (collection, [min, max]) => {
    const size = collection.size;
    if (!(size >= min && size <= max)) {
      return {
        message: `Expected ${collection.constructor.name} to have size between ${min} and ${max}, got ${size}`,
      };
    }
  },
);
