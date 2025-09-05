import fc from 'fast-check';
import { describe } from 'node:test';

import { ParametricAssertions } from '../../src/assertion/impl/sync-parametric.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(ParametricAssertions, 'id');

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {
  numRuns: 200,
} as const;

/**
 * Helper generators for parametric testing
 */
const helperGenerators = {
  anyValue: fc.anything(),
  errorThrowingFunction: fc.constant(() => {
    throw new TypeError('specific error');
  }),
  nonThrowingFunction: fc.constant(() => 'no error'),
  throwingFunction: fc.constant(() => {
    throw new Error('test error');
  }),
} as const;

/**
 * Test configurations for each parametric assertion.
 */
const testConfigs = {
  // type checking
  'any-to-be-a-to-be-an-string-number-boolean-undefined-null-bigint-bigint-symbol-symbol-object-object-function-function-array-array-date-date-map-map-set-set-weakmap-weakmap-weakset-weakset-regexp-regexp-promise-promise-error-error-weakref-weakref-3s3p':
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'any-to-be-a-to-be-an-string-number-boolean-undefined-null-bigint-bigint-symbol-symbol-object-object-function-function-array-array-date-date-map-map-set-set-weakmap-weakmap-weakset-weakset-regexp-regexp-promise-promise-error-error-weakref-weakref-3s3p'
              ]!,
            ),
          ),
          fc.constant('number'), // String is not a number
        ] as const,
      },
      valid: {
        generators: [
          fc.string(),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'any-to-be-a-to-be-an-string-number-boolean-undefined-null-bigint-bigint-symbol-symbol-object-object-function-function-array-array-date-date-map-map-set-set-weakmap-weakmap-weakset-weakset-regexp-regexp-promise-promise-error-error-weakref-weakref-3s3p'
              ]!,
            ),
          ),
          fc.constant('string'),
        ] as const,
      },
    },

  // deep equality - arrays
  'array-any-object-to-deep-equal-to-deeply-equal-array-any-object-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.string()),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'array-any-object-to-deep-equal-to-deeply-equal-array-any-object-3s3p'
            ]!,
          ),
        ),
        fc.array(fc.integer()), // Different element types
      ] as const,
    },
    valid: {
      generators: [
        fc
          .array(fc.string())
          .chain((arr) => fc.tuple(fc.constant(arr), fc.constant([...arr])))
          .map(([arr]) => arr),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'array-any-object-to-deep-equal-to-deeply-equal-array-any-object-3s3p'
            ]!,
          ),
        ),
        fc
          .array(fc.string())
          .chain((arr) => fc.tuple(fc.constant(arr), fc.constant([...arr])))
          .map(([, arr]) => arr),
      ] as const,
      numRuns: 50,
    },
  },

  // array satisfies/is like
  'array-any-object-to-satisfy-to-be-like-array-any-object-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.string(), { maxLength: 2, minLength: 2 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'array-any-object-to-satisfy-to-be-like-array-any-object-3s3p'
            ]!,
          ),
        ),
        fc.array(fc.string(), { maxLength: 3, minLength: 3 }), // Different length
      ] as const,
    },
    valid: {
      generators: [
        fc.array(fc.string(), { maxLength: 3, minLength: 3 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'array-any-object-to-satisfy-to-be-like-array-any-object-3s3p'
            ]!,
          ),
        ),
        fc.array(fc.string(), { maxLength: 2, minLength: 2 }), // Subset array
      ] as const,
    },
  },

  // function throws (no specific error)
  'functionschema-to-throw-2s2p': {
    invalid: {
      generators: [
        helperGenerators.nonThrowingFunction,
        fc.constantFrom(
          ...extractPhrases(assertions['functionschema-to-throw-2s2p']!),
        ),
      ] as const,
    },
    valid: {
      generators: [
        helperGenerators.throwingFunction,
        fc.constantFrom(
          ...extractPhrases(assertions['functionschema-to-throw-2s2p']!),
        ),
      ] as const,
    },
  },

  // function throws specific error type
  'functionschema-to-throw-a-to-thrown-an-classschema-3s3p': {
    invalid: {
      generators: [
        helperGenerators.errorThrowingFunction, // Throws TypeError, not Error
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'functionschema-to-throw-a-to-thrown-an-classschema-3s3p'
            ]!,
          ),
        ),
        fc.constant(Error),
      ] as const,
    },
    valid: {
      generators: [
        helperGenerators.errorThrowingFunction,
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'functionschema-to-throw-a-to-thrown-an-classschema-3s3p'
            ]!,
          ),
        ),
        fc.constant(TypeError),
      ] as const,
    },
  },

  // function throws error type with message
  'functionschema-to-throw-a-to-thrown-an-classschema-satisfying-string-regexp-object-5s5p':
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new TypeError('wrong message');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'functionschema-to-throw-a-to-thrown-an-classschema-satisfying-string-regexp-object-5s5p'
              ]!,
            ),
          ),
          fc.constant(TypeError),
          fc.constant('satisfying'),
          fc.constant('specific'),
        ] as const,
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new TypeError('specific error');
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'functionschema-to-throw-a-to-thrown-an-classschema-satisfying-string-regexp-object-5s5p'
              ]!,
            ),
          ),
          fc.constant(TypeError),
          fc.constant('satisfying'),
          fc.constant('specific'),
        ] as const,
      },
    },

  // function throws with message/pattern
  'functionschema-to-throw-string-regexp-object-3s3p': {
    invalid: {
      generators: [
        fc.constant(() => {
          throw new Error('different message');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-throw-string-regexp-object-3s3p']!,
          ),
        ),
        fc.constant('specific error'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(() => {
          throw new Error('specific error');
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['functionschema-to-throw-string-regexp-object-3s3p']!,
          ),
        ),
        fc.constant('specific error'),
      ] as const,
    },
  },

  // greater than
  'number-to-be-greater-than-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ max: 10 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['number-to-be-greater-than-number-3s3p']!,
          ),
        ),
        fc.integer({ min: 10 }), // First number <= second number
      ] as const,
    },
    valid: {
      generators: [
        fc.integer({ min: 11 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['number-to-be-greater-than-number-3s3p']!,
          ),
        ),
        fc.integer({ max: 10 }),
      ] as const,
    },
  },

  // greater than or equal to
  'number-to-be-greater-than-or-equal-to-to-be-at-least-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ max: 9 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'number-to-be-greater-than-or-equal-to-to-be-at-least-number-3s3p'
            ]!,
          ),
        ),
        fc.integer({ min: 10 }), // First number < second number
      ] as const,
    },
    valid: {
      generators: [
        fc.integer({ min: 10 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'number-to-be-greater-than-or-equal-to-to-be-at-least-number-3s3p'
            ]!,
          ),
        ),
        fc.integer({ max: 10 }),
      ] as const,
    },
  },

  // less than
  'number-to-be-less-than-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ min: 10 }),
        fc.constantFrom(
          ...extractPhrases(assertions['number-to-be-less-than-number-3s3p']!),
        ),
        fc.integer({ max: 10 }), // First number >= second number
      ] as const,
    },
    valid: {
      generators: [
        fc.integer({ max: 9 }),
        fc.constantFrom(
          ...extractPhrases(assertions['number-to-be-less-than-number-3s3p']!),
        ),
        fc.integer({ min: 10 }),
      ] as const,
    },
  },

  // less than or equal to
  'number-to-be-less-than-or-equal-to-to-be-at-most-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ min: 11 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'number-to-be-less-than-or-equal-to-to-be-at-most-number-3s3p'
            ]!,
          ),
        ),
        fc.integer({ max: 10 }), // First number > second number
      ] as const,
    },
    valid: {
      generators: [
        fc.integer({ max: 10 }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'number-to-be-less-than-or-equal-to-to-be-at-most-number-3s3p'
            ]!,
          ),
        ),
        fc.integer({ min: 10 }),
      ] as const,
    },
  },

  // deep equality - objects
  'object-to-deep-equal-to-deeply-equal-object-3s3p': {
    invalid: {
      generators: [
        fc.record({ a: fc.string() }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['object-to-deep-equal-to-deeply-equal-object-3s3p']!,
          ),
        ),
        fc.record({ b: fc.string() }), // Different structure
      ] as const,
    },
    valid: {
      generators: [
        fc
          .record({ a: fc.string() })
          .chain((obj) => fc.tuple(fc.constant(obj), fc.constant({ ...obj })))
          .map(([obj]) => obj),
        fc.constantFrom(
          ...extractPhrases(
            assertions['object-to-deep-equal-to-deeply-equal-object-3s3p']!,
          ),
        ),
        fc
          .record({ a: fc.string() })
          .chain((obj) => fc.tuple(fc.constant(obj), fc.constant({ ...obj })))
          .map(([, obj]) => obj),
      ] as const,
      numRuns: 50,
    },
  },

  // object satisfies/is like
  'object-to-satisfy-to-be-like-object-3s3p': {
    invalid: {
      generators: [
        fc.record({ a: fc.constant(1), b: fc.constant(2) }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['object-to-satisfy-to-be-like-object-3s3p']!,
          ),
        ),
        fc.record({ c: fc.constant(3) }), // Missing properties
      ] as const,
    },
    valid: {
      generators: [
        fc.record({ a: fc.constant(1), b: fc.constant(2) }),
        fc.constantFrom(
          ...extractPhrases(
            assertions['object-to-satisfy-to-be-like-object-3s3p']!,
          ),
        ),
        fc.record({ a: fc.constant(1) }), // Subset properties
      ] as const,
    },
  },

  // string includes/contains
  'string-includes-contains-to-include-to-contain-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'string-includes-contains-to-include-to-contain-string-3s3p'
            ]!,
          ),
        ),
        fc.constant('xyz'), // Not contained in "hello world"
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'string-includes-contains-to-include-to-contain-string-3s3p'
            ]!,
          ),
        ),
        fc.constant('world'),
      ] as const,
    },
  },

  // string matches pattern
  'string-to-match-regexp-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello'),
        fc.constantFrom(
          ...extractPhrases(assertions['string-to-match-regexp-3s3p']!),
        ),
        fc.constant(/\d+/), // "hello" doesn't match digits
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('123'),
        fc.constantFrom(
          ...extractPhrases(assertions['string-to-match-regexp-3s3p']!),
        ),
        fc.constant(/\d+/),
      ] as const,
    },
  },

  // instance of
  'unknown-to-be-an-instance-of-to-be-a-classschema-3s2p': {
    invalid: {
      generators: [
        fc.string(),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'unknown-to-be-an-instance-of-to-be-a-classschema-3s2p'
            ]!,
          ),
        ),
        fc.constant(Array), // String is not instance of Array
      ] as const,
    },
    valid: {
      generators: [
        fc.constant([]),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'unknown-to-be-an-instance-of-to-be-a-classschema-3s2p'
            ]!,
          ),
        ),
        fc.constant(Array),
      ] as const,
    },
  },

  // strict equality
  'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-any-3s2p': {
    invalid: {
      generators: [
        fc.string(),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-any-3s2p'
            ]!,
          ),
        ),
        fc.integer(), // Different types should fail
      ] as const,
    },
    valid: {
      generators: [
        fc
          .string()
          .chain((str) => fc.tuple(fc.constant(str), fc.constant(str)))
          .map(([str]) => str),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-any-3s2p'
            ]!,
          ),
        ),
        fc
          .string()
          .chain((str) => fc.tuple(fc.constant(str), fc.constant(str)))
          .map(([, str]) => str),
      ] as const,
      numRuns: 50, // Reduce runs since equality requires exact matching
    },
  },
} satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Sync Parametric Assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);
  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
