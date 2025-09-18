import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-parametric.js';
import { SyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import { extractPhrases } from './property-test-util.js';
import {
  assertExhaustiveTestConfigs,
  runPropertyTests,
} from './property-test.macro.js';

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Test configurations for each parametric assertion.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.arrayDeepEqualAssertion,
    {
      invalid: {
        generators: [
          fc.constant([1, 2, 3]),
          fc.constantFrom(
            ...extractPhrases(assertions.arrayDeepEqualAssertion),
          ),
          fc.constant([1, 2, 4]),
        ],
      },
      valid: {
        generators: [
          fc.constant([1, 2, 3]),
          fc.constantFrom(
            ...extractPhrases(assertions.arrayDeepEqualAssertion),
          ),
          fc.constant([1, 2, 3]),
        ],
      },
    },
  ],

  [
    assertions.arraySatisfiesAssertion,
    {
      invalid: {
        generators: [
          fc.constant([1, 2, 'hello']),
          fc.constantFrom(
            ...extractPhrases(assertions.arraySatisfiesAssertion),
          ),
          fc.constant([1, 2, 3]), // Should be all numbers, but input has string
        ],
      },
      valid: {
        generators: [
          fc.constant([1, 2, 3]),
          fc.constantFrom(
            ...extractPhrases(assertions.arraySatisfiesAssertion),
          ),
          fc.constant([1, 2, 3]), // Should be all numbers, and input matches
        ],
      },
    },
  ],

  [
    assertions.errorMessageAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Error('hello world')),
          fc.constantFrom(...extractPhrases(assertions.errorMessageAssertion)),
          fc.constant('goodbye'),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Error('hello world')),
          fc.constantFrom(...extractPhrases(assertions.errorMessageAssertion)),
          fc.constant('hello world'),
        ],
      },
    },
  ],

  [
    assertions.errorMessageMatchingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(new Error('hello world')),
          fc.constantFrom(
            ...extractPhrases(assertions.errorMessageMatchingAssertion),
          ),
          fc.constant(/goodbye/),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Error('hello world')),
          fc.constantFrom(
            ...extractPhrases(assertions.errorMessageMatchingAssertion),
          ),
          fc.constant(/hello/),
        ],
      },
    },
  ],

  [
    assertions.functionArityAssertion,
    {
      invalid: {
        generators: [
          fc.constant((a: number, b: number) => a + b),
          fc.constantFrom(...extractPhrases(assertions.functionArityAssertion)),
          fc.constant(3),
        ],
      },
      valid: {
        generators: [
          fc.constant((a: number, b: number) => a + b),
          fc.constantFrom(...extractPhrases(assertions.functionArityAssertion)),
          fc.constant(2),
        ],
      },
    },
  ],

  [
    assertions.functionThrowsAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => 'no error'),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsAssertion),
          ),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('test error');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsAssertion),
          ),
        ],
      },
    },
  ],

  [
    assertions.functionThrowsMatchingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('hello world');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsMatchingAssertion),
          ),
          fc.constant(/goodbye/),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('hello world');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsMatchingAssertion),
          ),
          fc.constant(/hello/),
        ],
      },
    },
  ],

  [
    assertions.functionThrowsTypeAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('test');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsTypeAssertion),
          ),
          fc.constant(TypeError),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('test');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsTypeAssertion),
          ),
          fc.constant(Error),
        ],
      },
    },
  ],

  [
    assertions.functionThrowsTypeSatisfyingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('test message');
          }),
          fc.constantFrom('to throw a', 'to throw an'),
          fc.constant(TypeError), // Expect TypeError but will get Error
          fc.constant('satisfying'),
          fc.constant({ message: 'test message' }),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('test message');
          }),
          fc.constantFrom('to throw a', 'to throw an'),
          fc.constant(Error), // Expect Error and will get Error
          fc.constant('satisfying'),
          fc.constant({ message: 'test message' }),
        ],
      },
    },
  ],

  [
    assertions.instanceOfAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
          fc.constant(Error),
        ],
      },
      valid: {
        generators: [
          fc.constant(new Error('test')),
          fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
          fc.constant(Error),
        ],
      },
    },
  ],

  [
    assertions.numberCloseToAssertion,
    {
      invalid: {
        generators: [
          fc.constant(10),
          fc.constantFrom(...extractPhrases(assertions.numberCloseToAssertion)),
          fc.constant(5),
          fc.constant(2),
        ],
      },
      valid: {
        generators: [
          fc.constant(5.5),
          fc.constantFrom(...extractPhrases(assertions.numberCloseToAssertion)),
          fc.constant(5),
          fc.constant(1),
        ],
      },
    },
  ],

  [
    assertions.numberGreaterThanAssertion,
    {
      invalid: {
        generators: [
          fc.integer({ max: 10 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanAssertion),
          ),
          fc.integer({ min: 10 }),
        ],
      },
      valid: {
        generators: [
          fc.integer({ min: 11 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanAssertion),
          ),
          fc.integer({ max: 10 }),
        ],
      },
    },
  ],

  [
    assertions.numberGreaterThanOrEqualAssertion,
    {
      invalid: {
        generators: [
          fc.integer({ max: 9 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanOrEqualAssertion),
          ),
          fc.integer({ min: 10 }),
        ],
      },
      valid: {
        generators: [
          fc.integer({ min: 10 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanOrEqualAssertion),
          ),
          fc.integer({ max: 10 }),
        ],
      },
    },
  ],

  [
    assertions.numberLessThanAssertion,
    {
      invalid: {
        generators: [
          fc.integer({ min: 11 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanAssertion),
          ),
          fc.integer({ max: 10 }),
        ],
      },
      valid: {
        generators: [
          fc.integer({ max: 10 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanAssertion),
          ),
          fc.integer({ min: 10 }),
        ],
      },
    },
  ],

  [
    assertions.numberLessThanOrEqualAssertion,
    {
      invalid: {
        generators: [
          fc.integer({ min: 10 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanOrEqualAssertion),
          ),
          fc.integer({ max: 10 }),
        ],
      },
      valid: {
        generators: [
          fc.integer({ max: 10 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanOrEqualAssertion),
          ),
          fc.integer({ min: 10 }),
        ],
      },
    },
  ],

  [
    assertions.numberWithinRangeAssertion,
    {
      invalid: {
        generators: [
          fc.constant(15),
          fc.constantFrom(
            ...extractPhrases(assertions.numberWithinRangeAssertion),
          ),
          fc.constant(5),
          fc.constant(10),
        ],
      },
      valid: {
        generators: [
          fc.constant(7),
          fc.constantFrom(
            ...extractPhrases(assertions.numberWithinRangeAssertion),
          ),
          fc.constant(5),
          fc.constant(10),
        ],
      },
    },
  ],

  [
    assertions.objectDeepEqualAssertion,
    {
      invalid: {
        generators: [
          fc.constant({ a: 1, b: 2 }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectDeepEqualAssertion),
          ),
          fc.constant({ a: 1, b: 3 }),
        ],
      },
      valid: {
        generators: [
          fc.constant({ a: 1, b: 2 }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectDeepEqualAssertion),
          ),
          fc.constant({ a: 1, b: 2 }),
        ],
      },
    },
  ],

  [
    assertions.objectSatisfiesAssertion,
    {
      invalid: {
        generators: [
          fc.constant({ age: 'old', name: 'john' }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectSatisfiesAssertion),
          ),
          fc.constant({ age: 25, name: 'john' }), // Should have number age, but input has string
        ],
      },
      valid: {
        generators: [
          fc.constant({ age: 25, name: 'john' }),
          fc.constantFrom(
            ...extractPhrases(assertions.objectSatisfiesAssertion),
          ),
          fc.constant({ age: 25, name: 'john' }), // Should have number age, and input matches
        ],
      },
    },
  ],

  [
    assertions.oneOfAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.oneOfAssertion)),
          fc.array(fc.integer()),
        ],
      },
      valid: {
        generators: [
          fc.oneof(
            fc.constant('test'),
            fc.constant('other1'),
            fc.constant('other2'),
          ),
          fc.constantFrom(...extractPhrases(assertions.oneOfAssertion)),
          fc.constant(['test', 'other1', 'other2']),
        ],
      },
    },
  ],

  [
    assertions.strictEqualityAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(
            ...extractPhrases(assertions.strictEqualityAssertion),
          ),
          fc.integer(),
        ],
      },
      valid: {
        generators: [
          fc.constant(42),
          fc.constantFrom(
            ...extractPhrases(assertions.strictEqualityAssertion),
          ),
          fc.constant(42),
        ],
      },
    },
  ],

  [
    assertions.stringBeginsWithAssertion,
    {
      invalid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringBeginsWithAssertion),
          ),
          fc.constant('goodbye'),
        ],
      },
      valid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringBeginsWithAssertion),
          ),
          fc.constant('hello'),
        ],
      },
    },
  ],

  [
    assertions.stringEndsWithAssertion,
    {
      invalid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringEndsWithAssertion),
          ),
          fc.constant('hello'),
        ],
      },
      valid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringEndsWithAssertion),
          ),
          fc.constant('world'),
        ],
      },
    },
  ],

  [
    assertions.stringGreaterThanAssertion,
    {
      invalid: {
        generators: [
          fc.constant('apple'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringGreaterThanAssertion),
          ),
          fc.constant('banana'),
        ],
      },
      valid: {
        generators: [
          fc.constant('zebra'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringGreaterThanAssertion),
          ),
          fc.constant('apple'),
        ],
      },
    },
  ],

  [
    assertions.stringGreaterThanOrEqualAssertion,
    {
      invalid: {
        generators: [
          fc.constant('apple'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringGreaterThanOrEqualAssertion),
          ),
          fc.constant('banana'),
        ],
      },
      valid: {
        generators: [
          fc.constant('zebra'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringGreaterThanOrEqualAssertion),
          ),
          fc.constant('apple'),
        ],
      },
    },
  ],

  [
    assertions.stringIncludesAssertion,
    {
      invalid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringIncludesAssertion),
          ),
          fc.constant('goodbye'),
        ],
      },
      valid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringIncludesAssertion),
          ),
          fc.constant('world'),
        ],
      },
    },
  ],

  [
    assertions.stringLessThanAssertion,
    {
      invalid: {
        generators: [
          fc.constant('zebra'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringLessThanAssertion),
          ),
          fc.constant('apple'),
        ],
      },
      valid: {
        generators: [
          fc.constant('apple'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringLessThanAssertion),
          ),
          fc.constant('zebra'),
        ],
      },
    },
  ],

  [
    assertions.stringLessThanOrEqualAssertion,
    {
      invalid: {
        generators: [
          fc.constant('zebra'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringLessThanOrEqualAssertion),
          ),
          fc.constant('apple'),
        ],
      },
      valid: {
        generators: [
          fc.constant('apple'),
          fc.constantFrom(
            ...extractPhrases(assertions.stringLessThanOrEqualAssertion),
          ),
          fc.constant('zebra'),
        ],
      },
    },
  ],

  [
    assertions.stringMatchesAssertion,
    {
      invalid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(...extractPhrases(assertions.stringMatchesAssertion)),
          fc.constant(/goodbye/),
        ],
      },
      valid: {
        generators: [
          fc.constant('hello world'),
          fc.constantFrom(...extractPhrases(assertions.stringMatchesAssertion)),
          fc.constant(/hello/),
        ],
      },
    },
  ],

  [
    assertions.typeOfAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.typeOfAssertion)),
          fc.constant('number'),
        ],
      },
      valid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.typeOfAssertion)),
          fc.constant('string'),
        ],
      },
    },
  ],
]);

describe('Property-Based Tests for Sync Parametric Assertions', () => {
  assertExhaustiveTestConfigs(
    'Sync Parametric Assertions',
    SyncParametricAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
