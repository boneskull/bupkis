// do not remove; otherwise zshy will not resolve the .d.ts file; it must be referenced directly
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./shims.d.ts" />
/**
 * Iterable assertions for synchronous iterables and iterators.
 *
 * These assertions test iterables using the **iteration protocol**
 * (`Symbol.iterator`), as opposed to collection assertions which use native
 * collection APIs. This distinction matters when a subject has custom
 * `Symbol.iterator` behavior that differs from its collection API.
 *
 * @packageDocumentation
 * @groupDescription Sync Iterable Assertions
 * Assertions for synchronous iterables and iterators using the iteration protocol.
 *
 * @showGroup
 */
import { inspect } from 'node:util';
import { z } from 'zod';

import {
  NonNegativeIntegerSchema,
  SyncIterableOrIteratorSchema,
  UnknownSchema,
} from '../../schema.js';
import {
  valueToSchema,
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion } from '../create.js';
import {
  collectSync,
  countSync,
  iterateFullySync,
  toIterator,
} from './iteration-util.js';

// =============================================================================
// 'to yield' assertions - check if ANY item matches
// =============================================================================

/**
 * Asserts that an iterable yields a value satisfying the expected shape.
 *
 * Uses partial/satisfy semantics (like `'to satisfy'`). The assertion passes if
 * ANY yielded value matches the expected shape.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1, b: 2 }], 'to yield', { a: 1 }); // passes (partial match)
 * expect([1, 2, 3], 'to emit', 2); // passes
 * expect(myGenerator(), 'to yield value satisfying', { name: 'test' }); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield', 'to emit', 'to yield value satisfying'],
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    let next = iterator.next();
    while (!next.done) {
      if (schema.safeParse(next.value).success) {
        return; // success - found a matching value
      }
      next = iterator.next();
    }
    return {
      message: `Expected iterable to yield a value satisfying ${inspect(expected)}, but none matched`,
    };
  },
);

/**
 * Asserts that an iterable yields a value exhaustively matching the expected
 * value.
 *
 * Uses deep equality semantics (like `'to equal'`). Extra properties on yielded
 * values cause failure.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }], 'to yield value exhaustively satisfying', { a: 1 }); // passes
 * expect([{ a: 1, b: 2 }], 'to yield value exhaustively satisfying', {
 *   a: 1,
 * }); // fails (extra prop)
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-value-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsExhaustivelyAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    'to yield value exhaustively satisfying',
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    let next = iterator.next();
    while (!next.done) {
      if (schema.safeParse(next.value).success) {
        return; // success - found an exact match
      }
      next = iterator.next();
    }
    return {
      message: `Expected iterable to yield a value exhaustively satisfying ${inspect(expected)}, but none matched`,
    };
  },
);

// =============================================================================
// 'to yield items satisfying' - ALL items must match
// =============================================================================

/**
 * Asserts that ALL yielded values individually satisfy the expected shape.
 *
 * Uses partial/satisfy semantics. Every item yielded must match.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }, { a: 2, b: 3 }], 'to yield items satisfying', {
 *   a: z.number(),
 * }); // passes
 * expect([1, 2, 3], 'to yield items satisfying', z.number()); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-items-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsItemsSatisfyingAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield items satisfying', UnknownSchema],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    let index = 0;
    let next = iterator.next();
    while (!next.done) {
      const result = schema.safeParse(next.value);
      if (!result.success) {
        return {
          message: `Expected all items to satisfy ${inspect(expected)}, but item at index ${index} did not match: ${inspect(next.value)}`,
        };
      }
      index++;
      next = iterator.next();
    }
    // Empty iterables trivially satisfy (vacuous truth)
  },
);

/**
 * Asserts that ALL yielded values individually match with deep equality.
 *
 * Uses strict equality semantics. Every item yielded must exactly match.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }, { a: 1 }], 'to yield items exhaustively satisfying', {
 *   a: 1,
 * }); // passes
 * expect([{ a: 1, b: 2 }], 'to yield items exhaustively satisfying', {
 *   a: 1,
 * }); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-items-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsItemsExhaustivelyAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    'to yield items exhaustively satisfying',
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    let index = 0;
    let next = iterator.next();
    while (!next.done) {
      const result = schema.safeParse(next.value);
      if (!result.success) {
        return {
          message: `Expected all items to exhaustively satisfy ${inspect(expected)}, but item at index ${index} did not match: ${inspect(next.value)}`,
        };
      }
      index++;
      next = iterator.next();
    }
  },
);

// =============================================================================
// First/Last assertions
// =============================================================================

/**
 * Asserts that the first yielded value satisfies the expected shape.
 *
 * Uses partial/satisfy semantics.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1, b: 2 }, { c: 3 }], 'to yield first', { a: 1 }); // passes
 * expect([1, 2, 3], 'to yield first satisfying', 1); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-first-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsFirstAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield first', 'to yield first satisfying'],
    UnknownSchema,
  ],
  (subject, expected) => {
    // Only call toIterator once to avoid exhausting raw iterators
    const iterator = toIterator(subject);
    const result = iterator.next();
    if (result.done) {
      return {
        message:
          'Expected iterable to yield at least one value, but it was empty',
      };
    }
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    if (!schema.safeParse(result.value).success) {
      return {
        message: `Expected first yielded value to satisfy ${inspect(expected)}, but got ${inspect(result.value)}`,
      };
    }
  },
);

/**
 * Asserts that the first yielded value exhaustively matches.
 *
 * Uses deep equality semantics.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }], 'to yield first exhaustively satisfying', { a: 1 }); // passes
 * expect([{ a: 1, b: 2 }], 'to yield first exhaustively satisfying', {
 *   a: 1,
 * }); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-first-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsFirstExhaustivelyAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    'to yield first exhaustively satisfying',
    UnknownSchema,
  ],
  (subject, expected) => {
    const iterator = toIterator(subject);
    const result = iterator.next();
    if (result.done) {
      return {
        message:
          'Expected iterable to yield at least one value, but it was empty',
      };
    }
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    if (!schema.safeParse(result.value).success) {
      return {
        message: `Expected first yielded value to exhaustively satisfy ${inspect(expected)}, but got ${inspect(result.value)}`,
      };
    }
  },
);

/**
 * Asserts that the last yielded value satisfies the expected shape.
 *
 * Uses partial/satisfy semantics. Note: fully consumes the iterator.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }, { b: 2, c: 3 }], 'to yield last', { b: 2 }); // passes
 * expect([1, 2, 3], 'to yield last satisfying', 3); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-last-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsLastAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield last', 'to yield last satisfying'],
    UnknownSchema,
  ],
  (subject, expected) => {
    const { hasValue, lastValue } = iterateFullySync(subject);
    if (!hasValue) {
      return {
        message:
          'Expected iterable to yield at least one value, but it was empty',
      };
    }
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    if (!schema.safeParse(lastValue).success) {
      return {
        message: `Expected last yielded value to satisfy ${inspect(expected)}, but got ${inspect(lastValue)}`,
      };
    }
  },
);

/**
 * Asserts that the last yielded value exhaustively matches.
 *
 * Uses deep equality semantics. Note: fully consumes the iterator.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1 }, { b: 2 }], 'to yield last exhaustively satisfying', {
 *   b: 2,
 * }); // passes
 * expect(
 *   [{ a: 1, extra: true }],
 *   'to yield last exhaustively satisfying',
 *   { a: 1 },
 * ); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-last-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsLastExhaustivelyAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    'to yield last exhaustively satisfying',
    UnknownSchema,
  ],
  (subject, expected) => {
    const { hasValue, lastValue } = iterateFullySync(subject);
    if (!hasValue) {
      return {
        message:
          'Expected iterable to yield at least one value, but it was empty',
      };
    }
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    if (!schema.safeParse(lastValue).success) {
      return {
        message: `Expected last yielded value to exhaustively satisfy ${inspect(expected)}, but got ${inspect(lastValue)}`,
      };
    }
  },
);

// =============================================================================
// Cardinality assertions
// =============================================================================

/**
 * Asserts that an iterable yields exactly the specified count of values.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to yield count', 3); // passes
 * expect(new Set([1, 2]), 'to yield count', 2); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-count-number
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsCountAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield count', NonNegativeIntegerSchema],
  (subject, expectedCount) => {
    const actual = countSync(subject);
    if (actual !== expectedCount) {
      return {
        actual,
        expected: expectedCount,
        message: `Expected iterable to yield ${expectedCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an iterable yields at least the specified count of values.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to yield at least', 2); // passes
 * expect([1], 'to yield at least', 2); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-at-least-number
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsAtLeastAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield at least', NonNegativeIntegerSchema],
  (subject, minCount) => {
    const actual = countSync(subject);
    if (actual < minCount) {
      return {
        actual,
        expected: `at least ${minCount}`,
        message: `Expected iterable to yield at least ${minCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an iterable yields at most the specified count of values.
 *
 * @example
 *
 * ```ts
 * expect([1, 2], 'to yield at most', 3); // passes
 * expect([1, 2, 3, 4], 'to yield at most', 3); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-at-most-number
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsAtMostAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield at most', NonNegativeIntegerSchema],
  (subject, maxCount) => {
    const actual = countSync(subject);
    if (actual > maxCount) {
      return {
        actual,
        expected: `at most ${maxCount}`,
        message: `Expected iterable to yield at most ${maxCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an iterable yields nothing (is empty).
 *
 * @remarks
 * Use `'not to be an empty iterable'` or `'to yield at least', 1` for non-empty
 * assertions.
 * @example
 *
 * ```ts
 * expect([], 'to be an empty iterable'); // passes
 * expect(new Set(), 'to be an empty iterable'); // passes
 * expect([1], 'to be an empty iterable'); // fails
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-be-an-empty-iterable
 * @bupkisAssertionCategory iterable
 */
