// do not remove; otherwise zshy will not resolve the .d.ts file; it must be referenced directly
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./shims.d.ts" />
/**
 * Iterable assertions for asynchronous iterables and iterators.
 *
 * These assertions test async iterables using the **async iteration protocol**
 * (`Symbol.asyncIterator`), including async generators, Node.js Readable
 * streams, and Web ReadableStreams.
 *
 * @packageDocumentation
 * @groupDescription Async Iterable Assertions
 * Assertions for asynchronous iterables and iterators using the async iteration protocol.
 *
 * @showGroup
 */
import { inspect } from 'node:util';
import { z } from 'zod/v4';

import {
  AsyncIterableOrIteratorSchema,
  ConstructibleSchema,
  NonNegativeIntegerSchema,
  UnknownSchema,
} from '../../schema.js';
import {
  valueToSchema,
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAsyncAssertion } from '../create.js';
import {
  type AsyncIterableInput,
  collectAsync,
  countAsync,
  iterateFullyAsync,
  toAsyncIterator,
} from './iteration-util.js';

// =============================================================================
// 'to yield' assertions - check if ANY item matches
// =============================================================================

/**
 * Asserts that an async iterable yields a value satisfying the expected shape.
 *
 * Uses partial/satisfy semantics (like `'to satisfy'`). The assertion passes if
 * ANY yielded value matches the expected shape.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGenerator(), 'to yield', 'value'); // passes
 * await expectAsync(nodeReadable, 'to emit', 'chunk'); // passes
 * await expectAsync(response.body, 'to yield value satisfying', {
 *   data: 'test',
 * }); // Web Stream
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    ['to yield', 'to emit', 'to yield value satisfying'],
    UnknownSchema,
  ],
  async (subject, expected) => {
    const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    let next = await iterator.next();
    while (!next.done) {
      if (schema.safeParse(next.value).success) {
        return; // success - found a matching value
      }
      next = await iterator.next();
    }
    return {
      message: `Expected async iterable to yield a value satisfying ${inspect(expected)}, but none matched`,
    };
  },
);

/**
 * Asserts that an async iterable yields a value exhaustively matching the
 * expected value.
 *
 * Uses deep equality semantics (like `'to equal'`). Extra properties on yielded
 * values cause failure.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield value exhaustively satisfying', {
 *   a: 1,
 * }); // passes if { a: 1 } exactly is yielded
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-value-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsExhaustivelyAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    'to yield value exhaustively satisfying',
    UnknownSchema,
  ],
  async (subject, expected) => {
    const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    let next = await iterator.next();
    while (!next.done) {
      if (schema.safeParse(next.value).success) {
        return; // success - found an exact match
      }
      next = await iterator.next();
    }
    return {
      message: `Expected async iterable to yield a value exhaustively satisfying ${inspect(expected)}, but none matched`,
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
 * await expectAsync(asyncGen(), 'to yield items satisfying', {
 *   type: 'data',
 * });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-items-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsItemsSatisfyingAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, 'to yield items satisfying', UnknownSchema],
  async (subject, expected) => {
    const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
    const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
    let index = 0;
    let next = await iterator.next();
    while (!next.done) {
      const result = schema.safeParse(next.value);
      if (!result.success) {
        return {
          message: `Expected all items to satisfy ${inspect(expected)}, but item at index ${index} did not match: ${inspect(next.value)}`,
        };
      }
      index++;
      next = await iterator.next();
    }
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
 * await expectAsync(asyncGen(), 'to yield items exhaustively satisfying', {
 *   a: 1,
 * });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-items-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsItemsExhaustivelyAssertion =
  createAsyncAssertion(
    [
      AsyncIterableOrIteratorSchema,
      'to yield items exhaustively satisfying',
      UnknownSchema,
    ],
    async (subject, expected) => {
      const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
      const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
      let index = 0;
      let next = await iterator.next();
      while (!next.done) {
        const result = schema.safeParse(next.value);
        if (!result.success) {
          return {
            message: `Expected all items to exhaustively satisfy ${inspect(expected)}, but item at index ${index} did not match: ${inspect(next.value)}`,
          };
        }
        index++;
        next = await iterator.next();
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
 * await expectAsync(asyncGen(), 'to yield first', { type: 'header' });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-first-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsFirstAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    ['to yield first', 'to yield first satisfying'],
    UnknownSchema,
  ],
  async (subject, expected) => {
    const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
    const result = await iterator.next();
    if (result.done) {
      return {
        message:
          'Expected async iterable to yield at least one value, but it was empty',
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
 * await expectAsync(asyncGen(), 'to yield first exhaustively satisfying', {
 *   a: 1,
 * });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-first-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsFirstExhaustivelyAssertion =
  createAsyncAssertion(
    [
      AsyncIterableOrIteratorSchema,
      'to yield first exhaustively satisfying',
      UnknownSchema,
    ],
    async (subject, expected) => {
      const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
      const result = await iterator.next();
      if (result.done) {
        return {
          message:
            'Expected async iterable to yield at least one value, but it was empty',
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
 * Uses partial/satisfy semantics. Note: fully consumes the async iterator.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield last', { type: 'footer' });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-last-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsLastAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    ['to yield last', 'to yield last satisfying'],
    UnknownSchema,
  ],
  async (subject, expected) => {
    const { hasValue, lastValue } = await iterateFullyAsync(
      subject as AsyncIterableInput<unknown>,
    );
    if (!hasValue) {
      return {
        message:
          'Expected async iterable to yield at least one value, but it was empty',
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
 * Uses deep equality semantics. Note: fully consumes the async iterator.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield last exhaustively satisfying', {
 *   b: 2,
 * });
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-last-exhaustively-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsLastExhaustivelyAssertion =
  createAsyncAssertion(
    [
      AsyncIterableOrIteratorSchema,
      'to yield last exhaustively satisfying',
      UnknownSchema,
    ],
    async (subject, expected) => {
      const { hasValue, lastValue } = await iterateFullyAsync(
        subject as AsyncIterableInput<unknown>,
      );
      if (!hasValue) {
        return {
          message:
            'Expected async iterable to yield at least one value, but it was empty',
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
 * Asserts that an async iterable yields exactly the specified count of values.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield count', 5);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-count-number
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsCountAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, 'to yield count', NonNegativeIntegerSchema],
  async (subject, expectedCount) => {
    const actual = await countAsync(subject as AsyncIterableInput<unknown>);
    if (actual !== expectedCount) {
      return {
        actual,
        expected: expectedCount,
        message: `Expected async iterable to yield ${expectedCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable yields at least the specified count of values.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield at least', 3);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-at-least-number
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsAtLeastAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    'to yield at least',
    NonNegativeIntegerSchema,
  ],
  async (subject, minCount) => {
    const actual = await countAsync(subject as AsyncIterableInput<unknown>);
    if (actual < minCount) {
      return {
        actual,
        expected: `at least ${minCount}`,
        message: `Expected async iterable to yield at least ${minCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable yields at most the specified count of values.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield at most', 10);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-at-most-number
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsAtMostAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, 'to yield at most', NonNegativeIntegerSchema],
  async (subject, maxCount) => {
    const actual = await countAsync(subject as AsyncIterableInput<unknown>);
    if (actual > maxCount) {
      return {
        actual,
        expected: `at most ${maxCount}`,
        message: `Expected async iterable to yield at most ${maxCount} value(s), but yielded ${actual}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable yields nothing (is empty).
 *
 * @remarks
 * Use `'not to be an empty iterable'` or `'to yield at least', 1` for non-empty
 * assertions.
 * @example
 *
 * ```ts
 * await expectAsync(emptyAsyncGen(), 'to be an empty iterable');
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-be-an-empty-iterable
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableEmptyAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, 'to be an empty iterable'],
  async (subject) => {
    const iterator = toAsyncIterator(subject as AsyncIterableInput<unknown>);
    const result = await iterator.next();
    if (!result.done) {
      return {
        message: `Expected async iterable to be empty, but it yielded at least one value: ${inspect(result.value)}`,
      };
    }
  },
);

// =============================================================================
// Sequence/Collection assertions
// =============================================================================

/**
 * Asserts that an async iterable yields exactly the specified values in order.
 *
 * Uses deep equality semantics. The iterable must yield the exact same number
 * of values in the exact same order.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield exactly', [1, 2, 3]);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-exactly-array
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsExactlyAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, 'to yield exactly', z.array(UnknownSchema)],
  async (subject, expected) => {
    const actual = await collectAsync(subject as AsyncIterableInput<unknown>);
    const schema = valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    return { schema, subject: actual };
  },
);

/**
 * Asserts that an async iterable yields values that satisfy the expected
 * sequence.
 *
 * Uses satisfy/partial matching semantics on the collected array.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGen(), 'to yield sequence satisfying', [
 *   { type: 'start' },
 *   { type: 'end' },
 * ]);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-yield-sequence-satisfying-array
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableYieldsSequenceSatisfyingAssertion =
  createAsyncAssertion(
    [
      AsyncIterableOrIteratorSchema,
      ['to yield sequence satisfying', 'to yield array satisfying'],
      z.array(UnknownSchema),
    ],
    async (subject, expected) => {
      const actual = await collectAsync(subject as AsyncIterableInput<unknown>);
      const schema = valueToSchema(expected, valueToSchemaOptionsForSatisfies);
      return { schema, subject: actual };
    },
  );

// =============================================================================
// Completion/Error assertions (async-only)
// =============================================================================

/**
 * Asserts that an async iterable completes without throwing.
 *
 * Fully consumes the iterator and verifies no error is thrown during iteration.
 *
 * @example
 *
 * ```ts
 * await expectAsync(asyncGenerator(), 'to complete'); // passes if no error
 * await expectAsync(nodeReadable, 'to finish'); // passes if stream ends cleanly
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-complete
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableCompletesAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, ['to complete', 'to finish']],
  async (subject) => {
    const { completed, error } = await iterateFullyAsync(
      subject as AsyncIterableInput<unknown>,
    );
    if (!completed) {
      return {
        message: `Expected async iterable to complete, but it rejected with: ${inspect(error)}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable rejects during iteration.
 *
 * @example
 *
 * ```ts
 * await expectAsync(failingStream, 'to reject'); // passes if iteration rejects
 * await expectAsync(failingStream, 'to be rejected'); // alias
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-reject
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableRejectsAssertion = createAsyncAssertion(
  [AsyncIterableOrIteratorSchema, ['to reject', 'to be rejected']],
  async (subject) => {
    const { completed } = await iterateFullyAsync(
      subject as AsyncIterableInput<unknown>,
    );
    if (completed) {
      return {
        message:
          'Expected async iterable to reject, but it completed successfully',
      };
    }
  },
);

/**
 * Asserts that an async iterable rejects with a specific error type.
 *
 * @example
 *
 * ```ts
 * await expectAsync(failingStream, 'to reject with a', TypeError);
 * await expectAsync(failingStream, 'to reject with an', Error);
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-reject-with-a-constructor
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableRejectsWithTypeAssertion = createAsyncAssertion(
  [
    AsyncIterableOrIteratorSchema,
    ['to reject with a', 'to reject with an'],
    ConstructibleSchema,
  ],
  async (subject, expectedType) => {
    const { completed, error } = await iterateFullyAsync(
      subject as AsyncIterableInput<unknown>,
    );
    if (completed) {
      return {
        message: `Expected async iterable to reject with ${expectedType.name}, but it completed successfully`,
      };
    }
    if (!(error instanceof expectedType)) {
      return {
        message: `Expected async iterable to reject with ${expectedType.name}, but got ${inspect(error)}`,
      };
    }
  },
);

/**
 * Asserts that an async iterable rejects with an error satisfying a shape.
 *
 * @example
 *
 * ```ts
 * await expectAsync(failingStream, 'to reject with error satisfying', {
 *   message: 'Connection failed',
 * });
 * await expectAsync(
 *   failingStream,
 *   'to be rejected with error satisfying',
 *   {
 *     code: 'ECONNREFUSED',
 *   },
 * );
 * ```
 *
 * @group Async Iterable Assertions
 * @bupkisAnchor async-iterable-to-reject-with-error-satisfying-any
 * @bupkisAssertionCategory iterable
 */
