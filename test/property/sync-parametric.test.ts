import fc from 'fast-check';
import { describe } from 'node:test';

import { ParametricAssertions } from '../../src/assertion/impl/sync-parametric.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';
import { createPhraseExtractor } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(ParametricAssertions, 'id');
const extractPhrases = createPhraseExtractor(assertions);

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
              'any-to-be-a-to-be-an-string-number-boolean-undefined-null-bigint-bigint-symbol-symbol-object-object-function-function-array-array-date-date-map-map-set-set-weakmap-weakmap-weakset-weakset-regexp-regexp-promise-promise-error-error-weakref-weakref-3s3p',
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
              'any-to-be-a-to-be-an-string-number-boolean-undefined-null-bigint-bigint-symbol-symbol-object-object-function-function-array-array-date-date-map-map-set-set-weakmap-weakmap-weakset-weakset-regexp-regexp-promise-promise-error-error-weakref-weakref-3s3p',
            ),
          ),
          fc.constant('string'),
        ],
      },
    },

  'any-to-be-one-of-array-3s3p': {
    invalid: {
      generators: [
        fc.string(),
        fc.constantFrom(...extractPhrases('any-to-be-one-of-array-3s3p')),
        fc.array(fc.integer()), // Looking for string in integer array
      ] as const,
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant('test'),
          fc.constant('other1'),
          fc.constant('other2'),
        ),
        fc.constantFrom(...extractPhrases('any-to-be-one-of-array-3s3p')),
        fc.constant(['test', 'other1', 'other2']),
      ] as const,
    },
  },

  // deep equality - arrays
  'array-unknown-object-to-deep-equal-to-deeply-equal-array-unknown-object-3s3p':
    {
      invalid: {
        generators: [
          fc.array(fc.string(), { minLength: 1 }),
          fc.constantFrom(
            ...extractPhrases(
              'array-unknown-object-to-deep-equal-to-deeply-equal-array-unknown-object-3s3p',
            ),
          ),
          fc.array(fc.integer(), { minLength: 1 }), // Different element types
        ],
      },
      valid: {
        generators: [
          fc.array(fc.string()).chain((arr) => fc.constant(arr)),
          fc.constantFrom(
            ...extractPhrases(
              'array-unknown-object-to-deep-equal-to-deeply-equal-array-unknown-object-3s3p',
            ),
          ),
          fc.array(fc.string()).chain((arr) => fc.constant([...arr])),
        ],
        numRuns: 50,
      },
    },

  // array satisfies/is like
  'array-unknown-object-to-satisfy-to-be-like-array-unknown-object-3s3p': {
    invalid: {
      generators: [
        fc.array(fc.string(), { maxLength: 2, minLength: 2 }),
        fc.constantFrom(
          ...extractPhrases(
            'array-unknown-object-to-satisfy-to-be-like-array-unknown-object-3s3p',
          ),
        ),
        fc.array(fc.integer(), { maxLength: 3, minLength: 3 }), // Different types, lengths
      ],
    },
    valid: {
      generators: [
        fc.array(fc.string(), { maxLength: 3, minLength: 3 }),
        fc.constantFrom(
          ...extractPhrases(
            'array-unknown-object-to-satisfy-to-be-like-array-unknown-object-3s3p',
          ),
        ),
        fc.array(fc.string(), { maxLength: 2, minLength: 2 }), // Subset array
      ],
    },
  },

  'error-to-have-message-matching-regexp-3s3p': {
    invalid: {
      generators: [
        fc.constant(new Error('wrong message')),
        fc.constantFrom(
          ...extractPhrases('error-to-have-message-matching-regexp-3s3p'),
        ),
        fc.constant(/expected/),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Error('expected message')),
        fc.constantFrom(
          ...extractPhrases('error-to-have-message-matching-regexp-3s3p'),
        ),
        fc.constant(/expected/),
      ] as const,
    },
  },

  'error-to-have-message-string-3s3p': {
    invalid: {
      generators: [
        fc.constant(new Error('wrong message')),
        fc.constantFrom(...extractPhrases('error-to-have-message-string-3s3p')),
        fc.constant('expected message'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(new Error('expected message')),
        fc.constantFrom(...extractPhrases('error-to-have-message-string-3s3p')),
        fc.constant('expected message'),
      ] as const,
    },
  },

  'functionschema-to-have-arity-number-3s3p': {
    invalid: {
      generators: [
        fc.constant(() => {}), // Zero arity
        fc.constantFrom(
          ...extractPhrases('functionschema-to-have-arity-number-3s3p'),
        ),
        fc.constant(2), // Expecting 2 arguments
      ] as const,
    },
    valid: {
      generators: [
        fc.constant((_a: any, _b: any) => {}), // Two arity
        fc.constantFrom(
          ...extractPhrases('functionschema-to-have-arity-number-3s3p'),
        ),
        fc.constant(2), // Expecting 2 arguments
      ] as const,
    },
  },

  // function throws (no specific error)
  'functionschema-to-throw-2s2p': {
    invalid: {
      generators: [
        helperGenerators.nonThrowingFunction,
        fc.constantFrom(...extractPhrases('functionschema-to-throw-2s2p')),
      ],
    },
    valid: {
      generators: [
        helperGenerators.throwingFunction,
        fc.constantFrom(...extractPhrases('functionschema-to-throw-2s2p')),
      ],
    },
  },

  // function throws specific error type
  'functionschema-to-throw-a-to-thrown-an-classschema-3s3p': {
    invalid: {
      generators: [
        helperGenerators.throwingFunction, // Throws Error, expecting TypeError (wrong type)
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-throw-a-to-thrown-an-classschema-3s3p',
          ),
        ),
        fc.constant(TypeError),
      ],
    },
    valid: {
      generators: [
        helperGenerators.errorThrowingFunction, // Throws TypeError, expecting TypeError (correct type)
        fc.constantFrom(
          ...extractPhrases(
            'functionschema-to-throw-a-to-thrown-an-classschema-3s3p',
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
            throw new TypeError('different message');
          }),
          fc.constantFrom('to throw a', 'to thrown an'),
          fc.constant(TypeError),
          fc.constant('satisfying'),
          fc.constant('specific'), // Looking for 'specific' in 'different message' (should fail)
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new TypeError('specific error');
          }),
          fc.constantFrom('to throw a', 'to thrown an'),
          fc.constant(TypeError),
          fc.constant('satisfying'),
          fc.constant('specific'), // Looking for 'specific' in 'specific error' (should pass)
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
            'functionschema-to-throw-string-regexp-object-3s3p',
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
            'functionschema-to-throw-string-regexp-object-3s3p',
          ),
        ),
        fc.constant('specific error'),
      ],
    },
  },

  'number-to-be-close-to-number-number-4s4p': {
    invalid: {
      generators: [
        fc.constant(5.0),
        fc.constantFrom(
          ...extractPhrases('number-to-be-close-to-number-number-4s4p'),
        ),
        fc.constant(10.0), // Target
        fc.constant(2.0), // Delta
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(9.5),
        fc.constantFrom(
          ...extractPhrases('number-to-be-close-to-number-number-4s4p'),
        ),
        fc.constant(10.0), // Target
        fc.constant(2.0), // Delta (9.5 is within 2 of 10)
      ] as const,
    },
  },

  // greater than
  'number-to-be-greater-than-number-3s3p': {
    invalid: {
      generators: [
        fc.integer({ max: 10 }),
        fc.constantFrom(
          ...extractPhrases('number-to-be-greater-than-number-3s3p'),
        ),
        fc.integer({ min: 10 }), // First number <= second number
      ],
    },
    valid: {
      generators: [
        fc.integer({ min: 11 }),
        fc.constantFrom(
          ...extractPhrases('number-to-be-greater-than-number-3s3p'),
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
            'number-to-be-greater-than-or-equal-to-to-be-at-least-number-3s3p',
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
            'number-to-be-greater-than-or-equal-to-to-be-at-least-number-3s3p',
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
          ...extractPhrases('number-to-be-less-than-number-3s3p'),
        ),
        fc.integer({ max: 10 }), // First number >= second number
      ],
    },
    valid: {
      generators: [
        fc.integer({ max: 9 }),
        fc.constantFrom(
          ...extractPhrases('number-to-be-less-than-number-3s3p'),
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
            'number-to-be-less-than-or-equal-to-to-be-at-most-number-3s3p',
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
            'number-to-be-less-than-or-equal-to-to-be-at-most-number-3s3p',
          ),
        ),
        fc.integer({ min: 10 }),
      ],
    },
  },

  'number-to-be-within-to-be-between-number-number-4s4p': {
    invalid: {
      generators: [
        fc.constant(0),
        fc.constantFrom(
          ...extractPhrases(
            'number-to-be-within-to-be-between-number-number-4s4p',
          ),
        ),
        fc.constant(5), // Min
        fc.constant(10), // Max
      ] as const,
    },
    valid: {
      generators: [
        fc.constant(7),
        fc.constantFrom(
          ...extractPhrases(
            'number-to-be-within-to-be-between-number-number-4s4p',
          ),
        ),
        fc.constant(5), // Min
        fc.constant(10), // Max
      ] as const,
    },
  },

  // deep equality - objects
  'object-to-deep-equal-to-deeply-equal-object-3s3p': {
    invalid: {
      generators: [
        fc.record({ a: fc.string() }),
        fc.constantFrom(
          ...extractPhrases('object-to-deep-equal-to-deeply-equal-object-3s3p'),
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
          ...extractPhrases('object-to-deep-equal-to-deeply-equal-object-3s3p'),
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
          ...extractPhrases('object-to-satisfy-to-be-like-object-3s3p'),
        ),
        fc.record({ c: fc.constant(3) }), // Missing properties
      ],
    },
    valid: {
      generators: [
        fc.record({ a: fc.constant(1), b: fc.constant(2) }),
        fc.constantFrom(
          ...extractPhrases('object-to-satisfy-to-be-like-object-3s3p'),
        ),
        fc.record({ a: fc.constant(1) }), // Subset properties
      ],
    },
  },
  'string-includes-contains-to-include-to-contain-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(
          ...extractPhrases(
            'string-includes-contains-to-include-to-contain-string-3s3p',
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
            'string-includes-contains-to-include-to-contain-string-3s3p',
          ),
        ),
        fc.constant('world'),
      ],
    },
  },

  // string includes/contains

  'string-to-be-greater-than-or-equal-to-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('apple'),
        fc.constantFrom(
          ...extractPhrases(
            'string-to-be-greater-than-or-equal-to-string-3s3p',
          ),
        ),
        fc.constant('zebra'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('zebra'),
        fc.constantFrom(
          ...extractPhrases(
            'string-to-be-greater-than-or-equal-to-string-3s3p',
          ),
        ),
        fc.constant('apple'),
      ] as const,
    },
  },

  'string-to-be-greater-than-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('apple'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-greater-than-string-3s3p'),
        ),
        fc.constant('zebra'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('zebra'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-greater-than-string-3s3p'),
        ),
        fc.constant('apple'),
      ] as const,
    },
  },

  'string-to-be-less-than-or-equal-to-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('zebra'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-less-than-or-equal-to-string-3s3p'),
        ),
        fc.constant('apple'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('apple'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-less-than-or-equal-to-string-3s3p'),
        ),
        fc.constant('zebra'),
      ] as const,
    },
  },

  'string-to-be-less-than-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('zebra'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-less-than-string-3s3p'),
        ),
        fc.constant('apple'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('apple'),
        fc.constantFrom(
          ...extractPhrases('string-to-be-less-than-string-3s3p'),
        ),
        fc.constant('zebra'),
      ] as const,
    },
  },

  'string-to-begin-with-to-start-with-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(
          ...extractPhrases('string-to-begin-with-to-start-with-string-3s3p'),
        ),
        fc.constant('goodbye'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(
          ...extractPhrases('string-to-begin-with-to-start-with-string-3s3p'),
        ),
        fc.constant('hello'),
      ] as const,
    },
  },

  'string-to-end-with-string-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(...extractPhrases('string-to-end-with-string-3s3p')),
        fc.constant('goodbye'),
      ] as const,
    },
    valid: {
      generators: [
        fc.constant('hello world'),
        fc.constantFrom(...extractPhrases('string-to-end-with-string-3s3p')),
        fc.constant('world'),
      ] as const,
    },
  },

  // string matches pattern
  'string-to-match-regexp-3s3p': {
    invalid: {
      generators: [
        fc.constant('hello'),
        fc.constantFrom(...extractPhrases('string-to-match-regexp-3s3p')),
        fc.constant(/\d+/), // "hello" doesn't match digits
      ],
    },
    valid: {
      generators: [
        fc.constant('123'),
        fc.constantFrom(...extractPhrases('string-to-match-regexp-3s3p')),
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
            'unknown-to-be-an-instance-of-to-be-a-classschema-3s2p',
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
            'unknown-to-be-an-instance-of-to-be-a-classschema-3s2p',
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
              'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-unknown-3s2p',
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
              'unknown-to-be-to-equal-equals-is-is-equal-to-to-strictly-equal-unknown-3s2p',
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