export const iterableEmptyAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to be an empty iterable'],
  (subject) => {
    const iterator = toIterator(subject);
    const result = iterator.next();
    if (!result.done) {
      return {
        message: `Expected iterable to be empty, but it yielded at least one value: ${inspect(result.value)}`,
      };
    }
  },
);

// =============================================================================
// Sequence/Collection assertions
// =============================================================================

/**
 * Asserts that an iterable yields exactly the specified values in order.
 *
 * Uses deep equality semantics. The iterable must yield the exact same number
 * of values in the exact same order.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to yield exactly', [1, 2, 3]); // passes
 * expect([{ a: 1, b: 2 }], 'to yield exactly', [{ a: 1 }]); // fails (extra prop)
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-exactly-array
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsExactlyAssertion = createAssertion(
  [SyncIterableOrIteratorSchema, 'to yield exactly', z.array(UnknownSchema)],
  (subject, expected) => {
    const actual = collectSync(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    return { schema, subject: actual };
  },
);

/**
 * Asserts that an iterable yields values that satisfy the expected sequence.
 *
 * Uses satisfy/partial matching semantics on the collected array.
 *
 * @example
 *
 * ```ts
 * expect([{ a: 1, b: 2 }], 'to yield sequence satisfying', [{ a: 1 }]); // passes
 * expect([1, 2, 3], 'to yield array satisfying', [1, 2, 3]); // passes
 * ```
 *
 * @group Sync Iterable Assertions
 * @bupkisAnchor iterable-to-yield-sequence-satisfying-array
 * @bupkisAssertionCategory iterable
 */