export const asyncIterableRejectsWithErrorSatisfyingAssertion =
  createAsyncAssertion(
    [
      AsyncIterableOrIteratorSchema,
      [
        'to reject with error satisfying',
        'to be rejected with error satisfying',
      ],
      UnknownSchema,
    ],
    async (subject, expectedShape) => {
      const { completed, error } = await iterateFullyAsync(
        subject as AsyncIterableInput<unknown>,
      );
      if (completed) {
        return {
          message: `Expected async iterable to reject with error satisfying ${inspect(expectedShape)}, but it completed successfully`,
        };
      }
      const schema = valueToSchema(
        expectedShape,
        valueToSchemaOptionsForSatisfies,
      );
      if (!schema.safeParse(error).success) {
        return {
          message: `Expected async iterable to reject with error satisfying ${inspect(expectedShape)}, but got ${inspect(error)}`,
        };
      }
    },
  );

// =============================================================================
// Export all async iterable assertions as a tuple
// =============================================================================

/**
 * All asynchronous iterable assertions bundled as a tuple for convenient
 * registration.
 */
export const AsyncIterableAssertions = [
  // 'to yield' - any item matches
  asyncIterableYieldsAssertion,
  asyncIterableYieldsExhaustivelyAssertion,

  // 'to yield items' - all items must match
  asyncIterableYieldsItemsSatisfyingAssertion,
  asyncIterableYieldsItemsExhaustivelyAssertion,

  // First/last assertions
  asyncIterableYieldsFirstAssertion,
  asyncIterableYieldsFirstExhaustivelyAssertion,
  asyncIterableYieldsLastAssertion,
  asyncIterableYieldsLastExhaustivelyAssertion,

  // Cardinality
  asyncIterableYieldsCountAssertion,
  asyncIterableYieldsAtLeastAssertion,
  asyncIterableYieldsAtMostAssertion,
  asyncIterableEmptyAssertion,

  // Sequence
  asyncIterableYieldsExactlyAssertion,
  asyncIterableYieldsSequenceSatisfyingAssertion,

  // Completion/error (async-only)
  asyncIterableCompletesAssertion,
  asyncIterableRejectsAssertion,
  asyncIterableRejectsWithTypeAssertion,
  asyncIterableRejectsWithErrorSatisfyingAssertion,
] as const;
