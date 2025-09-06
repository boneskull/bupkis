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
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

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
        ],
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
        ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
    },
    valid: {
      generators: [
        helperGenerators.throwingFunction,
        fc.constantFrom(
          ...extractPhrases(assertions['functionschema-to-throw-2s2p']!),
        ),
      ],
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
      ],
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
      ],
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
        ],
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
        ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
    },
    valid: {
      generators: [
        fc.integer({ max: 9 }),
        fc.constantFrom(
          ...extractPhrases(assertions['number-to-be-less-than-number-3s3p']!),
        ),
        fc.integer({ min: 10 }),
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
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
      ],
    },
    valid: {
      generators: [
        fc.constant('123'),
        fc.constantFrom(
          ...extractPhrases(assertions['string-to-match-regexp-3s3p']!),
        ),
        fc.constant(/\d+/),
      ],
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
      ],
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
      ],
    },
  },

  // strict equality
  'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-unknown-3s2p':
    {
      invalid: {
        generators: [
          fc.object(),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-unknown-3s2p'
              ]!,
            ),
          ),
          fc.object(), // Different types should fail
        ],
      },
      valid: {
        generators: [
          fc.constant('test'),
          fc.constantFrom(
            ...extractPhrases(
              assertions[
                'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-unknown-3s2p'
              ]!,
            ),
          ),
          fc.constant('test'),
        ],
        numRuns: 50, // Reduce runs since equality requires exact matching
      },
    },
} satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Sync Parametric Assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);
  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
