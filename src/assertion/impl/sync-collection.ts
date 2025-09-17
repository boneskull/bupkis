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
 * @showGroups
 */

// Import es-shims as library functions (no global pollution)
import setDifference from 'set.prototype.difference';
import setIntersection from 'set.prototype.intersection';
import isDisjointFrom from 'set.prototype.isdisjointfrom';
import isSubsetOf from 'set.prototype.issubsetof';
import isSupersetOf from 'set.prototype.issupersetof';
import symmetricDifference from 'set.prototype.symmetricdifference';
import setUnion from 'set.prototype.union';
import { z } from 'zod/v4';

import type { AssertionFailure } from '../assertion-types.js';

import { isWeakKey } from '../../guards.js';
import { createAssertion } from '../create.js';

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
 */
export const mapContainsAssertion = createAssertion(
  [
    z.map(z.unknown(), z.unknown()).or(z.instanceof(WeakMap)),
    ['to contain', 'to include'],
    z.unknown(),
  ],
  (subject, key): AssertionFailure | boolean => {
    // WeakMap.has only works with object or symbol keys
    let hasKey: boolean;
    if (subject instanceof WeakMap) {
      if (!isWeakKey(key)) {
        return {
          actual: typeof key,
          expected: 'object or symbol',
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
    return true;
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
 */
export const mapSizeAssertion = createAssertion(
  [z.map(z.unknown(), z.unknown()), 'to have size', z.number()],
  (subject, expectedSize): AssertionFailure | boolean => {
    if (subject.size === expectedSize) return true;
    return {
      actual: subject.size,
      expected: expectedSize,
      message: `Expected ${subject.constructor.name} to have size ${expectedSize}, got ${subject.size}`,
    };
  },
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
 */
export const emptyMapAssertion = createAssertion(
  [z.map(z.unknown(), z.unknown()), 'to be empty'],
  (subject) => subject.size === 0,
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
 */
export const setContainsAssertion = createAssertion(
  [
    z.set(z.unknown()).or(z.instanceof(WeakSet)),
    ['to contain', 'to include'],
    z.any(),
  ],
  (subject, value): AssertionFailure | boolean => {
    // WeakSet.has only works with object or symbol values
    if (subject instanceof WeakSet && !isWeakKey(value)) {
      return {
        actual: typeof value,
        expected: 'object or symbol',
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
    return true;
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
 */
export const setSizeAssertion = createAssertion(
  [z.set(z.unknown()), 'to have size', z.number()],
  (subject, expectedSize): AssertionFailure | boolean => {
    if (subject.size === expectedSize) return true;
    return {
      actual: subject.size,
      expected: expectedSize,
      message: `Expected ${subject.constructor.name} to have size ${expectedSize}, got ${subject.size}`,
    };
  },
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
 */
export const emptySetAssertion = createAssertion(
  [z.set(z.unknown()), 'to be empty'],
  (subject): AssertionFailure | boolean => {
    if (subject.size === 0) return true;
    return {
      actual: subject.size,
      expected: 0,
      message: `Expected ${subject.constructor.name} to be empty, got size ${subject.size}`,
    };
  },
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
 */
export const arrayContainsAssertion = createAssertion(
  [z.array(z.any()), ['to contain', 'to include'], z.any()],
  (subject, value): AssertionFailure | boolean => {
    if (subject.includes(value)) return true;
    return {
      actual: subject,
      expected: `array containing ${String(value)}`,
      message: `Expected array to contain value`,
    };
  },
);

/**
 * Asserts that an array has a specific size.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to have size', 3); // passes
 * expect([1, 2, 3], 'to have size', 2); // fails
 * ```
 *
 * @group Collection Assertions
 */
export const arraySizeAssertion = createAssertion(
  [z.array(z.any()), 'to have size', z.number()],
  (subject, expectedSize): AssertionFailure | boolean => {
    if (subject.length === expectedSize) return true;
    return {
      actual: subject.length,
      expected: expectedSize,
      message: `Expected array to have size ${expectedSize}, got ${subject.length}`,
    };
  },
);

/**
 * Asserts that an array has a specific length.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to have length', 3); // passes
 * expect([1, 2, 3], 'to have length', 2); // fails
 * ```
 *
 * @group Collection Assertions
 */
export const arrayLengthAssertion = createAssertion(
  [z.array(z.any()), 'to have length', z.number()],
  (subject, expectedLength): AssertionFailure | boolean => {
    if (subject.length === expectedLength) return true;
    return {
      actual: subject.length,
      expected: expectedLength,
      message: `Expected array to have length ${expectedLength}, got ${subject.length}`,
    };
  },
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
 */
export const nonEmptyArrayAssertion = createAssertion(
  [z.array(z.any()), 'to be non-empty'],
  (subject) => {
    if (subject.length === 0) {
      return {
        actual: subject.length,
        expected: 'non-empty array',
        message: 'Expected array to be non-empty',
      };
    }
  },
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
 */
export const objectKeysAssertion = createAssertion(
  [
    z.looseObject({}),
    ['to have keys', 'to have properties', 'to have props'],
    z.tuple([z.string()], z.string()),
  ],
  (_, keys) =>
    z.looseObject(
      Object.fromEntries(keys.map((k) => [k, z.unknown().nonoptional()])),
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
 */
export const objectSizeAssertion = createAssertion(
  [z.looseObject({}), 'to have size', z.number().int().nonnegative()],
  (subject, expectedSize) => {
    const actual = Object.keys(subject).length;
    if (actual !== expectedSize) {
      return {
        actual: actual,
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
 */
export const setEqualityAssertion = createAssertion(
  [z.set(z.unknown()), 'to equal', z.set(z.unknown())],
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
 */
export const setSubsetAssertion = createAssertion(
  [z.set(z.unknown()), 'to be a subset of', z.set(z.unknown())],
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
 */
export const setSupersetAssertion = createAssertion(
  [z.set(z.unknown()), 'to be a superset of', z.set(z.unknown())],
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
 */
export const setIntersectionAssertion = createAssertion(
  [z.set(z.unknown()), 'to intersect with', z.set(z.unknown())],
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
 */
export const setDisjointAssertion = createAssertion(
  [z.set(z.unknown()), 'to be disjoint from', z.set(z.unknown())],
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
 */
export const setUnionEqualityAssertion = createAssertion(
  [
    z.set(z.unknown()),
    'to have union',
    z.set(z.unknown()),
    'equal to',
    z.set(z.unknown()),
  ],
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
 */
export const setIntersectionEqualityAssertion = createAssertion(
  [
    z.set(z.unknown()),
    'to have intersection',
    z.set(z.unknown()),
    'equal to',
    z.set(z.unknown()),
  ],
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
 */
export const setDifferenceEqualityAssertion = createAssertion(
  [
    z.set(z.unknown()),
    'to have difference',
    z.set(z.unknown()),
    'equal to',
    z.set(z.unknown()),
  ],
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
 */
export const setSymmetricDifferenceEqualityAssertion = createAssertion(
  [
    z.set(z.unknown()),
    'to have symmetric difference',
    z.set(z.unknown()),
    'equal to',
    z.set(z.unknown()),
  ],
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
 */
export const mapKeyAssertion = createAssertion(
  [z.map(z.unknown(), z.unknown()), 'to have key', z.unknown()],
  (map, key): AssertionFailure | boolean => {
    if (map.has(key)) return true;
    return {
      actual: Array.from(map.keys()),
      expected: key,
      message: `Expected Map to have key`,
    };
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
 */
export const mapValueAssertion = createAssertion(
  [z.map(z.unknown(), z.unknown()), 'to have value', z.unknown()],
  (map, value): AssertionFailure | boolean => {
    for (const mapValue of map.values()) {
      if (mapValue === value) return true;
    }
    return {
      actual: Array.from(map.values()),
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
 */
export const mapEntryAssertion = createAssertion(
  [
    z.map(z.unknown(), z.unknown()).or(z.instanceof(WeakMap)),
    'to have entry',
    z.tuple([z.unknown(), z.unknown()]),
  ],
  (map, [key, value]): AssertionFailure | boolean => {
    // WeakMap operations only work with object or symbol keys
    if (map instanceof WeakMap && !isWeakKey(key)) {
      return {
        actual: typeof key,
        expected: 'object or symbol',
        message: `WeakMap keys must be objects or symbols, got ${typeof key}`,
      };
    }

    // At this point, if it's a WeakMap, we know key is a WeakKey
    const actualValue =
      map instanceof WeakMap ? map.get(key as WeakKey) : map.get(key);
    if (actualValue === value) return true;

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
 */
export const mapEqualityAssertion = createAssertion(
  [
    z.map(z.unknown(), z.unknown()),
    'to equal',
    z.map(z.unknown(), z.unknown()),
  ],
  (mapA, mapB): AssertionFailure | boolean => {
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
          actual: `missing key: ${String(key)}`,
          expected: `key ${String(key)} to exist`,
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
    return true;
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
 */
export const collectionSizeGreaterThanAssertion = createAssertion(
  [
    z.union([z.map(z.unknown(), z.unknown()), z.set(z.unknown())]),
    'to have size greater than',
    z.number(),
  ],
  (collection, minSize): AssertionFailure | boolean => {
    if (collection.size > minSize) return true;
    return {
      actual: collection.size,
      expected: `size greater than ${minSize}`,
      message: `Expected ${collection.constructor.name} to have size greater than ${minSize}, got ${collection.size}`,
    };
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
 */
export const collectionSizeLessThanAssertion = createAssertion(
  [
    z.union([z.map(z.unknown(), z.unknown()), z.set(z.unknown())]),
    'to have size less than',
    z.number(),
  ],
  (collection, maxSize): AssertionFailure | boolean => {
    if (collection.size < maxSize) return true;
    return {
      actual: collection.size,
      expected: `size less than ${maxSize}`,
      message: `Expected ${collection.constructor.name} to have size less than ${maxSize}, got ${collection.size}`,
    };
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
 */
export const collectionSizeBetweenAssertion = createAssertion(
  [
    z.union([z.map(z.unknown(), z.unknown()), z.set(z.unknown())]),
    'to have size between',
    z.tuple([z.number(), z.number()]),
  ],
  (collection, [min, max]): AssertionFailure | boolean => {
    const size = collection.size;
    if (size >= min && size <= max) return true;
    return {
      actual: size,
      expected: `size between ${min} and ${max} (inclusive)`,
      message: `Expected ${collection.constructor.name} to have size between ${min} and ${max}, got ${size}`,
    };
  },
);