export const iterableYieldsSequenceSatisfyingAssertion = createAssertion(
  [
    SyncIterableOrIteratorSchema,
    ['to yield sequence satisfying', 'to yield array satisfying'],
    z.array(UnknownSchema),
  ],
  (subject, expected) => {
    const actual = collectSync(subject);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    return { schema, subject: actual };
  },
);

// =============================================================================
// Export all sync iterable assertions as a tuple
// =============================================================================

/**
 * All synchronous iterable assertions bundled as a tuple for convenient
 * registration.
 */
export const SyncIterableAssertions = [
  // 'to yield' - any item matches
  iterableYieldsAssertion,
  iterableYieldsExhaustivelyAssertion,

  // 'to yield items' - all items must match
  iterableYieldsItemsSatisfyingAssertion,
  iterableYieldsItemsExhaustivelyAssertion,

  // First/last assertions
  iterableYieldsFirstAssertion,
  iterableYieldsFirstExhaustivelyAssertion,
  iterableYieldsLastAssertion,
  iterableYieldsLastExhaustivelyAssertion,

  // Cardinality
  iterableYieldsCountAssertion,
  iterableYieldsAtLeastAssertion,
  iterableYieldsAtMostAssertion,
  iterableEmptyAssertion,

  // Sequence
  iterableYieldsExactlyAssertion,
  iterableYieldsSequenceSatisfyingAssertion,
] as const;
